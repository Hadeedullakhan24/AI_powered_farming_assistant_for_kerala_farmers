"""Equipment & Tool Sharing request/review workflow endpoints."""
import logging
from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from backend.api.auth_api import get_current_user_from_token
from backend.database.mongo import get_equipment_listings_collection

logger = logging.getLogger("hexakrishi.equipment")
router = APIRouter(prefix="/api/equipment", tags=["Equipment Sharing"])
EquipmentType = Literal["tiller", "sprayer", "harvester", "water_pump", "other"]
ListingIntent = Literal["rent", "sale"]
AvailabilityStatus = Literal["available", "requested", "booked"]


class EquipmentListingCreate(BaseModel):
    equipment_name: str = Field(min_length=1, max_length=120)
    equipment_type: EquipmentType
    description: str = Field(min_length=1, max_length=1000)
    location: str = Field(min_length=1, max_length=160)
    contact_number: str = Field(min_length=7, max_length=25)
    listing_intent: Optional[ListingIntent] = Field(default="rent")
    price_or_rate: Optional[str] = Field(default=None, max_length=60)


class EquipmentRequestCreate(BaseModel):
    requester_name: str = Field(min_length=1, max_length=120)
    requester_address: str = Field(min_length=1, max_length=300)
    requester_contact_number: str = Field(min_length=7, max_length=25)
    message: Optional[str] = Field(default=None, max_length=1000)


def _collection():
    collection = get_equipment_listings_collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="Equipment service is temporarily unavailable.")
    return collection


def _user(authorization: Optional[str]) -> dict:
    return get_current_user_from_token(authorization)


def _object_id(listing_id: str) -> ObjectId:
    try:
        return ObjectId(listing_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Equipment listing not found") from exc


def _serialize(document: dict) -> dict:
    document = document.copy()
    document["_id"] = str(document["_id"])
    document.setdefault("requests", [])
    document.setdefault("listing_intent", "rent")
    document.setdefault("price_or_rate", "")
    document.setdefault("owner_email", "")
    return document


def _fresh_listing(collection, object_id: ObjectId) -> dict:
    listing = collection.find_one({"_id": object_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Equipment listing not found")
    return listing


@router.post("/list", status_code=201)
def create_listing(payload: EquipmentListingCreate, authorization: Optional[str] = Header(None)):
    user = _user(authorization)
    listing = {
        "owner_id": user["id"],
        "owner_name": user["name"],
        "owner_email": user.get("email", ""),
        "equipment_name": payload.equipment_name.strip(),
        "equipment_type": payload.equipment_type,
        "description": payload.description.strip(),
        "location": payload.location.strip(),
        "contact_number": payload.contact_number.strip(),
        "listing_intent": payload.listing_intent or "rent",
        "price_or_rate": payload.price_or_rate.strip() if payload.price_or_rate else "",
        "availability_status": "available",
        "requests": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        result = _collection().insert_one(listing)
        listing["_id"] = result.inserted_id
        return {"listing": _serialize(listing)}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Could not create equipment listing")
        raise HTTPException(status_code=500, detail="Could not create equipment listing") from exc


@router.get("/browse")
def browse_equipment(equipment_type: Optional[EquipmentType] = None, location: Optional[str] = None):
    query = {"availability_status": "available"}
    if equipment_type:
        query["equipment_type"] = equipment_type
    if location and location.strip():
        query["location"] = {"$regex": location.strip(), "$options": "i"}
    return {"listings": [_serialize(doc) for doc in _collection().find(query).sort("created_at", -1)]}


@router.post("/{listing_id}/request")
def request_equipment(listing_id: str, payload: EquipmentRequestCreate, authorization: Optional[str] = Header(None)):
    user = _user(authorization)
    collection, object_id = _collection(), _object_id(listing_id)
    listing = _fresh_listing(collection, object_id)
    if listing["owner_id"] == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot request your own equipment")
    if listing.get("availability_status") == "booked":
        raise HTTPException(status_code=409, detail="This equipment has already been booked")
    existing = next((r for r in listing.get("requests", []) if r.get("requester_id") == user["id"] and r.get("status") == "pending"), None)
    if existing:
        raise HTTPException(status_code=409, detail="You already have a pending request for this equipment")
    request = {
        "request_id": str(uuid4()),
        "requester_id": user["id"],
        "requester_name": payload.requester_name.strip(),
        "requester_email": user.get("email", ""),
        "requester_address": payload.requester_address.strip(),
        "requester_contact_number": payload.requester_contact_number.strip(),
        "message": payload.message.strip() if payload.message else None,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc).isoformat(),
    }
    result = collection.update_one({"_id": object_id, "availability_status": {"$ne": "booked"}}, {"$push": {"requests": request}, "$set": {"availability_status": "requested"}})
    if not result.matched_count:
        raise HTTPException(status_code=409, detail="This equipment is no longer available")
    return {"listing": _serialize(_fresh_listing(collection, object_id)), "request": request, "message": "Equipment request sent successfully"}


def _review_request(listing_id: str, request_id: str, action: Literal["accepted", "rejected"], user: dict) -> dict:
    collection, object_id = _collection(), _object_id(listing_id)
    listing = _fresh_listing(collection, object_id)
    if listing["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only the equipment owner can review requests")
    target = next((r for r in listing.get("requests", []) if r.get("request_id") == request_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Request not found")
    if target.get("status") != "pending":
        raise HTTPException(status_code=409, detail="This request has already been reviewed")
    requests = []
    for request in listing.get("requests", []):
        changed = request.copy()
        if request.get("request_id") == request_id:
            changed["status"] = action
        elif action == "accepted" and request.get("status") == "pending":
            changed["status"] = "rejected"
        requests.append(changed)
    availability = "booked" if action == "accepted" else ("requested" if any(r.get("status") == "pending" for r in requests) else "available")
    result = collection.update_one({"_id": object_id, "owner_id": user["id"], "requests": listing.get("requests", [])}, {"$set": {"requests": requests, "availability_status": availability}})
    if not result.matched_count:
        raise HTTPException(status_code=409, detail="Request changed by another review. Refresh and try again.")
    return _serialize(_fresh_listing(collection, object_id))


@router.post("/{listing_id}/requests/{request_id}/accept")
def accept_request(listing_id: str, request_id: str, authorization: Optional[str] = Header(None)):
    return {"listing": _review_request(listing_id, request_id, "accepted", _user(authorization))}


@router.post("/{listing_id}/requests/{request_id}/reject")
def reject_request(listing_id: str, request_id: str, authorization: Optional[str] = Header(None)):
    return {"listing": _review_request(listing_id, request_id, "rejected", _user(authorization))}


@router.get("/my-listings")
def my_listings(authorization: Optional[str] = Header(None)):
    user = _user(authorization)
    return {"listings": [_serialize(doc) for doc in _collection().find({"owner_id": user["id"]}).sort("created_at", -1)]}


@router.get("/my-requests")
def my_pending_received_requests(authorization: Optional[str] = Header(None)):
    """Compatibility endpoint used by the equipment Bell: owner-side pending count."""
    user = _user(authorization)
    listings = _collection().find({"owner_id": user["id"], "requests.status": "pending"})
    return {"listings": [_serialize(doc) for doc in listings]}


@router.get("/my-requests-sent")
def my_requests_sent(authorization: Optional[str] = Header(None)):
    user = _user(authorization)
    records = []
    for listing in _collection().find({"requests.requester_id": user["id"]}).sort("created_at", -1):
        for request in listing.get("requests", []):
            if request.get("requester_id") == user["id"]:
                equipment = _serialize(listing)
                equipment.pop("requests", None)
                # When accepted, supply owner's contact details so borrower/buyer can reach out
                if request.get("status") == "accepted":
                    equipment["contact_number"] = listing.get("contact_number", "")
                    equipment["owner_email"] = listing.get("owner_email", "")
                else:
                    equipment["contact_number"] = None
                records.append({
                    "listing": equipment,
                    "request": request,
                })
    records.sort(key=lambda item: item["request"].get("requested_at", ""), reverse=True)
    return {"requests": records}
