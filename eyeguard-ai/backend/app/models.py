from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class SessionStartIn(BaseModel):
    mode: str = Field(default="eye_health")
    client_ts: Optional[int] = None


class SessionEventIn(BaseModel):
    session_id: str
    bpm: int
    ear: float
    too_close: bool = False
    too_far: bool = False
    drowsy: bool = False
    client_ts: Optional[int] = None
    extra: Dict[str, Any] = Field(default_factory=dict)


class SessionEndIn(BaseModel):
    session_id: str
    client_ts: Optional[int] = None