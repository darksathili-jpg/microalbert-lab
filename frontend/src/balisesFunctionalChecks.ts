/** Tests publics de comportement, indépendants du corrigé enseignant. */
export const balisesPublicCases = [
 {id:'vide',label:'Liste vide',argument:'[]',expected:'[]',question:'Quel résultat une liste vide doit-elle produire ?'},
 {id:'unique',label:'Une valeur',argument:"['ON']",expected:"[('ON', 1)]",question:'Quand enregistres-tu la dernière plage ?'},
 {id:'alternance',label:'Plages séparées',argument:"['OFF','ON','OFF']",expected:"[('OFF', 1), ('ON', 1), ('OFF', 1)]",question:'Deux états identiques non consécutifs forment-ils une seule plage ?'},
 {id:'longue',label:'Plage de 256',argument:"['ON'] * 256",expected:"[('ON', 256)]",question:'Quel effectif obtiens-tu pour une plage de 256 éléments ?'}
] as const;

/** Les expressions sont des constantes écrites par les auteurs, jamais des entrées utilisateur. */
export function buildBalisesChecks(source:string):string {
 const cases=balisesPublicCases.map(c=>`    (${JSON.stringify(c.id)}, ${c.argument}, ${c.expected}),`).join('\n');
 return source+'\n\n# Tests publics MicroAlbert : résultats observés, sans corrigé.\n'+
 'import json as _microalbert_json\n'+
 '_microalbert_cases = [\n'+cases+'\n]\n'+
 '_microalbert_results = []\n'+
 'for _microalbert_id, _microalbert_arg, _microalbert_expected in _microalbert_cases:\n'+
 '    try:\n'+
 '        _microalbert_before = list(_microalbert_arg)\n'+
 '        _microalbert_actual = regrouper(_microalbert_arg)\n'+
 '        _microalbert_ok = type(_microalbert_actual) is list and all(type(_microalbert_pair) is tuple and len(_microalbert_pair) == 2 and type(_microalbert_pair[1]) is int and _microalbert_pair[1] > 0 for _microalbert_pair in _microalbert_actual) and _microalbert_actual == _microalbert_expected and _microalbert_arg == _microalbert_before\n'+
 '        _microalbert_results.append(dict(id=_microalbert_id,ok=_microalbert_ok,actual=repr(_microalbert_actual),unchanged=_microalbert_arg == _microalbert_before))\n'+
 '    except Exception as _microalbert_error:\n'+
 '        _microalbert_results.append(dict(id=_microalbert_id,ok=False,actual=type(_microalbert_error).__name__,unchanged=False))\n'+
 'print("MICROALBERT_CHECKS:"+_microalbert_json.dumps(_microalbert_results))\n';
}
