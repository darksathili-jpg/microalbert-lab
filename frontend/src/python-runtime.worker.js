/* Worker classique, isolé du DOM ; aucune donnée personnelle ni secret transmis. */
let active=false;
self.onmessage=async event=>{
 if(active||event.data?.type!=='run')return;
 active=true;
 const id=event.data.id;
 const source=event.data.source;
 try{
  if(typeof source!=='string')throw Error('Code source invalide');
  const pyodideBase = new URL('../pyodide/', self.location.href).href;
  importScripts(pyodideBase + 'pyodide.js');
  const pyodide=await loadPyodide({indexURL:pyodideBase});
  const output=[];let used=0;let truncated=false;
  const append=(stream,value)=>{
   const text=String(value);
   const available=Math.max(0,16000-used);
   if(text.length>available)truncated=true;
   if(available>0){output.push({stream,text:text.slice(0,available)});used+=Math.min(text.length,available);}
  };
  pyodide.setStdout({batched:value=>append('stdout',value+'\n')});
  pyodide.setStderr({batched:value=>append('stderr',value+'\n')});
  try{
   await pyodide.runPythonAsync(source);
   self.postMessage({type:'result',id,output,truncated,success:true});
  }catch(error){
   self.postMessage({type:'result',id,output,truncated,success:false,error:String(error)});
  }
 }catch(error){self.postMessage({type:'result',id,output:[],success:false,error:'Initialisation Python impossible : '+String(error)});}
 finally{self.close();}
};
