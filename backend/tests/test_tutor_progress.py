"""Offline tests for server-owned tutor progress and anti-counter-tampering."""
import json
import httpx
from fastapi.testclient import TestClient
from app.main import app, get_secure_registry, get_secure_limiter, get_tutor_adapter, get_tutor_progress
from app.access_security import LocalTokenRegistry, FixedWindowRateLimiter, Principal
from app.albert_adapter import AlbertAdapter, ProviderConfig
from app.tutor_progress import TutorProgressStore

def test_progress_isolated_bounded_and_expires():
    now = [100.0]
    store = TutorProgressStore(ttl_seconds=10, max_sessions=2, clock=lambda: now[0])
    assert store.snapshot("teacher", "file").attempts == 0
    assert store.record("teacher", "file", hint_given=True).hints_used == 1
    assert store.snapshot("other", "file").hints_used == 0
    assert store.snapshot("teacher", "balises").hints_used == 0
    store.record("third", "file", hint_given=False)
    assert store.snapshot("teacher", "file").attempts == 0  # oldest evicted
    now[0] += 11
    assert store.snapshot("third", "file").attempts == 0

def test_tutor_ignores_forged_client_counters_and_limits_hints():
    system_prompts = []
    def handler(request):
        messages = json.loads(request.content)["messages"]
        system_prompts.append(messages[0]["content"])
        return httpx.Response(200, json={"choices":[{"message":{
            "content":"Quel test permettrait de vérifier ton hypothèse ?"
        },"finish_reason":"stop"}]})
    adapter = AlbertAdapter(ProviderConfig("https://albert.api.etalab.gouv.fr",
                            frozenset({"test-chat"})), token="FAKE_TEST_TOKEN",
                            transport=httpx.MockTransport(handler))
    registry = LocalTokenRegistry()
    teacher = registry.issue(Principal("teacher", "enseignant"))
    progress = TutorProgressStore()
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(limit=30, window_seconds=60)
    app.dependency_overrides[get_tutor_adapter] = lambda: adapter
    app.dependency_overrides[get_tutor_progress] = lambda: progress
    payload = {"model_id":"test-chat", "mission_id":"file", "phase":"implementation",
               "message":"Je suis bloqué", "attempts":100, "hints_used":3,
               "has_student_work":False, "requested_solution":False}
    try:
        with TestClient(app) as client:
            for _ in range(6):
                result = client.post("/api/secure/tutor", json=payload,
                                     headers={"Authorization":"Bearer "+teacher})
                assert result.status_code == 200
                payload["attempts"] = 0  # forged reset has no effect
                payload["hints_used"] = 0
        assert len(system_prompts) == 6
        assert "Demande une tentative personnelle" in system_prompts[0]
        assert sum("Donne un indice conceptuel bref" in p for p in system_prompts) == 3
        assert progress.snapshot("teacher", "file").attempts == 6
        assert progress.snapshot("teacher", "file").hints_used == 3
    finally:
        app.dependency_overrides.clear()
