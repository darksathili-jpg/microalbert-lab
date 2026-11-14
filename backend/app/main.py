"""MicroAlbert G1: local-only API, mock provider by default."""
import os
import secrets
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from .albert_adapter import AlbertAdapter, ProviderConfig, ProviderError
import httpx
from .pedagogical_tutor import TutorContext, decide_tutor_action, tutor_system_instructions
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


class TutorRequest(BaseModel):
    """Teacher-supervised NSI tutor request; never available from static Pages."""
    model_id: str = Field(min_length=1, max_length=120)
    mission_id: str = Field(min_length=1, max_length=120)
    phase: Literal["decouverte", "recherche", "implementation", "verification", "bilan"]
    message: str = Field(min_length=1, max_length=2000)
    attempts: int = Field(ge=0, le=100)
    hints_used: int = Field(ge=0, le=3)
    requested_solution: bool = False
    has_student_work: bool = False


def get_tutor_adapter() -> AlbertAdapter | None:
    """Explicit opt-in only; key remains on the server, never in Pages."""
    if os.getenv("MICROALBERT_PROVIDER", "mock") != "albert":
        return None
    if os.getenv("MICROALBERT_REAL_ACCESS_APPROVED") != "yes":
        return None
    token = os.getenv("ALBERT_API_KEY", "")
    models = frozenset(x.strip() for x in os.getenv("ALBERT_ALLOWED_MODELS", "").split(",") if x.strip())
    if not token.strip() or not models:
        return None
    try:
        config = ProviderConfig(
            base_url=os.getenv("ALBERT_API_BASE_URL", "https://albert.api.etalab.gouv.fr"),
            allowed_models=models,
            timeout_seconds=float(os.getenv("ALBERT_TIMEOUT_SECONDS", "15")),
        )
        return AlbertAdapter(config, token=token, transport=httpx.AsyncHTTPTransport(retries=0))
    except (ValueError, ProviderError):
        return None


@app.post("/api/secure/tutor", response_model=ChatResponse)
async def secure_tutor(
    payload: TutorRequest,
    principal: Principal = Depends(authenticated_principal),
    limiter: FixedWindowRateLimiter = Depends(get_secure_limiter),
    adapter: AlbertAdapter | None = Depends(get_tutor_adapter),
):
    """Protected NSI teaching pilot: no student self-enrolment or public credential."""
    try:
        authorize(principal, "enseignant", "chat:review")
        limiter.require(principal.subject)
    except AccessDenied as exc:
        raise HTTPException(status_code=exc.status, detail={
            "code": exc.code, "message": "Accès refusé"
        }) from None
    if adapter is None:
        raise HTTPException(status_code=503, detail={
            "code": "provider_not_configured", "message": "Albert non activé sur ce serveur"
        })
    context = TutorContext(
        mission_id=payload.mission_id, phase=payload.phase,
        attempts=payload.attempts, hints_used=payload.hints_used,
        requested_solution=payload.requested_solution,
        has_student_work=payload.has_student_work,
    )
    decision = decide_tutor_action(context)
    instruction = tutor_system_instructions(decision)
    # Adapter's existing interface accepts one user message, not a system role.
    # Explicitly mark this as a constrained pilot; model obedience is not guaranteed.
    prompt = instruction + "\\nMission : " + payload.mission_id + "\\nQuestion : " + payload.message
    try:
        result = await adapter.chat(payload.model_id, prompt)
    except ProviderError as exc:
        raise HTTPException(status_code=exc.status, detail={
            "code": exc.code, "message": "Service Albert indisponible"
        }) from None
    return ChatResponse(
        reply=result.reply, model_id=result.model_id,
        finish_reason=result.finish_reason, request_id=secrets.token_hex(8),
        warnings=["teacher_supervised_pilot", "model_output_unverified", "no_solution_guarantee"],
    )
