"""Vérifie les garde-fous budgétaires statiques du dépôt MicroAlbert.

Ce contrôle ne peut pas vérifier les paramètres de facturation des comptes.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
POLICY = ROOT / "docs" / "ZERO_COST_POLICY.md"
assert POLICY.is_file(), "Politique budgétaire absente"
assert "aucun coût supplémentaire" in POLICY.read_text(encoding="utf-8").lower()

for workflow in WORKFLOWS.glob("*.yml"):
    source = workflow.read_text(encoding="utf-8")
    # Empêche l'utilisation de runners facturables ou privés par inadvertance.
    runners = re.findall(r"^\s*runs-on:\s*(.+?)\s*$", source, flags=re.MULTILINE)
    assert runners, f"{workflow.name}: aucun runner explicite"
    for runner in runners:
        assert runner.strip(" '\"") in {"ubuntu-latest", "ubuntu-24.04", "ubuntu-22.04"}, (
            f"{workflow.name}: runner non approuvé : {runner}"
        )

backend = (ROOT / "backend" / "app" / "main.py").read_text(encoding="utf-8")
assert 'MICROALBERT_REAL_ACCESS_APPROVED' in backend, "Activation Albert sans accord explicite"
assert 'ALBERT_API_KEY' in backend, "Configuration de clé Albert absente"
print("Contrôles statiques zéro surcoût : OK (facturation des comptes non vérifiée)")
