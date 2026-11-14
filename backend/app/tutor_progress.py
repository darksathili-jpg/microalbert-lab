"""Server-owned, process-local tutor state for the teacher-supervised pilot.

This is NOT a durable student record or a multi-worker session store.
No messages or model responses are retained. State resets on restart.
"""
from dataclasses import dataclass
from threading import Lock
from time import monotonic
from collections.abc import Callable

@dataclass(frozen=True)
class TutorProgress:
    attempts: int = 0
    hints_used: int = 0

class TutorProgressStore:
    def __init__(self, *, ttl_seconds: float = 1800, max_sessions: int = 500,
                 clock: Callable[[], float] = monotonic):
        if ttl_seconds <= 0 or max_sessions < 1:
            raise ValueError("invalid_progress_configuration")
        self._clock = clock
        self._ttl = ttl_seconds
        self._capacity = max_sessions
        self._entries: dict[tuple[str, str], tuple[TutorProgress, float]] = {}
        self._lock = Lock()

    def snapshot(self, subject: str, mission_id: str) -> TutorProgress:
        if not subject or not mission_id:
            raise ValueError("invalid_progress_key")
        with self._lock:
            self._prune()
            return self._entries.get((subject, mission_id), (TutorProgress(), 0))[0]

    def record(self, subject: str, mission_id: str, *, hint_given: bool) -> TutorProgress:
        if not subject or not mission_id:
            raise ValueError("invalid_progress_key")
        with self._lock:
            self._prune()
            key = (subject, mission_id)
            old = self._entries.get(key, (TutorProgress(), 0))[0]
            updated = TutorProgress(
                attempts=min(100, old.attempts + 1),
                hints_used=min(3, old.hints_used + int(hint_given)),
            )
            if key not in self._entries and len(self._entries) >= self._capacity:
                oldest = min(self._entries, key=lambda k: self._entries[k][1])
                del self._entries[oldest]
            self._entries[key] = (updated, self._clock())
            return updated

    def _prune(self) -> None:
        now = self._clock()
        for key, (_, timestamp) in list(self._entries.items()):
            if now - timestamp >= self._ttl:
                del self._entries[key]
