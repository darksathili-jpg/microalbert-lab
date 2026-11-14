"""Static, non-executing structural assessment; never certifies correctness."""
import ast


class _OwnReturnVisitor(ast.NodeVisitor):
    """Inspect the current function, not returns in nested functions or lambdas."""

    def __init__(self):
        self.found = False

    def visit_Return(self, node):
        self.found = True

    def visit_FunctionDef(self, node):
        pass

    def visit_AsyncFunctionDef(self, node):
        pass

    def visit_Lambda(self, node):
        pass

    def visit_ClassDef(self, node):
        pass


def _has_own_return(function):
    visitor = _OwnReturnVisitor()
    for statement in function.body:
        visitor.visit(statement)
    return visitor.found


class _DynamicExecutionVisitor(ast.NodeVisitor):
    """Find direct eval/exec calls without entering nested scopes."""

    def __init__(self):
        self.found = False

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name) and node.func.id in {"eval", "exec", "compile"}:
            self.found = True
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        pass

    def visit_AsyncFunctionDef(self, node):
        pass

    def visit_ClassDef(self, node):
        pass

    def visit_Lambda(self, node):
        pass


def _uses_dynamic_execution(function):
    visitor = _DynamicExecutionVisitor()
    for statement in function.body:
        visitor.visit(statement)
    return visitor.found


def assess_queue_submission(source: str) -> dict:
    if not isinstance(source, str) or not source.strip() or len(source) > 8000:
        raise ValueError("invalid_submission")
    try:
        tree = ast.parse(source)
    except (SyntaxError, ValueError, RecursionError):
        return {"syntax_valid": False, "structural_evidence": [], "findings": [
            {"code": "syntax", "function": None, "question": "Quel message de syntaxe Python obtiens-tu ?"}],
            "functional_correctness": "not_evaluated"}
    evidence, findings = [], []
    # Parsing does not execute code, but running the submission as a module
    # could execute top-level statements. Report this risk without executing it.
    if any(isinstance(node, (ast.Expr, ast.Assign, ast.AugAssign, ast.AnnAssign,
                             ast.For, ast.AsyncFor, ast.While, ast.If, ast.With,
                             ast.AsyncWith, ast.Try, ast.Raise, ast.Assert,
                             ast.Match, ast.Delete)) for node in tree.body
           if not (isinstance(node, ast.Expr)
                   and isinstance(node.value, ast.Constant)
                   and isinstance(node.value.value, str))):
        findings.append({"code": "top_level_effect", "function": None,
                         "question": "Quelles instructions s'exécuteraient dès le lancement de ce fichier ?"})
    for name, arity in (("enfiler", 2), ("defiler", 1)):
        matches = [n for n in tree.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name == name]
        def note(code, question):
            findings.append({"code": code, "function": name, "question": question})
        if not matches:
            note("missing_function", f"Où as-tu défini la fonction {name} ?")
            continue
        if len(matches) != 1:
            note("duplicate_definition", f"Pourquoi définis-tu plusieurs fois {name} ?")
            continue
        node = matches[0]
        if isinstance(node, ast.AsyncFunctionDef):
            note("async_definition", f"La mission demande-t-elle une fonction asynchrone pour {name} ?")
        else:
            evidence.append(f"definition:{name}")
        if _uses_dynamic_execution(node):
            note("dynamic_execution", "Pourquoi ton programme a-t-il besoin d'évaluer du code sous forme de texte ?")
        if node.decorator_list:
            note("decorated_definition", f"Quel effet les décorateurs ont-ils sur la fonction {name} ?")
        args = node.args
        if (len(args.posonlyargs) + len(args.args) != arity or args.vararg is not None
                or args.kwarg is not None or args.kwonlyargs or args.defaults or args.kw_defaults):
            note("signature", f"Combien de paramètres la fonction {name} doit-elle recevoir ?")
        else:
            evidence.append(f"arity:{name}:{arity}")
        executable = [stmt for stmt in node.body if not isinstance(stmt, ast.Pass)
                      and not (isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Constant))]
        if not executable:
            note("empty_body", f"Quelle instruction doit effectuer {name} ?")
        if name == "defiler" and not _has_own_return(node):
            note("missing_return", "Quelle valeur defiler doit-elle renvoyer ?")
    return {"syntax_valid": True, "structural_evidence": evidence, "findings": findings,
            "functional_correctness": "not_evaluated"}
