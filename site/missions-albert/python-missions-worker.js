/* Python réel pour les missions d'Albert : exécution isolée et trace de commandes.
   La page principale conserve seule la responsabilité des collisions et des animations. */
const VERSION='0.27.7';
const CDNS=['https://cdn.jsdelivr.net/pyodide/v'+VERSION+'/full/','https://unpkg.com/pyodide@'+VERSION+'/'];
let engine;
async function python(){
 if(!engine)engine=(async()=>{
  let last;
  for(const base of CDNS){
   try{
    self.postMessage({type:'loading',message:'Chargement de Python…'});
    importScripts(base+'pyodide.js');
    return await loadPyodide({indexURL:base});
   }catch(error){last=error;}
  }
  throw Error('Pyodide indisponible : '+String(last?.message||last));
 })().catch(error=>{engine=null;throw error;});
 return engine;
}
self.onmessage=async ({data})=>{
 if(data?.type==='init'){
  try{await python();self.postMessage({type:'ready'});}
  catch(error){self.postMessage({type:'init-error',error:String(error?.message||error)});}
  return;
 }
 if(data?.type!=='run')return;
 const {id,code,limit,requirements={}}=data;
 if(typeof code!=='string'||code.length>10000||!Number.isInteger(limit)||limit<1||limit>100){
  self.postMessage({id,error:'Programme ou limite invalide.'});return;
 }
 let scope;
 try{
  const py=await python(),output=[];
  py.setStdout({batched:s=>output.push(s)});
  py.setStderr({batched:s=>output.push(s)});
  scope=py.runPython('dict(__name__="__main__")');
  scope.set('_albert_limit',limit);
  scope.set('_student_code',code);
  scope.set('_requirements_json',JSON.stringify(requirements));
  // Analyse de l'arbre syntaxique Python : les commentaires et chaînes ne valident pas une notion.
  const analysis=`import ast
import json
_tree = ast.parse(_student_code)
_nodes = list(ast.walk(_tree))
_requirements = json.loads(_requirements_json)
if _requirements.get("loop") and not any(isinstance(n, ast.For) for n in _nodes):
    raise ValueError("Cette mission demande une boucle bornée for.")
if _requirements.get("while") and not any(isinstance(n, ast.While) for n in _nodes):
    raise ValueError("Cette mission demande une boucle non bornée while.")
if _requirements.get("condition") and not any(isinstance(n, ast.If) for n in _nodes):
    raise ValueError("Cette mission demande une structure conditionnelle if.")
if _requirements.get("variable") and not any(
    isinstance(n, (ast.Assign, ast.AnnAssign)) and isinstance(n.value, ast.Constant)
    and type(n.value.value) is int for n in _nodes
):
    raise ValueError("Cette mission demande une affectation d'une valeur entière à une variable.")
`;
  py.runPython(analysis,{globals:scope});
  const prelude=`_albert_commands = []
class _Albert:
    def _action(self, name):
        if len(_albert_commands) >= _albert_limit:
            raise RuntimeError("Limite de commandes atteinte.")
        _albert_commands.append(name)
    def avancer(self):
        self._action("avancer")
    def tourner_gauche(self):
        self._action("tourner_gauche")
    def tourner_droite(self):
        self._action("tourner_droite")
albert = _Albert()
`;
  await py.runPythonAsync(prelude+code,{globals:scope});
  const commands=scope.get('_albert_commands').toJs();
  self.postMessage({id,commands,output:output.join('\n')});
 }catch(error){self.postMessage({id,error:String(error?.message||error)});}
 finally{if(scope)scope.destroy();}
};
