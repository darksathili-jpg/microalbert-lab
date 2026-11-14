"""Never execute student code; structural evidence is not correctness."""
import pytest
from app.mission_assessment import assess_queue_submission as assess

def test_starter_not_certified():
    r = assess("def enfiler(file, valeur): pass\ndef defiler(file): pass")
    assert r["functional_correctness"] == "not_evaluated"
    assert {"empty_body", "missing_return"} <= {f["code"] for f in r["findings"]}

def test_incorrect_but_structurally_complete():
    r = assess("def enfiler(file, valeur): file.clear()\ndef defiler(file): return 999")
    assert r["findings"] == []
    assert r["functional_correctness"] == "not_evaluated"

def test_missing_duplicate_and_nested():
    assert sum(f["code"] == "missing_function" for f in assess("def wrapper():\n def enfiler(a,b): pass")["findings"]) == 2
    r = assess("def enfiler(a,b): pass\ndef enfiler(a,b): pass\ndef defiler(a): return None")
    assert any(f["code"] == "duplicate_definition" for f in r["findings"])

def test_async_signature_and_syntax():
    r = assess("async def enfiler(a): pass\ndef defiler(a,b=1): return None")
    assert {"async_definition", "signature"} <= {f["code"] for f in r["findings"]}
    assert assess("def x(:")["syntax_valid"] is False

@pytest.mark.parametrize("source", ["", " ", "x"*8001, None])
def test_invalid_input(source):
    with pytest.raises(ValueError):
        assess(source)

def test_no_execution(tmp_path):
    marker = tmp_path / "unsafe"
    assess(f"__import__('pathlib').Path({str(marker)!r}).write_text('unsafe')")
    assert not marker.exists()


def test_nested_return_is_not_mistaken_for_defiler_return():
    source = (
        "def enfiler(file, valeur):\n    file.append(valeur)\n"
        "def defiler(file):\n"
        "    def interne():\n        return 42\n"
        "    interne()\n"
    )
    report = assess(source)
    assert report["syntax_valid"] is True
    assert any(item["code"] == "missing_return" for item in report["findings"])
    assert report["functional_correctness"] == "not_evaluated"


def test_return_in_control_flow_counts_as_structural_evidence_only():
    source = (
        "def enfiler(file, valeur):\n    file.append(valeur)\n"
        "def defiler(file):\n    if file:\n        return None\n"
    )
    report = assess(source)
    assert not any(item["code"] == "missing_return" for item in report["findings"])
    assert report["functional_correctness"] == "not_evaluated"


def test_decorated_functions_are_flagged_without_execution(tmp_path):
    marker = tmp_path / "decorator_was_executed"
    source = (
        "def dangerous(fn):\n"
        f"    __import__('pathlib').Path({str(marker)!r}).touch()\n"
        "    return fn\n"
        "@dangerous\n"
        "def enfiler(file, valeur):\n    file.append(valeur)\n"
        "def defiler(file):\n    return None\n"
    )
    report = assess(source)
    assert any(item["code"] == "decorated_definition" for item in report["findings"])
    assert not marker.exists()
    assert report["functional_correctness"] == "not_evaluated"


def test_return_in_class_method_is_not_defiler_return():
    source = (
        "def enfiler(file, valeur):\n    file.append(valeur)\n"
        "def defiler(file):\n"
        "    class Interne:\n        def method(self):\n            return 1\n"
        "    Interne()\n"
    )
    assert any(item["code"] == "missing_return" for item in assess(source)["findings"])
