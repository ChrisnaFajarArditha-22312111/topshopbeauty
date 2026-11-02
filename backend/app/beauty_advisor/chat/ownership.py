"""Token bertanda tangan untuk kepemilikan percakapan tamu."""
from datetime import datetime, timedelta, timezone
import uuid
from jose import JWTError, jwt
from app.core.config import settings


def create_guest_token(conversation_id: uuid.UUID) -> str:
    return jwt.encode({"sub": str(conversation_id), "type": "beauty_guest",
                       "exp": datetime.now(timezone.utc) + timedelta(days=7)},
                      settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def owns_guest_conversation(token: str | None, conversation_id: uuid.UUID) -> bool:
    if not token:
        return False
    try:
        claims = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return claims.get("type") == "beauty_guest" and claims.get("sub") == str(conversation_id)
    except JWTError:
        return False
