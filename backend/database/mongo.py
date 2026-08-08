import os
import logging
import certifi
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hexakrishi.mongo")

# Load backend/.env explicitly
BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE, override=True)

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hexakrishi")

mongo_client = None
db = None
users_collection = None
disease_history_collection = None
crop_advisory_collection = None
equipment_listings_collection = None


try:
    import pymongo

    try:
        # ── TLS Fix for Windows (TLSV1_ALERT_INTERNAL_ERROR) ──────────────────
        # Python's bundled OpenSSL on Windows can fail the TLS handshake with
        # MongoDB Atlas because it lacks a trusted CA bundle. The fix is to
        # point pymongo at certifi's up-to-date Mozilla CA bundle.
        # certifi v2026.7.22 is already installed in this venv.
        mongo_client = pymongo.MongoClient(
            MONGO_URI,
            tlsCAFile=certifi.where(),          # Use certifi's CA bundle
            serverSelectionTimeoutMS=10_000,
            connectTimeoutMS=10_000,
            socketTimeoutMS=20_000,
            retryWrites=True,
        )
        mongo_client.admin.command("ping")
        logger.info(f"✅ Successfully connected to MongoDB Atlas (DB: '{MONGO_DB_NAME}')")

        db = mongo_client[MONGO_DB_NAME]
        users_collection = db["users"]
        disease_history_collection = db["disease_history"]
        crop_advisory_collection = db["crop_advisories"]
        equipment_listings_collection = db["equipment_listings"]

        try:
            users_collection.create_index("email", unique=True)
            logger.info("✅ Unique index on 'email' ensured for users collection.")
        except Exception as idx_err:
            logger.warning(f"⚠️ Index creation warning: {idx_err}")

    except Exception as e:
        logger.error(f"❌ Could not connect to MongoDB Atlas at '{MONGO_URI}': {e}")
        db = None
        users_collection = None
        disease_history_collection = None
        crop_advisory_collection = None
        equipment_listings_collection = None

except ImportError:
    logger.warning("⚠️ 'pymongo' is not installed. Run: pip install pymongo dnspython bcrypt certifi")


def get_db():
    return db


def get_users_collection():
    return users_collection


def get_disease_history_collection():
    return disease_history_collection


def get_crop_history_collection():
    return crop_advisory_collection


def get_equipment_listings_collection():
    return equipment_listings_collection
