import { useState } from 'react';
import { Activity, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorBox } from '../components/Ui.jsx';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name:'', username:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const set = (key) => (e) => setForm(v => ({...v,[key]:e.target.value}));
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { if(mode==='login') await login({email:form.email,password:form.password}); else await register(form); }
    catch(err){ setError(err.message); } finally { setBusy(false); }
  };

  return <div className="auth-page">
    <div className="auth-hero">
      <div className="auth-brand"><span className="brand-mark large">F</span><span>FitCore</span></div>
      <div className="hero-copy"><span className="eyebrow"><Sparkles size={15}/> Tu progreso, conectado</span><h1>Construí consistencia.<br/><em>Medí el progreso.</em></h1><p>Nutrición, agua, gym y estadísticas en un solo lugar.</p></div>
      <div className="hero-orbit"><Activity/></div>
    </div>
    <div className="auth-panel">
      <div className="auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>Entrar</button><button className={mode==='register'?'active':''} onClick={()=>setMode('register')}>Crear cuenta</button></div>
      <form onSubmit={submit} className="auth-form">
        <div><span className="eyebrow">{mode==='login'?'Bienvenido de nuevo':'Empezá hoy'}</span><h2>{mode==='login'?'Entrá a tu cuenta':'Creá tu cuenta'}</h2></div>
        {mode==='register' && <div className="form-row"><label>Nombre<input value={form.name} onChange={set('name')} placeholder="David" required/></label><label>Usuario<input value={form.username} onChange={set('username')} placeholder="@david" required/></label></div>}
        <label>Correo<input type="email" value={form.email} onChange={set('email')} placeholder="tu@correo.com" required/></label>
        <label>Contraseña<div className="password-field"><input type={show?'text':'password'} value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" required/><button type="button" onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <ErrorBox message={error}/>
        <button className="btn primary large" disabled={busy}>{busy?'Procesando...':mode==='login'?'Entrar':'Crear cuenta'}<ArrowRight size={18}/></button>
      </form>
    </div>
  </div>;
}
