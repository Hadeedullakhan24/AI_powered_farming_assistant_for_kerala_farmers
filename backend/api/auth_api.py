import os
import logging

logger = logging.getLogger("hexakrishi.auth")
import time
import json
import base64
import hmac
import hashlib
from datetime import datetime
from typing import Optional
try:
    from pymongo.errors import DuplicateKeyError
except ImportError:
    class DuplicateKeyError(Exception):
        pass

from fastapi import APIRouter, HTTPException, Header, Body
from pydantic import BaseModel

from backend.database.mongo import get_users_collection

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

JWT_SECRET = os.getenv("JWT_SECRET", "hexakrishi_secret_key_2026_safe_auth")

# In-memory user fallback storage if MongoDB service is offline
_in_memory_users = {}

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class LanguageUpdateRequest(BaseModel):
    preferredLanguage: str

# ─── Password Hashing (Bcrypt with Fallback) ──────────────────────────────────

try:
    import bcrypt

    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(password: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        except Exception:
            return False

except ImportError:
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        def hash_password(password: str) -> str:
            return pwd_context.hash(password)

        def verify_password(password: str, hashed: str) -> bool:
            try:
                return pwd_context.verify(password, hashed)
            except Exception:
                return False

    except ImportError:
        def hash_password(password: str) -> str:
            salt = "hexakrishi_bcrypt_fallback_salt"
            return "$pbkdf2$" + hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()

        def verify_password(password: str, hashed: str) -> bool:
            if hashed.startswith("$pbkdf2$"):
                return hash_password(password) == hashed
            return False

# ─── JWT Helpers ──────────────────────────────────────────────────────────────

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def create_jwt_token(payload: dict) -> str:
    """Generate a lightweight HMAC-SHA256 JWT Token with 7-day expiration."""
    header = {"alg": "HS256", "typ": "JWT"}
    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    encoded_header = base64url_encode(header_bytes)

    # 7-day expiration (7 * 24 * 3600 seconds)
    payload_copy = payload.copy()
    payload_copy['exp'] = int(time.time()) + (7 * 24 * 3600)
    payload_bytes = json.dumps(payload_copy, separators=(',', ':')).encode('utf-8')
    encoded_payload = base64url_encode(payload_bytes)

    signature_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(JWT_SECRET.encode('utf-8'), signature_input, hashlib.sha256).digest()
    encoded_signature = base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def decode_jwt_token(token: str) -> dict:
    """Decode and verify an HMAC-SHA256 JWT Token."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Invalid token structure")

        encoded_header, encoded_payload, encoded_signature = parts
        signature_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
        expected_sig = base64url_encode(
            hmac.new(JWT_SECRET.encode('utf-8'), signature_input, hashlib.sha256).digest()
        )

        if not hmac.compare_digest(encoded_signature, expected_sig):
            raise ValueError("Invalid signature")

        padding = '=' * (4 - (len(encoded_payload) % 4))
        payload_json = base64.urlsafe_b64decode(encoded_payload + padding).decode('utf-8')
        payload = json.loads(payload_json)

        if 'exp' in payload and time.time() > payload['exp']:
            raise ValueError("Token expired")

        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authorization token: {str(e)}")

def get_current_user_from_token(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ")[1]
    payload = decode_jwt_token(token)
    email = payload.get("email")

    users_col = get_users_collection()
    if users_col is not None:
        user_doc = users_col.find_one({"email": email})
        if user_doc:
            return {
                "id": str(user_doc["_id"]),
                "name": user_doc.get("name", ""),
                "email": user_doc.get("email", ""),
                "preferredLanguage": user_doc.get("preferredLanguage", "en"),
                "role": user_doc.get("role", "farmer")
            }

    # Fallback to in-memory store
    if email in _in_memory_users:
        u = _in_memory_users[email].copy()
        u.pop("passwordHash", None)
        u.pop("password_hash", None)
        return u

    raise HTTPException(status_code=401, detail="User not found")

# ─── Auth Endpoints ───────────────────────────────────────────────────────────

@router.post("/register")
def register_user(req: RegisterRequest):
    email = req.email.strip().lower()
    name = req.name.strip()

    if not name or not email or not req.password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required")

    users_col = get_users_collection()
    password_hashed = hash_password(req.password)

    user_doc = {
        "name": name,
        "email": email,
        "passwordHash": password_hashed,
        "preferredLanguage": "en",
        "role": "farmer",
        "createdAt": datetime.utcnow().isoformat()
    }

    if users_col is not None:
        # Check existing
        existing = users_col.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists")

        try:
            res = users_col.insert_one(user_doc)
            user_id = str(res.inserted_id)
            logger.info("[MONGODB ATLAS] Saved user '%s' (%s) to collection 'users' (ID: %s)", name, email, user_id)
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="User with this email already exists")

        token = create_jwt_token({"user_id": user_id, "email": email})
        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "preferredLanguage": "en",
                "role": "farmer"
            }
        }
    else:
        # MongoDB is unavailable — surface the error clearly instead of hiding it
        raise HTTPException(
            status_code=503,
            detail="Database is currently unavailable. Please ensure the backend can connect to MongoDB Atlas and that your IP is whitelisted in Atlas Network Access."
        )

@router.post("/login")
def login_user(req: LoginRequest):
    email = req.email.strip().lower()

    users_col = get_users_collection()

    if users_col is not None:
        user_doc = users_col.find_one({"email": email})
        stored_hash = user_doc.get("passwordHash") or user_doc.get("password_hash") if user_doc else None

        if not user_doc or not stored_hash or not verify_password(req.password, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user_id = str(user_doc["_id"])
        logger.info("[MONGODB ATLAS] User '%s' successfully authenticated from collection 'users'", email)
        token = create_jwt_token({"user_id": user_id, "email": email})

        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": user_doc.get("name", ""),
                "email": user_doc.get("email", ""),
                "preferredLanguage": user_doc.get("preferredLanguage", "en"),
                "role": user_doc.get("role", "farmer")
            }
        }
    else:
        # MongoDB is unavailable — surface the error clearly instead of hiding it
        raise HTTPException(
            status_code=503,
            detail="Database is currently unavailable. Please ensure the backend can connect to MongoDB Atlas and that your IP is whitelisted in Atlas Network Access."
        )

@router.get("/me")
def get_me(authorization: Optional[str] = Header(None)):
    user = get_current_user_from_token(authorization)
    return {"user": user}

@router.patch("/language")
def update_language(
    req: LanguageUpdateRequest,
    authorization: Optional[str] = Header(None)
):
    user = get_current_user_from_token(authorization)
    email = user["email"]
    new_lang = req.preferredLanguage

    users_col = get_users_collection()
    if users_col is not None:
        users_col.update_one({"email": email}, {"$set": {"preferredLanguage": new_lang}})
        user["preferredLanguage"] = new_lang
    else:
        if email in _in_memory_users:
            _in_memory_users[email]["preferredLanguage"] = new_lang
            user["preferredLanguage"] = new_lang

    return {"user": user}
