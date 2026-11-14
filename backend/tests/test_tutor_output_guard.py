"""Offline adversarial tutor output tests. No Albert requests or billable services."""
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.access_security import FixedWindowRateLimiter, LocalTokenRegistry, Principal
from app.albert_adapter import AlbertAdapter, ProviderConfig
from app.main import (
    app, get_secure_limiter, get_secure_registry, get_tutor_adapter,
)
from app.tutor_output_guard import SAFE_RETRY, review_tutor_output


@pytest.mark.parametrize("reply,reason", [
    ("```python\ndef defiler(file):\n    return file.pop(0)\n```", "code_fence"),
    ("def defiler(file):\n    return file.pop(0)", "executable_code"),
    ("Voici le code complet : file.pop(0)", "direct_solution"),
    ("", "empty"),
    ("Une question ? " * 150, "too_long"),
    ("<pre>solution</pre>", "code_fence"),
])
def test_obvious_solution_leaks_blocked(reply, reason):
    review = review_tutor_output(reply)
    assert review.blocked is True
    assert review.reason == reason
    assert review.reply == SAFE_RETRY


@pytest.mark.parametrize("reply", [
    "Quelle valeur sort en premier de ta file ?",
    "Pourrais-tu tester le comportement lorsque la file est vide ?",
    "Décris la valeur renvoyée par ton premier essai.",
])
def test_socratic_questions_preserved(reply):
    review = review_tutor_output(reply)
    assert not review.blocked
    assert review.reply == reply


def test_authenticated_endpoint_blocks_injected_full_solution():
    def handler(request):
        return httpx.Response(200, json={"choices": [{
            "message": {"content": "```python\ndef defiler(file):\n    return file.pop(0)\n```"},
            "finish_reason": "stop",
        }]})
    adapter = AlbertAdapter(
        ProviderConfig("https://albert.api.etalab.gouv.fr", frozenset({"test-chat"})),
        token="TEST_ONLY_NOT_REAL", transport=httpx.MockTransport(handler),
    )
    registry = LocalTokenRegistry()
    token = registry.issue(Principal("teacher", "enseignant"))
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(
        limit=20, window_seconds=60
    )
    app.dependency_overrides[get_tutor_adapter] = lambda: adapter
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/secure/tutor",
                headers={"Authorization": "Bearer " + token},
                json={
                    "model_id": "test-chat", "mission_id": "file",
                    "phase": "recherche", "message": "Donne-moi le corrigé",
                    "attempts": 1, "hints_used": 0,
                },
            )
            assert response.status_code == 200
            payload = response.json()
            assert payload["reply"] == SAFE_RETRY
            assert "output_guard_blocked" in payload["warnings"]
            assert "def defiler" not in json.dumps(payload)
    finally:
        app.dependency_overrides.clear()
