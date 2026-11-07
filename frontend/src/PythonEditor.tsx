import React, { useRef, useState } from 'react';
import './PythonEditor.css';

type Token = { text: string; kind: 'keyword'|'comment'|'string'|'number'|'builtin'|'plain' };
const tokenPattern = /#[^\n]*|(?:\"\"\"[\s\S]*?\"\"\"|'''[\s\S]*?'''|\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*')|\b(?:def|return|if|elif|else|for|while|in|not|and|or|is|pass|None|True|False|class|break|continue|raise|try|except|finally|with|as|import|from|lambda)\b|\b(?:print|range|len|list|append|pop|int|str|bool|enumerate)\b|\b\d+(?:\.\d+)?\b/g;

export function tokenizePython(line: string): Token[] {
 const tokens: Token[] = []; let last = 0;
 for (const match of line.matchAll(tokenPattern)) {
  const at = match.index ?? 0;
  if (at > last) tokens.push({text:line.slice(last,at),kind:'plain'});
  const word = match[0];
  const kind: Token['kind'] = word.startsWith('#')?'comment':
   word.startsWith('"')||word.startsWith("'")?'string':
   /^\d/.test(word)?'number':
   /^(print|range|len|list|append|pop|int|str|bool|enumerate)$/.test(word)?'builtin':'keyword';
  tokens.push({text:word,kind});last=at+word.length;
 }
 if (last < line.length) tokens.push({text:line.slice(last),kind:'plain'});
 return tokens;
}

export function indentSelection(value:string,start:number,end:number,shift:boolean) {
 const first = value.lastIndexOf('\n',start-1)+1;
 let finalEnd=end;let changed='';
 const selected=value.slice(first,end);
 const lines=selected.split('\n');
 const adjusted=lines.map(line=>{
  if(shift){const n=line.startsWith('    ')?4:line.startsWith('\t')?1:Math.min(4,(line.match(/^ */)?.[0].length??0));return line.slice(n);}
  return '    '+line;
 });
 changed=adjusted.join('\n');
 const next=value.slice(0,first)+changed+value.slice(end);
 const offsetFirst=adjusted[0].length-lines[0].length;
 const total=changed.length-selected.length;
 finalEnd=Math.max(first,next.length>=0?end+total:end);
 return {value:next,start:Math.max(first,start+offsetFirst),end:Math.max(first,finalEnd)};
}

type Props={value:string;onChange:(next:string)=>void;id:string;describedBy?:string};
export default function PythonEditor({value,onChange,id,describedBy}:Props){
 const input=useRef<HTMLTextAreaElement>(null);
 const backdrop=useRef<HTMLDivElement>(null);
 const gutter=useRef<HTMLDivElement>(null);
 const [cursor,setCursor]=useState({line:1,column:1});
 const lines=value.split('\n');
 function updateCursor(target:HTMLTextAreaElement){
  const before=target.value.slice(0,target.selectionStart);
  const parts=before.split('\n');
  setCursor({line:parts.length,column:parts[parts.length-1].length+1});
 }
 function syncScroll(target:HTMLTextAreaElement){
  if(backdrop.current){backdrop.current.scrollTop=target.scrollTop;backdrop.current.scrollLeft=target.scrollLeft;}
  if(gutter.current)gutter.current.scrollTop=target.scrollTop;
 }
 function onKeyDown(event:React.KeyboardEvent<HTMLTextAreaElement>){
  const target=event.currentTarget;
  if(event.key==='Tab'){
   event.preventDefault();
   const a=target.selectionStart,b=target.selectionEnd;
   if(a!==b||event.shiftKey){
    const result=indentSelection(value,a,b,event.shiftKey);
    onChange(result.value);
    requestAnimationFrame(()=>{target.setSelectionRange(result.start,result.end);updateCursor(target);});
   }else{
    onChange(value.slice(0,a)+'    '+value.slice(b));
    requestAnimationFrame(()=>{target.setSelectionRange(a+4,a+4);updateCursor(target);});
   }
  }else if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
   event.preventDefault();
   const a=target.selectionStart,b=target.selectionEnd;
   const line=value.slice(value.lastIndexOf('\n',a-1)+1,a);
   const indent=line.match(/^\s*/)?.[0]??'';
   const suffix=/\:\s*(?:#.*)?$/.test(line)?'    ':'';
   const insertion='\n'+indent+suffix;
   onChange(value.slice(0,a)+insertion+value.slice(b));
   requestAnimationFrame(()=>{target.setSelectionRange(a+insertion.length,a+insertion.length);updateCursor(target);});
  }
 }
 return <div className="python-editor">
  <div className="python-editor-toolbar"><span>Python · saisie locale</span><span aria-live="polite">Ligne {cursor.line}, colonne {cursor.column}</span></div>
  <div className="python-editor-frame">
   <div className="python-editor-gutter" ref={gutter} aria-hidden="true">{lines.map((_,i)=><div key={i}>{i+1}</div>)}</div>
   <div className="python-editor-stack">
    <div className="python-editor-highlight" ref={backdrop} aria-hidden="true"><pre>{lines.map((line,i)=><React.Fragment key={i}>{tokenizePython(line).map((token,j)=><span key={j} className={'token-'+token.kind}>{token.text}</span>)}{i<lines.length-1?'\n':null}</React.Fragment>)}</pre></div>
    <textarea id={id} ref={input} className="python-editor-input" value={value} onChange={e=>{onChange(e.target.value);updateCursor(e.target);}} onKeyDown={onKeyDown} onScroll={e=>syncScroll(e.currentTarget)} onClick={e=>updateCursor(e.currentTarget)} onKeyUp={e=>updateCursor(e.currentTarget)} onSelect={e=>updateCursor(e.currentTarget)} spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-describedby={describedBy} aria-label="Code Python, édition au clavier, Tab pour indenter et Maj Tab pour désindenter" />
   </div>
  </div>
  <p className="python-editor-help">Tab : indenter · Maj + Tab : désindenter · Entrée : conserver l'indentation. Pour quitter l'éditeur au clavier, utiliser Ctrl + Tab (ou Maj + Ctrl + Tab).</p>
 </div>;
}
