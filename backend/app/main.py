"""MicroAlbert G1: local-only API, mock provider by default."""
import os
import secrets
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from .albert_adapter import AlbertAdapter, ProviderError
from .access_security import AccessDenied, FixedWindowRateLimiter, LocalTokenRegistry, Principal, authorize

app = FastAPI(title="MicroAlbert Lab API", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

class ChatRequest(BaseModel):
    mode: Literal["eleve", "enseignant", "audit"]
    model_id: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=4000)
    mission_id: str | None = Field(default=None, max_length=120)

    @field_validator("message")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("message vide")
        return value

class ChatResponse(BaseModel):
    reply: str
    model_id: str
    finish_reason: str | None = None
    request_id: str
    warnings: list[str] = []

@app.get("/api/health")
def health():
    return {"status": "ok", "provider": "mock"}

@app.get("/api/models")
def models():
    return {"data": [{"id": "microalbert-mock", "chat_capability": "confirmed_mock"}]}

def get_albert_adapter() -> AlbertAdapter | None:
    """Fail closed: only explicit test dependency overrides may provide an adapter.

    No production HTTP transport or credential loading is enabled in G3-P2A.
    """
    return None


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, adapter: AlbertAdapter | None = Depends(get_albert_adapter)):
    # Legacy route is strictly mock-only: no injected provider can bypass the secure gate.
    if payload.model_id != "microalbert-mock":
        raise HTTPException(status_code=400, detail={
            "code": "invalid_input", "message": "Modèle indisponible sur la route de démonstration"
        })
    if payload.model_id != "microalbert-mock":
        if adapter is None:
            raise HTTPException(status_code=400, detail={
                "code": "invalid_input", "message": "Modèle indisponible dans cette version"
            })
        try:
            answer = await adapter.chat(payload.model_id, payload.message)
        except ProviderError as exc:
            raise HTTPException(status_code=exc.status, detail={
                "code": exc.code, "message": "Fournisseur indisponible ou requête refusée"
            }) from None
        return ChatResponse(
            reply=answer.reply, model_id=answer.model_id,
            finish_reason=answer.finish_reason, request_id=secrets.token_hex(8),
            warnings=["simulated_provider_transport", "not_pedagogically_certified"],
        )
    # Never echo the user input, secret, or an unverified AI claim.
    return ChatResponse(
        reply="Mode de démonstration : aucune requête n’a été envoyée à Albert API. "
              "L’enseignant peut vérifier le contrat technique sans données d’élève.",
        model_id=payload.model_id,
        finish_reason="stop",
        request_id=secrets.token_hex(8),
        warnings=["mock_provider", "not_a_pedagogical_answer"],
    )


# G3-P4B: protected demonstration route. No public token-issuing endpoint.
# The original /api/chat remains legacy/mock for backward compatibility.
_secure_registry = LocalTokenRegistry()
_secure_limiter = FixedWindowRateLimiter(limit=5, window_seconds=60)


def get_secure_registry() -> LocalTokenRegistry:
    return _secure_registry


def get_secure_limiter() -> FixedWindowRateLimiter:
    return _secure_limiter


def authenticated_principal(
    authorization: str | None = Header(default=None),
    registry: LocalTokenRegistry = Depends(get_secure_registry),
) -> Principal:
    try:
        return registry.authenticate(authorization)
    except AccessDenied as exc:
        raise HTTPException(status_code=exc.status, detail={
            "code": exc.code, "message": "Accès refusé"
        }) from None


@app.post("/api/secure/chat", response_model=ChatResponse)
def secure_chat(
    payload: ChatRequest,
    principal: Principal = Depends(authenticated_principal),
    limiter: FixedWindowRateLimiter = Depends(get_secure_limiter),
):
    """Authenticated mock-only demonstration; never forwards to Albert."""
    try:
        authorize(principal, payload.mode, "chat:mock")
        limiter.require(principal.subject)
    except AccessDenied as exc:
        raise HTTPException(status_code=exc.status, detail={
            "code": exc.code, "message": "Accès refusé"
        }) from None
    if payload.model_id != "microalbert-mock":
        raise HTTPException(status_code=400, detail={
            "code": "invalid_input", "message": "Modèle indisponible dans cette version"
        })
    return ChatResponse(
        reply="Démonstration sécurisée : aucune requête envoyée à Albert API.",
        model_id="microalbert-mock", finish_reason="stop",
        request_id=secrets.token_hex(8),
        warnings=["mock_provider", "authenticated_local_demo", "not_a_pedagogical_answer"],
    )
