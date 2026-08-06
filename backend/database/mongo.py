import os
import logging
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hexakrishi.mongo")

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hexakrishi")

mongo_client = None
db = None
users_collection = None
disease_history_collection = None
crop_advisory_collection = None

try:
    import pymongo

    try:
        mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        mongo_client.admin.command("ping")
        logger.info(f"✅ Successfully connected to MongoDB Atlas (DB: '{MONGO_DB_NAME}')")

        db = mongo_client[MONGO_DB_NAME]
        users_collection = db["users"]
        disease_history_collection = db["disease_history"]
        crop_advisory_collection = db["crop_advisories"]

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

except ImportError:
    logger.warning("⚠️ 'pymongo' is not installed in the virtual environment. Please run: pip install pymongo dnspython bcrypt")

def get_db():
    return db

def get_users_collection():
    return users_collection

def get_disease_history_collection():
    return disease_history_collection

def get_crop_history_collection():
    return crop_advisory_collection
