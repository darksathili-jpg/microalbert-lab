"""Contrôles documentaires du guide enseignant (sans réseau ni clé API)."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
GUIDE = ROOT / "docs" / "enseignants" / "guide-installation.html"

class GuideParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.links = []
        self.scripts = []
        self.inputs = 0
        self.lang = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "a":
            self.links.append(a.get("href", ""))
        if tag == "input" and a.get("type") == "checkbox":
            self.inputs += 1
        if tag == "script":
            self.scripts.append(a.get("src"))

class TestTeacherGuide(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = GUIDE.read_text(encoding="utf-8")
        cls.parser = GuideParser()
        cls.parser.feed(cls.content)

    def test_french_and_required_sections(self):
        self.assertEqual(self.parser.lang, "fr")
        self.assertTrue({"acces", "cle", "test", "demarrage", "depannage", "recette"} <= self.parser.ids)

    def test_local_navigation(self):
        for link in self.parser.links:
            if link.startswith("#"):
                self.assertIn(link[1:], self.parser.ids)

    def test_teacher_checklist(self):
        self.assertEqual(self.parser.inputs, 5)
        self.assertIn('aria-live="polite"', self.content)

    def test_no_external_script_or_api_key_literal(self):
        self.assertTrue(all(src is None for src in self.parser.scripts))
        self.assertNotIn("sk-", self.content)
        self.assertIn("ALBERT_API_KEY", self.content)

    def test_safe_local_url_and_projector_mode(self):
        self.assertIn("http://127.0.0.1:8765", self.content)
        self.assertIn('value="projector"', self.content)
        self.assertIn('data-theme="projector"', self.content)

if __name__ == "__main__":
    unittest.main()
