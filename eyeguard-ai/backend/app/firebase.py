import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore

_db = None

def _default_service_account_path() -> str:
    """
    Default to the repo's backend/serviceAccountKey.json
    This makes local demo + hackathon much easier.
    """
  
    here = Path(__file__).resolve()
    backend_dir = here.parent.parent  # backend/
    candidate = backend_dir / "serviceAccountKey.json"
    return str(candidate)

def get_db():
    global _db
    if _db is not None:
        return _db

    sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if not sa_path:
        sa_path = _default_service_account_path()

    if not Path(sa_path).exists():
        raise RuntimeError(
            "Firebase service account JSON not found.\n"
            f"- Looked for: {sa_path}\n"
            "Fix: set FIREBASE_SERVICE_ACCOUNT_JSON to the correct path, "
            "or put serviceAccountKey.json in backend/."
        )
        
    if not firebase_admin._apps:
        cred = credentials.Certificate(sa_path)
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db