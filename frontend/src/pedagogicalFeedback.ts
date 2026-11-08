export type ExecutionOutcome = 'success'|'error'|'timeout'|'stopped'|'engine-error';
export type PedagogicalGuidance = {category:string;question:string;nextStep:string;verified:boolean};

/** Deterministic guidance based only on execution status and Python error text.
 * Does not assess mission correctness or disclose an implementation. */
export function guideExecution(outcome:ExecutionOutcome,error=''):PedagogicalGuidance {
 if(outcome==='timeout')return {category:'Exécution interrompue par le délai',question:'Quelle instruction pourrait répéter indéfiniment une opération ? Comment vérifier que la condition d’arrêt peut être atteinte ?',nextStep:'Teste une entrée simple et observe l’évolution des variables.',verified:false};
 if(outcome==='stopped')return {category:'Exécution arrêtée',question:'Quelle partie du programme souhaitais-tu observer avant l’arrêt ?',nextStep:'Réduis ton exemple et formule le résultat attendu.',verified:false};
 if(outcome==='engine-error')return {category:'Moteur Python indisponible',question:'Le problème vient-il de ton programme ou de l’environnement d’exécution ?',nextStep:'Signale cette erreur technique à l’enseignant ; ne modifie pas ton algorithme pour la contourner.',verified:false};
 if(outcome==='success')return {category:'Exécution terminée sans exception',question:'Le résultat obtenu correspond-il à celui que tu avais prévu ? Comment le vérifier avec une file vide et une file contenant plusieurs éléments ?',nextStep:'Écris un appel de fonction et son résultat attendu, puis compare-le au résultat observé.',verified:false};
 if(/\bSyntaxError\b|\bIndentationError\b|\bTabError\b/.test(error))return {category:'Erreur de syntaxe ou d’indentation',question:'À quelle ligne Python signale-t-il une difficulté ? Quels signes de ponctuation ou niveaux d’indentation peux-tu contrôler ?',nextStep:'Relis la ligne indiquée et celle qui la précède avant de relancer.',verified:false};
 if(/\bNameError\b|\bUnboundLocalError\b/.test(error))return {category:'Nom non défini',question:'À quel endroit ce nom reçoit-il une valeur ? Est-il accessible à l’endroit où tu l’utilises ?',nextStep:'Repère les affectations et vérifie l’orthographe du nom.',verified:false};
 if(/\bIndexError\b/.test(error))return {category:'Indice hors limites',question:'Que se passe-t-il lorsque la file est vide ? Ton programme traite-t-il ce cas ?',nextStep:'Prépare un test avec une liste vide.',verified:false};
 if(/\bTypeError\b|\bAttributeError\b/.test(error))return {category:'Opération incompatible avec une valeur',question:'Quel type de valeur manipules-tu à cette étape ? L’opération choisie est-elle disponible pour ce type ?',nextStep:'Vérifie les valeurs et leurs types au moment de l’erreur.',verified:false};
 if(/\bZeroDivisionError\b/.test(error))return {category:'Division par zéro',question:'Quelle expression produit un diviseur nul ? Comment pourrais-tu tester ce cas ?',nextStep:'Identifie les valeurs utilisées dans l’expression.',verified:false};
 return {category:'Exception Python',question:'Quelle ligne est signalée par Python et quelles valeurs y sont utilisées ?',nextStep:'Formule une hypothèse puis vérifie-la avec une entrée simple.',verified:false};
}
