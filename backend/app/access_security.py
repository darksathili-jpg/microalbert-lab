"""G3-P4 security primitives. Not yet connected to the public API.

Authentication is server-side and fail-closed. The browser-supplied mode is
never an identity or a permission. No provider credentials are handled here.
"""
from __future__ import annotations

from dataclasses import dataclass
from collections import deque
from collections.abc import Callable
import hmac
import secrets
import threading
import time
from typing import Literal

Role = Literal["eleve", "enseignant", "audit"]
MODE_PERMISSIONS: dict[str, frozenset[str]] = {
    "eleve": frozenset({"chat:mock"}),
    "enseignant": frozenset({"chat:mock", "chat:review"}),
    "audit": frozenset({"chat:mock", "audit:read"}),
}


class AccessDenied(Exception):
    """Fixed public error; does not contain tokens, identities or prompts."""

    def __init__(self, code: str, status: int = 403):
        super().__init__(code)
        self.code = code
        self.status = status


@dataclass(frozen=True)
class Principal:
    subject: str
    role: Role


class LocalTokenRegistry:
    """In-memory demonstration registry, NOT a production identity provider.

    Tokens must be generated server-side. Registration is an administrative
    operation, not exposed to HTTP. Registry is lost on process restart.
    """

    def __init__(self):
        self._records: dict[str, Principal] = {}
        self._lock = threading.Lock()

    def issue(self, principal: Principal) -> str:
        if not principal.subject or principal.role not in MODE_PERMISSIONS:
            raise ValueError("invalid_principal")
        token = secrets.token_urlsafe(32)
        with self._lock:
            self._records[token] = principal
        return token

    def authenticate(self, bearer: str | None) -> Principal:
        if not bearer or not bearer.startswith("Bearer "):
            raise AccessDenied("authentication_required", 401)
        candidate = bearer[len("Bearer "):]
        if not candidate or len(candidate) > 256 or any(ch.isspace() for ch in candidate):
            raise AccessDenied("authentication_required", 401)
        with self._lock:
            # Compare tokens without early exit to reduce timing leakage.
            matched = None
            for token, principal in self._records.items():
                if hmac.compare_digest(candidate, token):
                    matched = principal
            if matched is None:
                raise AccessDenied("authentication_required", 401)
            return matched

    def revoke(self, token: str) -> None:
        with self._lock:
            self._records.pop(token, None)


def authorize(principal: Principal, requested_mode: Role, permission: str) -> None:
    """Never trust requested_mode as a role assertion."""
    if principal.role != requested_mode:
        raise AccessDenied("mode_not_authorized")
    if permission not in MODE_PERMISSIONS.get(principal.role, frozenset()):
        raise AccessDenied("permission_denied")


class FixedWindowRateLimiter:
    """Single-process educational guard; not suitable for distributed production."""

    def __init__(self, *, limit: int = 5, window_seconds: float = 60,
                 clock: Callable[[], float] = time.monotonic):
        if limit < 1 or window_seconds <= 0:
            raise ValueError("invalid_rate_limit")
        self.limit = limit
        self.window_seconds = window_seconds
        self._clock = clock
        self._events: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def allow(self, subject: str) -> bool:
        if not subject:
            raise AccessDenied("authentication_required", 401)
        now = self._clock()
        with self._lock:
            queue = self._events.setdefault(subject, deque())
            cutoff = now - self.window_seconds
            while queue and queue[0] <= cutoff:
                queue.popleft()
            if len(queue) >= self.limit:
                return False
            queue.append(now)
            return True

    def require(self, subject: str) -> None:
        if not self.allow(subject):
            raise AccessDenied("rate_limited", 429)
