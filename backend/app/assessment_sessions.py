"""Ephemeral teacher-owned assessment sessions. No student account or code stored."""
from dataclasses import dataclass
from threading import Lock
from time import monotonic
from collections.abc import Callable
import secrets
import hmac


@dataclass(frozen=True)
class AssessmentSession:
    owner: str
    mission_id: str
    created_at: float


class AssessmentSessionStore:
    """Opaque capability bound to an authenticated teacher and a mission.

    This is a process-local pilot, not student authentication or a durable record.
    """
    def __init__(self, *, ttl_seconds: float = 1800, max_sessions: int = 500,
                 clock: Callable[[], float] = monotonic):
        if ttl_seconds <= 0 or max_sessions < 1:
            raise ValueError("invalid_session_configuration")
        self._ttl = ttl_seconds
        self._capacity = max_sessions
        self._clock = clock
        self._entries: dict[str, AssessmentSession] = {}
        self._lock = Lock()

    def _expire(self, now: float) -> None:
        for token, entry in list(self._entries.items()):
            if now - entry.created_at >= self._ttl:
                del self._entries[token]

    def issue(self, owner: str, mission_id: str) -> str:
        if not owner or not mission_id:
            raise ValueError("invalid_session_owner_or_mission")
        with self._lock:
            now = self._clock()
            self._expire(now)
            if len(self._entries) >= self._capacity:
                oldest = min(self._entries, key=lambda token: self._entries[token].created_at)
                del self._entries[oldest]
            token = secrets.token_urlsafe(32)
            self._entries[token] = AssessmentSession(owner, mission_id, now)
            return token

    def validate(self, token: str, owner: str, mission_id: str) -> bool:
        if not token or len(token) > 256 or not token.isascii() or not owner or not mission_id:
            return False
        with self._lock:
            self._expire(self._clock())
            for stored, entry in self._entries.items():
                if hmac.compare_digest(token, stored):
                    return entry.owner == owner and entry.mission_id == mission_id
            return False

    def revoke(self, token: str, owner: str) -> bool:
        with self._lock:
            entry = self._entries.get(token)
            if entry is None or entry.owner != owner:
                return False
            del self._entries[token]
            return True
