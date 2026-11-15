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
        self._entries: dict[tuple[str, str], tuple[str | None, float, frozenset[str], int]] = {}
        self._lock = Lock()

    def select_and_record(self, subject: str, mission_id: str, report: dict,
                          phase: str) -> tuple[str, str | None]:
        question, code, _ = self.select_record_with_trend(subject, mission_id, report, phase)
        return question, code

    def select_record_with_trend(self, subject: str, mission_id: str, report: dict,
                                 phase: str) -> tuple[str, str | None, dict]:
        """Compare two authenticated attempts; never infer functional correctness."""
        if not subject or not mission_id:
            raise ValueError("invalid_assessment_history_key")
        with self._lock:
            now = self._clock()
            for key, entry in list(self._entries.items()):
                timestamp = entry[1]
                if now - timestamp >= self._ttl:
                    del self._entries[key]
            key = (subject, mission_id)
            previous_entry = self._entries.get(key)
            previous = previous_entry[0] if previous_entry else None
            previous_codes = previous_entry[2] if previous_entry else frozenset()
            previous_count = previous_entry[3] if previous_entry else 0
            current_codes = frozenset(finding['code'] for finding in report.get('findings', [])
                                      if isinstance(finding, dict)
                                      and isinstance(finding.get('code'), str))
            # No state mutation if report or phase is invalid.
            question, code = select_question(report, phase, previous)
            if key not in self._entries and len(self._entries) >= self._capacity:
                oldest = min(self._entries, key=lambda k: self._entries[k][1])
                del self._entries[oldest]
            count = min(previous_count + 1, 20)
            # A stable difficulty calls for reflection, not another identical hint.
            # Only server-observed findings influence this decision.
            persistent = current_codes & previous_codes if previous_entry else frozenset()
            introduced = current_codes - previous_codes if previous_entry else frozenset()
            resolved = previous_codes - current_codes if previous_entry else frozenset()
            if previous_entry and not current_codes and resolved:
                question = ("Quels tests pourrais-tu maintenant construire pour vérifier "
                            "que le comportement de ton programme correspond à la consigne, "
                            "y compris dans les cas limites ?")
                code = None
            elif previous_entry and count >= 3 and persistent and not introduced and code in persistent:
                question = ("Cette difficulté apparaît encore dans ton programme. "
                            "Quel petit exemple pourrais-tu examiner pas à pas pour "
                            "comprendre ce qui se produit, sans modifier tout le code ?")
            self._entries[key] = (code, now, current_codes, count)
            trend = {
                'attempts_observed': count,
                'persistent_findings': sorted(current_codes & previous_codes) if previous_entry else [],
                'new_findings': sorted(current_codes - previous_codes) if previous_entry else [],
                'resolved_findings': sorted(previous_codes - current_codes) if previous_entry else [],
                'comparison_available': previous_entry is not None,
            }
            return question, code, trend
