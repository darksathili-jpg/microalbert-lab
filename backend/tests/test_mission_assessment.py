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
