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
  const {id,code}=event.data||{};
  if(typeof code!=='string'||code.length>10000){self.postMessage({id,error:'Programme trop long ou invalide.'});return;}
  try{
    const py=await runtime();
    const output=[];
    py.setStdout({batched:s=>output.push(s)});
    py.setStderr({batched:s=>output.push(s)});
    const result=await py.runPythonAsync(code);
    self.postMessage({id,output:output.join('\n'),result:result===undefined||result===null?'':String(result)});
    if(result&&typeof result.destroy==='function')result.destroy();
  }catch(error){
    self.postMessage({id,error:String(error&&error.message||error)});
  }
};
