import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import PythonLab from './PythonLab';

type Theme='light'|'dark'|'projector';
function App(){
 const [theme,setTheme]=useState<Theme>('light');
 const [mascotReady,setMascotReady]=useState(true);
 const [logoReady,setLogoReady]=useState(true);
 return <div className="app" data-theme={theme}>
  <header className="topbar">
   <div className="logo">{logoReady?<img className="brand-icon" src={import.meta.env.BASE_URL+'microalbert-reference-logo.png'} alt="" onError={()=>setLogoReady(false)}/>:<span className="atom" aria-hidden="true">⚛</span>}
    <div><div className="logo-title">Micro<span className="yellow">Albert</span> <span className="orange">Lab</span></div><div className="logo-sub">Laboratoire pédagogique · Première et Terminale NSI · Démonstration publique non certifiée</div></div>
   </div>
   <div className="edition">Démo publique · Sans compte</div>
   <label>Affichage : <select value={theme} onChange={e=>setTheme(e.target.value as Theme)}><option value="light">Clair</option><option value="dark">Sombre</option><option value="projector">Vidéoprojecteur</option></select></label>
  </header>
  <div className="stage">
   <aside className="mascot-panel" aria-label="Illustration de MicroAlbert">{mascotReady?<img src={import.meta.env.BASE_URL+'microalbert-reference-left.png'} alt="MicroAlbert au tableau, avec son ordinateur et des livres de NSI" onError={()=>setMascotReady(false)}/>:<div className="mascot-fallback">Illustration indisponible.</div>}</aside>
   <main className="workspace"><section className="sheet"><section aria-labelledby="student-heading">
    <h2 id="student-heading" className="mode-heading">Espace Élève <span className="mode-status">Pilote élèves — non certifié</span></h2>
    <p className="mode-intro">Expérimenter avec Python dans le navigateur. Ne saisissez aucune donnée personnelle. Aucun appel à Albert API n'est activé.</p>
    <PythonLab/>
   </section></section></main>
  </div>
  <footer>Démonstration publique · Aucun espace Enseignant ou Audit dans cette version · Travaux non sauvegardés</footer>
 </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
