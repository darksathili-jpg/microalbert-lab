import type activities from './training-preview.json';

export default function TrainingPreview({ activity }: { activity: typeof activities[number] }) {
  const example = activity.test_case;

  return <section aria-label="Exemple de test justifié">
    <p>Ce programme d’exemple contient une erreur. Cherche ce que le test met en évidence.</p>
    <pre className="guided-call"><code>{activity.examples[1].source}</code></pre>
    <pre className="guided-call"><code>{example.expression}</code></pre>
    <dl className="guided-results">
      <dt>Résultat attendu</dt><dd><code>{example.expected}</code></dd>
      <dt>Résultat observé</dt><dd><code>{example.observed}</code></dd>
      <dt>Pourquoi ce cas ?</dt><dd>{example.justification}</dd>
    </dl>
    <p className="guided-feedback">Que révèle l’écart entre le résultat attendu et celui de ce programme ?</p>
    <p className="small">Inspiré du sujet {activity.reference}.</p>
  </section>;
}
