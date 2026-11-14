"""Conservative output gate for teacher-supervised NSI tutor.

Heuristics reduce obvious full-answer leaks; they cannot certify model safety.
No student data, model answer or secret is logged or persisted.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

SAFE_RETRY = (
    "Je ne peux pas fournir un corrigé complet. "
    "Quelle première étape proposerais-tu et comment pourrais-tu la tester ?"
)

# Deliberately conservative: blocks code blocks and likely executable solutions.
FENCE = re.compile(r"```|<\s*(?:pre|code)\b", re.IGNORECASE)
PYTHON_SOLUTION = re.compile(
    r"(?m)^\s*(?:async\s+def\s+|def\s+|class\s+|"
    r"for\s+\w+\s+in\s+|while\s+.+:|if\s+.+:|"
    r"return\s+|from\s+\w+\s+import\s+|import\s+\w+)"
)
DIRECT_ANSWER = re.compile(
    r"(?i)\b(?:voici\s+(?:le|la|un)\s+(?:code|corrigé|solution|programme)\s+complet"
    r"|copie\s+(?:ce|le)\s+code|solution\s+finale\s*:)"
)
MAX_TUTOR_REPLY = 1400


@dataclass(frozen=True)
class OutputReview:
    reply: str
    blocked: bool
    reason: str | None


def review_tutor_output(reply: str) -> OutputReview:
    if not isinstance(reply, str) or not reply.strip():
        return OutputReview(SAFE_RETRY, True, "empty")
    if len(reply) > MAX_TUTOR_REPLY:
        return OutputReview(SAFE_RETRY, True, "too_long")
    if FENCE.search(reply):
        return OutputReview(SAFE_RETRY, True, "code_fence")
    if PYTHON_SOLUTION.search(reply):
        return OutputReview(SAFE_RETRY, True, "executable_code")
    if DIRECT_ANSWER.search(reply):
        return OutputReview(SAFE_RETRY, True, "direct_solution")
    return OutputReview(reply.strip(), False, None)
