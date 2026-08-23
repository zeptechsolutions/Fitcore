import { useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { endpoints } from '../services/api.js';
import { ErrorBox } from '../components/Ui.jsx';

const initial = { name:'', username:'', email:'', password:'', birthDate:'', biologicalSex:'unspecified', heightCm:'', currentWeightLb:'', targetWeightLb:'', goal:'tracking', activityLevel:'moderate', weeklyGymGoal:3 };

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(initial);
  const [reset, setReset] = useState({email:'',code:'',password:''});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const set = (key) => (e) => setForm(v => ({...v,[key]:e.target.value}));
  const switchMode = (next) => { setMode(next); setError(''); setNotice(''); };

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if(mode==='login') await login({email:form.email,password:form.password});
      else await register({...form,heightCm:Number(form.heightCm)||undefined,currentWeightLb:Number(form.currentWeightLb)||undefined,targetWeightLb:Number(form.targetWeightLb)||undefined,weeklyGymGoal:Number(form.weeklyGymGoal)||3});
    } catch(err){ setError(err.message); } finally { setBusy(false); }
  };

  const requestCode = async (e) => { e.preventDefault(); setBusy(true);setError('');try{await endpoints.forgotPassword(reset.email);setNotice('Si existe una cuenta con ese correo, enviamos un código de 6 dígitos.');setMode('reset')}catch(e){setError(e.message)}finally{setBusy(false)} };
  const doReset = async (e) => { e.preventDefault(); setBusy(true);setError('');try{await endpoints.resetPassword(reset.email,reset.code,reset.password);setNotice('Contraseña actualizada. Ya podés iniciar sesión.');setForm(v=>({...v,email:reset.email,password:''}));setMode('login')}catch(e){setError(e.message)}finally{setBusy(false)} };

  return <div className="auth-page">
    <div className="auth-hero">
      <div className="auth-brand"><span className="brand-mark large">Z</span><span>Zhealth</span></div>
      <div className="hero-copy"><span className="eyebrow"><Sparkles size={15}/> Tu progreso, conectado</span><h1>Construí consistencia.<br/><em>Medí el progreso.</em></h1><p>Nutrición, actividad, descanso y un plan adaptado a tus objetivos.</p></div>
      <div className="hero-orbit"><Activity/></div>
    </div>
    <div className="auth-panel">
      {['login','register'].includes(mode) && <div className="auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>switchMode('login')}>Entrar</button><button className={mode==='register'?'active':''} onClick={()=>switchMode('register')}>Crear cuenta</button></div>}

      {mode==='forgot' && <form onSubmit={requestCode} className="auth-form"><button type="button" className="text-btn back-link" onClick={()=>switchMode('login')}><ArrowLeft size={16}/> Volver</button><div><span className="eyebrow">Recuperación</span><h2>Restablecé tu contraseña</h2><p className="muted">Te enviaremos un código temporal al correo de tu cuenta.</p></div><label>Correo<input type="email" value={reset.email} onChange={e=>setReset({...reset,email:e.target.value})} required/></label><ErrorBox message={error}/>{notice&&<p className="success-text">{notice}</p>}<button className="btn primary large" disabled={busy}><KeyRound size={18}/>{busy?'Enviando...':'Enviar código'}</button></form>}

      {mode==='reset' && <form onSubmit={doReset} className="auth-form"><button type="button" className="text-btn back-link" onClick={()=>switchMode('forgot')}><ArrowLeft size={16}/> Volver</button><div><span className="eyebrow">Código enviado</span><h2>Creá una nueva contraseña</h2><p className="muted">El código vence en 15 minutos.</p></div><label>Código de 6 dígitos<input inputMode="numeric" maxLength="6" value={reset.code} onChange={e=>setReset({...reset,code:e.target.value.replace(/\D/g,'')})} required/></label><label>Nueva contraseña<input type="password" minLength="8" value={reset.password} onChange={e=>setReset({...reset,password:e.target.value})} required/></label><ErrorBox message={error}/>{notice&&<p className="success-text">{notice}</p>}<button className="btn primary large" disabled={busy}>{busy?'Guardando...':'Cambiar contraseña'}<ArrowRight size={18}/></button></form>}

      {['login','register'].includes(mode) && <form onSubmit={submit} className="auth-form">
        <div><span className="eyebrow">{mode==='login'?'Bienvenido de nuevo':'Tu plan empieza acá'}</span><h2>{mode==='login'?'Entrá a tu cuenta':'Creá tu cuenta'}</h2>{mode==='register'&&<p className="muted">Estos datos ayudan a Zhealth a calcular un punto de partida personalizado. Después podés cambiarlos.</p>}</div>
        {mode==='register' && <><div className="form-row"><label>Nombre<input value={form.name} onChange={set('name')} placeholder="David" required/></label><label>Usuario<input value={form.username} onChange={set('username')} placeholder="david" required/></label></div></>}
        <label>Correo<input type="email" value={form.email} onChange={set('email')} placeholder="tu@correo.com" required/></label>
        <label>Contraseña<div className="password-field"><input type={show?'text':'password'} value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" required/><button type="button" onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        {mode==='login' && <button type="button" className="text-btn forgot-link" onClick={()=>{setReset(v=>({...v,email:form.email}));switchMode('forgot')}}>¿Olvidaste tu contraseña?</button>}
        {mode==='register' && <div className="onboarding-fields"><div className="form-row"><label>Fecha de nacimiento<input type="date" value={form.birthDate} onChange={set('birthDate')} required/></label><label>Sexo para estimación<select value={form.biologicalSex} onChange={set('biologicalSex')}><option value="unspecified">Prefiero no indicar</option><option value="male">Masculino</option><option value="female">Femenino</option></select></label></div><div className="form-row"><label>Altura (cm)<input type="number" min="50" max="260" value={form.heightCm} onChange={set('heightCm')} required/></label><label>Peso actual (lb)<input type="number" min="44" step="0.1" value={form.currentWeightLb} onChange={set('currentWeightLb')} required/></label></div><div className="form-row"><label>Peso objetivo (lb)<input type="number" min="44" step="0.1" value={form.targetWeightLb} onChange={set('targetWeightLb')}/></label><label>Objetivo<select value={form.goal} onChange={set('goal')}><option value="gain">Ganar peso</option><option value="lose">Perder grasa</option><option value="maintain">Mantener</option><option value="recomp">Recomposición</option><option value="tracking">Solo seguimiento</option></select></label></div><div className="form-row"><label>Actividad física<select value={form.activityLevel} onChange={set('activityLevel')}><option value="sedentary">Sedentario</option><option value="light">Ligero</option><option value="moderate">Moderado</option><option value="active">Activo</option><option value="very_active">Muy activo</option></select></label><label>Gym por semana<input type="number" min="0" max="14" value={form.weeklyGymGoal} onChange={set('weeklyGymGoal')}/></label></div></div>}
        <ErrorBox message={error}/>{notice&&<p className="success-text">{notice}</p>}
        <button className="btn primary large" disabled={busy}>{busy?'Procesando...':mode==='login'?'Entrar':'Crear cuenta y generar plan'}<ArrowRight size={18}/></button>
      </form>}
    </div>
  </div>;
}
