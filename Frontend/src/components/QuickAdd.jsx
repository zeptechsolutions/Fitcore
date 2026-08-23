import { useState } from 'react';
import { Droplets, Dumbbell, Scale, Sparkles, Utensils } from 'lucide-react';
import { endpoints } from '../services/api.js';
import { Modal, ErrorBox } from './Ui.jsx';

export default function QuickAdd({ open, onClose, onNavigate }) {
  const [mode, setMode] = useState(null);
  const [weight, setWeight] = useState('');
  const [gymTitle, setGymTitle] = useState('Entrenamiento');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reset = () => { setMode(null); setWeight(''); setError(''); onClose(); };
  const run = async (fn) => { setBusy(true); setError(''); try { await fn(); reset(); window.dispatchEvent(new Event('fitcore:refresh')); } catch(e) { setError(e.message); } finally { setBusy(false); } };

  return <Modal open={open} title={mode ? 'Registro rápido' : '¿Qué querés registrar?'} onClose={reset}>
    {!mode && <div className="quick-modal-grid">
      <button onClick={() => { reset(); onNavigate('/nutrition?add=meal'); }}><Utensils/><strong>Comida</strong><span>Manual o con IA</span></button>
      <button onClick={() => setMode('water')}><Droplets/><strong>Agua</strong><span>Por botella</span></button>
      <button onClick={() => setMode('weight')}><Scale/><strong>Peso</strong><span>Nuevo registro</span></button>
      <button onClick={() => setMode('gym')}><Dumbbell/><strong>Gym</strong><span>Marcar entreno</span></button>
      <button onClick={() => { reset(); onNavigate('/ai'); }}><Sparkles/><strong>FitCore AI</strong><span>Preguntá o analizá</span></button>
    </div>}
    {mode === 'water' && <div className="form-stack"><p className="muted">¿Cuánto de tu botella tomaste?</p><div className="fraction-grid">{[[.25,'¼'],[.5,'½'],[1,'1']].map(([f,l]) => <button key={f} className="fraction-btn" disabled={busy} onClick={() => run(() => endpoints.addWater(f))}>{l}<small>botella</small></button>)}</div><ErrorBox message={error}/></div>}
    {mode === 'weight' && <form className="form-stack" onSubmit={(e)=>{e.preventDefault(); run(()=>endpoints.addWeight({weightKg:Number(weight)}));}}><label>Peso actual (kg)<input autoFocus type="number" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="61.4"/></label><ErrorBox message={error}/><button className="btn primary" disabled={busy||!weight}>Guardar peso</button></form>}
    {mode === 'gym' && <form className="form-stack" onSubmit={(e)=>{e.preventDefault(); run(()=>endpoints.addGym({title:gymTitle}));}}><label>Entrenamiento<input value={gymTitle} onChange={e=>setGymTitle(e.target.value)} /></label><ErrorBox message={error}/><button className="btn primary" disabled={busy}>Marcar como completado</button></form>}
  </Modal>;
}
