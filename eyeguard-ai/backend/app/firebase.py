import os
import firebase_admin
from firebase_admin import credentials, firestore

_db = None

def get_db():
    global _db
    if _db is not None:
        return _db

    sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if not sa_path:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON is not set in .env")

    if not firebase_admin._apps:
        cred = credentials.Certificate(sa_path)
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db