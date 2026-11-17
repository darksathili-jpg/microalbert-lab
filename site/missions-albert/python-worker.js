/* Exécution Python isolée dans un Web Worker, jamais dans la page principale. */
const VERSION='0.27.7';
const CDNS=['https://cdn.jsdelivr.net/pyodide/v'+VERSION+'/full/','https://unpkg.com/pyodide@'+VERSION+'/'];
let pyodidePromise;
async function runtime(){
  if(!pyodidePromise)pyodidePromise=(async()=>{
    let lastError;
    for(const base of CDNS){
      try{
        self.postMessage({type:'loading',message:'Chargement du moteur Python depuis '+new URL(base).hostname+'…'});
        importScripts(base+'pyodide.js');
        return await loadPyodide({indexURL:base});
      }catch(error){lastError=error;}
    }
    throw new Error('Impossible de charger Pyodide depuis les deux serveurs : '+String(lastError?.message||lastError));
  })().catch(error=>{pyodidePromise=null;throw error;});
  return pyodidePromise;
}
self.onmessage=async event=>{
  if(event.data?.type==='init'){
    try{await runtime();self.postMessage({type:'ready'});}
    catch(error){self.postMessage({type:'init-error',error:String(error?.message||error)});}
    return;
  }
  const {id,code,lesson,verify}=event.data||{};
  if(typeof code!=='string'||code.length>10000){self.postMessage({id,error:'Programme trop long ou invalide.'});return;}
  try{
    const py=await runtime();
    const output=[];
    py.setStdout({batched:s=>output.push(s)});
    py.setStderr({batched:s=>output.push(s)});
    const result=await py.runPythonAsync(code);
    let evaluation=null;
    if(verify){
      try{
        const response=await fetch('./evaluation/tests-fonctions.py?v=1');
        if(!response.ok)throw new Error('Tests indisponibles : HTTP '+response.status);
        const source=await response.text();
        const evalOutput=[];
        py.setStdout({batched:line=>evalOutput.push(line)});
        await py.runPythonAsync('__albert_lesson = '+Number(lesson)+'\\n'+source);
        const marker=evalOutput.find(line=>line.startsWith('__ALBERT_EVAL__'));
        if(!marker)throw new Error('Résultat des tests absent.');
        evaluation=JSON.parse(marker.slice('__ALBERT_EVAL__'.length));
      }catch(error){evaluation={supported:false,message:'Évaluation indisponible : '+String(error?.message||error)};}
    }
    self.postMessage({id,output:output.join('\\n'),result:result===undefined||result===null?'':String(result),evaluation});
    if(result&&typeof result.destroy==='function')result.destroy();
  }catch(error){
    self.postMessage({id,error:String(error&&error.message||error)});
  }
};
