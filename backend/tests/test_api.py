from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    assert client.get("/api/health").json() == {"status": "ok", "provider": "mock"}

def test_models():
    assert client.get("/api/models").json()["data"][0]["id"] == "microalbert-mock"

def test_chat_is_mock_and_does_not_echo_input():
    marker = "SECRET_TEST_NOT_TO_ECHO"
    response = client.post("/api/chat", json={
        "mode": "eleve", "model_id": "microalbert-mock", "message": marker
    })
    assert response.status_code == 200
    data = response.json()
    assert marker not in str(data)
    assert data["finish_reason"] == "stop"
    assert "mock_provider" in data["warnings"]

def test_invalid_model():
    response = client.post("/api/chat", json={
        "mode": "eleve", "model_id": "other", "message": "bonjour"
    })
    assert response.status_code == 400

def test_invalid_mode():
    response = client.post("/api/chat", json={
        "mode": "admin", "model_id": "microalbert-mock", "message": "bonjour"
    })
    assert response.status_code == 422

def test_blank_message():
    response = client.post("/api/chat", json={
        "mode": "eleve", "model_id": "microalbert-mock", "message": " "
    })
    assert response.status_code == 422

def test_oversized_message():
    response = client.post("/api/chat", json={
        "mode": "eleve", "model_id": "microalbert-mock", "message": "x" * 4001
    })
    assert response.status_code == 422
