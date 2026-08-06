import os
from dotenv import load_dotenv
import pymongo

load_dotenv(dotenv_path="backend/.env")

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hexakrishi")

print("Connecting to MongoDB Atlas...")
print(f"URI: {MONGO_URI[:30]}...")

client = pymongo.MongoClient(MONGO_URI)
client.admin.command('ping')
print("✅ Atlas Ping Successful!")

db = client[MONGO_DB_NAME]
users_col = db["users"]

print(f"\nCurrent Users in MongoDB Atlas database '{MONGO_DB_NAME}', collection 'users':")
users = list(users_col.find({}, {"passwordHash": 0, "password_hash": 0}))
print(f"Total user count in Atlas: {len(users)}")
for u in users:
    print(" - User:", u)
