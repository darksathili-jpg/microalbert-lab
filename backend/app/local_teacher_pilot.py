"""Start the teacher pilot on loopback with an explicitly selected provider."""
import argparse
import json

import httpx
import uvicorn

from .access_security import FixedWindowRateLimiter, Principal
from .albert_adapter import AlbertAdapter, OFFICIAL_HOST, ProviderConfig
from .main import app, get_secure_limiter, get_secure_registry, get_tutor_adapter

SIMULATION_MODEL = "microalbert-simulation"


def simulate_reply(request: httpx.Request) -> httpx.Response:
    prompt = json.loads(request.content)["messages"][-1]["content"]
    mission = prompt.splitlines()[0].split(" ", 2)[2].split()[0]
    initial, follow_up = {
        "premiere-somme-filtree": (
            "Quelle valeur de ta liste permettrait de tester le cas d’égalité avec le seuil ?",
            "Comment ton test montrerait-il que deux occurrences identiques sont toutes deux prises en compte ?",
        ),
        "terminale-parcours-graphe": (
            "Quel petit graphe te permettrait d’observer deux chemins vers un même sommet ?",
            "Sur ce graphe, à quel moment notes-tu qu’un sommet a déjà été visité ?",
        ),
    }.get(mission, (
        "Quel exemple court te permettrait de vérifier ton hypothèse ?",
        "Que se passe-t-il si tu changes une donnée dans cet exemple ?",
    ))
    if "\nCas de test déclaré : " in prompt.split("\nExtrait de la tentative :", 1)[0]:
        follow_up = {
            "premiere-somme-filtree": "Que montre l’écart entre le total prévu et le total observé sur ton cas ?",
            "terminale-parcours-graphe": "À quelle première visite les ordres prévu et observé diffèrent-ils, s’ils diffèrent ?",
        }.get(mission, follow_up)
        question = follow_up
    else:
        is_first_turn = "\nRelance précédente : aucune\n" in prompt or "\nRelance précédente :" not in prompt
        question = initial if is_first_turn else follow_up
    return httpx.Response(200, json={
        "choices": [{"message": {"content": question}, "finish_reason": "stop"}],
    })


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    providers = parser.add_mutually_exclusive_group()
    providers.add_argument("--simulate-tutor", action="store_true", help="Utiliser des relances fictives, sans réseau.")
    providers.add_argument("--albert", action="store_true", help="Utiliser Albert avec la configuration serveur approuvée.")
    args = parser.parse_args()
    adapter = None
    if args.simulate_tutor:
        adapter = AlbertAdapter(
            ProviderConfig(f"https://{OFFICIAL_HOST}", frozenset({SIMULATION_MODEL})),
            token="local-simulation", transport=httpx.MockTransport(simulate_reply),
        )
    if args.albert:
        adapter = get_tutor_adapter()
        if adapter is None:
            parser.error("Configuration Albert absente, non approuvée ou invalide.")
    app.dependency_overrides[get_tutor_adapter] = lambda: adapter
    limiter = FixedWindowRateLimiter(limit=5 if args.albert else 20, window_seconds=60)
    app.dependency_overrides[get_secure_limiter] = lambda: limiter
    token = get_secure_registry().issue(Principal("enseignant-local", "enseignant"))
    print("Jeton temporaire du pilote local (distinct de la clé Albert) :", token, flush=True)
    uvicorn.run(app, host="127.0.0.1", port=8000, workers=1)


if __name__ == "__main__":
    main()
