"""Bounded, server-owned diagnostic rotation for the teacher-only assessment pilot.

Only diagnostic codes are retained; never Python source or student messages.
Process-local state is deliberately not presented as a durable student record.
"""
from collections.abc import Callable
from threading import Lock
from time import monotonic

from .assessment_dialogue import select_question


class AssessmentHistoryStore:
    def __init__(self, *, ttl_seconds: float = 1800, max_sessions: int = 500,
                 clock: Callable[[], float] = monotonic):
        if ttl_seconds <= 0 or max_sessions < 1:
            raise ValueError("invalid_assessment_history_configuration")
        self._clock = clock
        self._ttl = ttl_seconds
        self._capacity = max_sessions
        self._entries: dict[tuple[str, str], tuple[str | None, float]] = {}
        self._lock = Lock()

    def select_and_record(self, subject: str, mission_id: str, report: dict,
                          phase: str) -> tuple[str, str | None]:
        if not subject or not mission_id:
            raise ValueError("invalid_assessment_history_key")
        with self._lock:
            now = self._clock()
            for key, (_, timestamp) in list(self._entries.items()):
                if now - timestamp >= self._ttl:
                    del self._entries[key]
            key = (subject, mission_id)
            previous = self._entries.get(key, (None, 0))[0]
            # No state mutation if report or phase is invalid.
            question, code = select_question(report, phase, previous)
            if key not in self._entries and len(self._entries) >= self._capacity:
                oldest = min(self._entries, key=lambda k: self._entries[k][1])
                del self._entries[oldest]
            self._entries[key] = (code, now)
            return question, code
