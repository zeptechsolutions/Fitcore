import { useState } from 'react';
import { Eye, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { endpoints } from '../services/api.js';
import { Card, ErrorBox, SectionTitle } from '../components/Ui.jsx';

const privacyLabels={weight:'Peso',measurements:'Medidas corporales',macros:'Macros',meals:'Comidas',score:'Score',gym:'Gym',streaks:'Rachas',activity:'Pasos y distancia',sleep:'Sueño'};
export default function SettingsPage(){
  const {user,refreshUser}=useAuth();
  const [privacy,setPrivacy]=useState(user.privacy||{}),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const savePrivacy=async()=>{try{setError('');await endpoints.updateMe({privacy});await refreshUser();setSaved(true);setTimeout(()=>setSaved(false),1500)}catch(e){setError(e.message)}};
  return <div className="page"><div className="page-heading"><div><span className="eyebrow">Configuración</span><h1>Tu privacidad, bajo tu control.</h1><p className="muted">Elegí exactamente qué pueden ver tus amigos. El resto permanece privado.</p></div></div><ErrorBox message={error}/>
  <Card><SectionTitle title="Privacidad" action={<LockKeyhole size={18}/>}/><div className="settings-list">{Object.entries(privacyLabels).map(([key,label])=><div key={key}><div><Eye size={18}/><span>{label}</span></div><select value={privacy[key]||'private'} onChange={e=>setPrivacy({...privacy,[key]:e.target.value})}><option value="private">Solo yo</option><option value="friends">Mis amigos</option></select></div>)}</div><button className="btn secondary" onClick={savePrivacy}>{saved?'Privacidad guardada':'Guardar privacidad'}</button></Card>
  </div>;
}
