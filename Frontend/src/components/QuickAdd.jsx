import { useState } from 'react';
import { Droplets, Dumbbell, Footprints, Minus, Moon, Scale, Sparkles, Utensils } from 'lucide-react';
import { endpoints } from '../services/api.js';
import { Modal, ErrorBox } from './Ui.jsx';

export default function QuickAdd({ open, onClose, onNavigate }) {
  const [mode, setMode] = useState(null);
  const [weight, setWeight] = useState('');
  const [steps, setSteps] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [gymTitle, setGymTitle] = useState('Entrenamiento');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reset = () => { setMode(null); setWeight(''); setSteps(''); setSleepHours(''); setError(''); onClose(); };
  const run = async (fn) => { setBusy(true); setError(''); try { await fn(); reset(); window.dispatchEvent(new Event('fitcore:refresh')); } catch(e) { setError(e.message); } finally { setBusy(false); } };

  return <Modal open={open} title={mode ? 'Registro rápido' : '¿Qué querés registrar?'} onClose={reset}>
    {!mode && <div className="quick-modal-grid">
      <button onClick={() => { reset(); onNavigate('/nutrition?add=meal'); }}><Utensils/><strong>Comida</strong><span>Manual o con IA</span></button>
      <button onClick={() => setMode('water')}><Droplets/><strong>Agua</strong><span>Sumar o corregir</span></button>
      <button onClick={() => setMode('steps')}><Footprints/><strong>Pasos</strong><span>Actividad diaria</span></button>
      <button onClick={() => setMode('sleep')}><Moon/><strong>Sueño</strong><span>Horas dormidas</span></button>
      <button onClick={() => setMode('weight')}><Scale/><strong>Peso</strong><span>Nuevo registro</span></button>
      <button onClick={() => setMode('gym')}><Dumbbell/><strong>Gym</strong><span>Marcar entreno</span></button>
      <button onClick={() => { reset(); onNavigate('/ai'); }}><Sparkles/><strong>Zhealth AI</strong><span>Preguntá o analizá</span></button>
    </div>}
    {mode === 'water' && <div className="form-stack"><p className="muted">Sumá lo que tomaste o restá si te equivocaste.</p><div className="fraction-grid">{[[.25,'¼'],[.5,'½'],[1,'1']].map(([f,l]) => <button key={`plus-${f}`} className="fraction-btn" disabled={busy} onClick={() => run(() => endpoints.addWater(f))}>+{l}<small>botella</small></button>)}</div><div className="fraction-grid subtract-grid">{[[.25,'¼'],[.5,'½'],[1,'1']].map(([f,l]) => <button key={`minus-${f}`} className="fraction-btn subtract" disabled={busy} onClick={() => run(() => endpoints.subtractWater(f))}><Minus size={15}/>{l}<small>botella</small></button>)}</div><ErrorBox message={error}/></div>}
    {mode === 'steps' && <form className="form-stack" onSubmit={(e)=>{e.preventDefault(); run(()=>endpoints.addActivity({steps:Number(steps)}));}}><label>Pasos de hoy<input autoFocus type="number" min="0" value={steps} onChange={e=>setSteps(e.target.value)} placeholder="8420"/></label><p className="fineprint">Zhealth estima automáticamente los kilómetros recorridos a partir de tus pasos y altura.</p><ErrorBox message={error}/><button className="btn primary" disabled={busy||steps==='' }>Guardar actividad</button></form>}
    {mode === 'sleep' && <form className="form-stack" onSubmit={(e)=>{e.preventDefault(); run(()=>endpoints.addSleep({hours:Number(sleepHours)}));}}><label>Horas dormidas<input autoFocus type="number" min="0" max="24" step="0.25" value={sleepHours} onChange={e=>setSleepHours(e.target.value)} placeholder="7.5"/></label><ErrorBox message={error}/><button className="btn primary" disabled={busy||!sleepHours}>Guardar sueño</button></form>}
    {mode === 'weight' && <form className="form-stack" onSubmit={(e)=>{e.preventDefault(); run(()=>endpoints.addWeight({weightLb:Number(weight)}));}}><label>Peso actual (lb)<input autoFocus type="number" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="135"/></label><ErrorBox message={error}/><button className="btn primary" disabled={busy||!weight}>Guardar peso</button></form>}
    {mode === 'gym' && <form className="form-stack" onSubmit={(e)=>{e.preventDefault(); run(()=>endpoints.addGym({title:gymTitle}));}}><label>Entrenamiento<input value={gymTitle} onChange={e=>setGymTitle(e.target.value)} /></label><ErrorBox message={error}/><button className="btn primary" disabled={busy}>Marcar como completado</button></form>}
  </Modal>;
}
