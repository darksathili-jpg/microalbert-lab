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
