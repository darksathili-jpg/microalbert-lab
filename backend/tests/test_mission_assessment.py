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


def test_top_level_side_effect_is_reported_but_not_executed(tmp_path):
    marker = tmp_path / "side_effect"
    source = (
        f"__import__('pathlib').Path({str(marker)!r}).touch()\n"
        "def enfiler(f, v):\n f.append(v)\n"
        "def defiler(f):\n return f.pop(0)\n"
    )
    report = assess(source)
    assert "top_level_effect" in {f["code"] for f in report["findings"]}
    assert not marker.exists()
    assert report["functional_correctness"] == "not_evaluated"


def test_module_docstring_does_not_trigger_top_level_warning():
    source = (
        '"""Module de file."""\n'
        "def enfiler(f, v):\n f.append(v)\n"
        "def defiler(f):\n return f.pop(0)\n"
    )
    assert "top_level_effect" not in {f["code"] for f in assess(source)["findings"]}


def test_dynamic_execution_is_detected_without_running(tmp_path):
    marker = tmp_path / "dynamic"
    source = (
        "def enfiler(f, v):\n"
        f" exec(\"open({str(marker)!r}, 'w').close()\")\n"
        "def defiler(f):\n return f.pop(0)\n"
    )
    report = assess(source)
    assert "dynamic_execution" in {f["code"] for f in report["findings"]}
    assert not marker.exists()


def test_nested_dynamic_execution_is_not_attributed_to_outer_function():
    source = (
        "def enfiler(f, v):\n"
        " def inner():\n  eval('1+1')\n"
        " f.append(v)\n"
        "def defiler(f):\n return f.pop(0)\n"
    )
    assert "dynamic_execution" not in {f["code"] for f in assess(source)["findings"]}


def test_definition_time_effects_detected_without_running_code(tmp_path):
    from app.mission_assessment import assess_queue_submission
    marker = tmp_path / "must_not_exist"
    source = ("def enfiler(f, v=__import__('pathlib').Path(" + repr(str(marker)) + ").touch()):\n"
              "    f.append(v)\n"
              "def defiler(f):\n    return f.pop(0)\n")
    result = assess_queue_submission(source)
    assert "definition_time_effect" in {finding["code"] for finding in result["findings"]}
    assert not marker.exists()
    assert result["functional_correctness"] == "not_evaluated"


def test_definition_time_annotation_and_class_body_are_reported():
    from app.mission_assessment import assess_queue_submission
    source = ("class SideEffect:\n    print('not executed')\n"
              "def enfiler(f: print('not executed'), v):\n    f.append(v)\n"
              "def defiler(f):\n    return f.pop(0)\n")
    result = assess_queue_submission(source)
    assert "definition_time_effect" in {finding["code"] for finding in result["findings"]}


def test_plain_definitions_do_not_trigger_definition_time_warning():
    from app.mission_assessment import assess_queue_submission
    source = "def enfiler(f, v):\n    f.append(v)\ndef defiler(f):\n    return f.pop(0)\n"
    result = assess_queue_submission(source)
    assert "definition_time_effect" not in {finding["code"] for finding in result["findings"]}
