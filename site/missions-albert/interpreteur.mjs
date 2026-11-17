// Sous-ensemble pédagogique déterministe de Python : aucune évaluation dynamique.
export function interpreterProgramme(source,limite=40){
  const lines=source.replace(/\r/g,'').split('\n');
  const vars=new Map(),commands=[];
  let hasLoop=false,hasVariable=false,hasCondition=false,hasWhile=false;
  const err=(i,msg)=>{throw Error(msg+' (ligne '+(i+1)+').')};
  const value=(s,i)=>{
    s=s.trim();
    if(/^\d+$/.test(s))return Number(s);
    if(s==='True')return true;
    if(s==='False')return false;
    if(/^[a-zA-Z_]\w*$/.test(s)&&vars.has(s))return vars.get(s);
    err(i,'Valeur ou variable inconnue');
  };
  const condition=(s,i)=>{
    s=s.trim();
    const logic=/^(.+?)\s+(and|or)\s+(.+)$/.exec(s);
    if(logic)return logic[2]==='and'?(condition(logic[1],i)&&condition(logic[3],i)):(condition(logic[1],i)||condition(logic[3],i));
    const comparison=/^(.+?)\s*(==|!=|<=|>=|<|>)\s*(.+)$/.exec(s);
    if(comparison){
      const a=value(comparison[1],i),b=value(comparison[3],i);
      switch(comparison[2]){
        case '==':return a===b;case '!=':return a!==b;
        case '<':return a<b;case '>':return a>b;
        case '<=':return a<=b;case '>=':return a>=b;
      }
    }
    const result=value(s,i);
    if(typeof result!=='boolean')err(i,'Une condition doit produire un booléen');
    return result;
  };
  const indentation=i=>(lines[i].match(/^ */)||[''])[0].length;
  const significant=i=>lines[i].trim()&&!lines[i].trim().startsWith('#');
  const nextBlock=(i,end,indent)=>{
    let j=i+1;while(j<end&&(!significant(j)||indentation(j)>indent))j++;
    const first=Array.from({length:j-i-1},(_,k)=>i+k+1).find(significant);
    if(first===undefined||indentation(first)<=indent)err(i,'Bloc indenté attendu');
    return {start:i+1,end:j,indent:indentation(first)};
  };
  function execute(start,end,indent,depth){
    if(depth>8)throw Error('Imbrication excessive.');
    for(let i=start;i<end;){
      if(!significant(i)){i++;continue;}
      if(indentation(i)!==indent)err(i,'Indentation incorrecte');
      const line=lines[i].trim();
      const assign=/^([a-zA-Z_]\w*)\s*=\s*(\d+|True|False)$/.exec(line);
      if(assign){vars.set(assign[1],value(assign[2],i));hasVariable=true;i++;continue;}
      const increment=/^([a-zA-Z_]\\w*)\\s*(\\+=|-=)\\s*(\\d+)$/.exec(line);
      if(increment){
        if(!vars.has(increment[1])||!Number.isInteger(vars.get(increment[1])))err(i,'Variable entière attendue');
        vars.set(increment[1],vars.get(increment[1])+(increment[2]==='+='?1:-1)*Number(increment[3]));
        hasVariable=true;i++;continue;
      }
      const whileMatch=/^while\\s+(.+):$/.exec(line);
      if(whileMatch){
        hasWhile=true;const child=nextBlock(i,end,indent);
        let repetitions=0;
        while(condition(whileMatch[1],i)){
          if(++repetitions>limite)err(i,'Boucle non bornée interrompue : limite de sécurité atteinte');
          execute(child.start,child.end,child.indent,depth+1);
        }
        i=child.end;continue;
      }
      const loop=/^for\s+([a-zA-Z_]\w*)\s+in\s+range\((\d+|[a-zA-Z_]\w*)\):$/.exec(line);
      if(loop){
        hasLoop=true;const count=value(loop[2],i);
        if(!Number.isInteger(count)||count<0||count>limite)err(i,'Nombre de répétitions invalide');
        const child=nextBlock(i,end,indent);
        for(let n=0;n<count;n++)execute(child.start,child.end,child.indent,depth+1);
        i=child.end;continue;
      }
      const branch=/^(if|elif)\s+(.+):$/.exec(line);
      if(branch&&branch[1]==='if'){
        hasCondition=true;let matched=false,j=i;
        while(j<end){
          if(!significant(j)){j++;continue;}
          const branchLine=lines[j].trim();
          const head=/^(if|elif)\s+(.+):$/.exec(branchLine);
          const otherwise=branchLine==='else:';
          if(j!==i&&!((head&&head[1]==='elif')||otherwise))break;
          const child=nextBlock(j,end,indent);
          if(!matched&&(otherwise||condition(head[2],j))){
            execute(child.start,child.end,child.indent,depth+1);matched=true;
          }
          j=child.end;
        }
        i=j;continue;
      }
      if(line==='else:'||line.startsWith('elif '))err(i,'Branche sans if');
      const command=/^albert\.(avancer|tourner_gauche|tourner_droite)\(\)$/.exec(line);
      if(!command)err(i,'Instruction non reconnue');
      commands.push(command[1]);
      if(commands.length>limite)throw Error('Limite de '+limite+' commandes dépassée.');
      i++;
    }
  }
  execute(0,lines.length,0,0);
  return {commands,hasLoop,hasVariable,hasCondition,hasWhile};
}
