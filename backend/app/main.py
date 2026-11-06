"""MicroAlbert G1: local-only API, mock provider by default."""
import os
import secrets
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

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

@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    if payload.model_id != "microalbert-mock":
        raise HTTPException(status_code=400, detail={"code": "invalid_input", "message": "Modèle indisponible dans G1"})
    # Never echo the user input, secret, or an unverified AI claim.
    return ChatResponse(
        reply="Mode de démonstration : aucune requête n’a été envoyée à Albert API. "
              "L’enseignant peut vérifier le contrat technique sans données d’élève.",
        model_id=payload.model_id,
        finish_reason="stop",
        request_id=secrets.token_hex(8),
        warnings=["mock_provider", "not_a_pedagogical_answer"],
    )
