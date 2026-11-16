import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import GuidedExercises from './GuidedExercise';

type Theme='light'|'dark'|'projector';
function App(){
 const [theme,setTheme]=useState<Theme>('light');
 const [mascotReady,setMascotReady]=useState(true);
 const [logoReady,setLogoReady]=useState(true);
 return <div className="app public-learning" data-theme={theme}>
  <header className="topbar">
   <div className="logo">{logoReady?<img className="brand-icon" src={import.meta.env.BASE_URL+'microalbert-reference-logo.png'} alt="" onError={()=>setLogoReady(false)}/>:<span className="atom" aria-hidden="true">⚛</span>}
    <div><div className="logo-title">Micro<span className="yellow">Albert</span> <span className="orange">Lab</span></div><div className="logo-sub">Numérique et sciences informatiques · Première et Terminale</div></div>
   </div>
   <div className="edition">Démo · Sans compte</div>
   <label>Affichage : <select value={theme} onChange={e=>setTheme(e.target.value as Theme)}><option value="light">Clair</option><option value="dark">Sombre</option><option value="projector">Vidéoprojecteur</option></select></label>
  </header>
  <div className={`stage${mascotReady ? "" : " stage--no-illustration"}`}>
   <aside className={`mascot-panel${mascotReady ? "" : " mascot-panel--missing"}`} aria-label="Illustration de MicroAlbert">{mascotReady?<img src={import.meta.env.BASE_URL+'microalbert-reference-left.webp'} alt="MicroAlbert au tableau, avec son ordinateur et des livres de NSI" onError={()=>setMascotReady(false)}/>:<div className="mascot-fallback" aria-label="Repère pédagogique MicroAlbert"><span className="mascot-fallback-symbol" aria-hidden="true">⚛</span><strong>MicroAlbert</strong><span>Laboratoire Python</span><small>Explorer · Programmer · Vérifier</small></div>}</aside>
   <main className="workspace"><section className="sheet"><section aria-labelledby="student-heading">
    <h1 id="student-heading" className="mode-heading">Entraîne-toi en Python</h1>
    <p className="mode-intro">Prévois un résultat, écris ton programme, puis vérifie-le.</p>
    <GuidedExercises/>
   </section></section></main>
  </div>
  <footer>Exercices guidés dans le navigateur, sans appel à Albert. Le travail est effacé au rechargement.</footer>
 </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
