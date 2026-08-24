import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, LogOut, RefreshCw, Save, Settings2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { endpoints } from '../services/api.js';
import { Card, ErrorBox, Loading, Pill, SectionTitle, SuccessAlert } from '../components/Ui.jsx';
import { goalLabel } from '../utils/format.js';
import { AVATARS, avatarUrl } from '../utils/avatar.js';
import { useNavigate } from 'react-router-dom';

const profileFromUser = user => ({
  name:user.name||'',
  birthDate:user.birthDate?.slice(0,10)||'',
  biologicalSex:user.biologicalSex||'unspecified',
  heightCm:user.heightCm??'',
  currentWeightLb:user.currentWeightLb??'',
  targetWeightLb:user.targetWeightLb??'',
  goal:user.goal||'tracking',
  activityLevel:user.activityLevel||'moderate'
});

const goalsFromUser = user => ({
  waterGoalLiters:user.waterGoalLiters??'',
  weeklyGymGoal:user.weeklyGymGoal??0,
  dailyDistanceGoalKm:user.dailyDistanceGoalMeters!==undefined&&user.dailyDistanceGoalMeters!==null?Number(user.dailyDistanceGoalMeters)/1000:'',
  sleepGoalHours:user.sleepGoalHours??'',
  macroGoals:{
    calories:user.macroGoals?.calories??'',
    protein:user.macroGoals?.protein??'',
    carbs:user.macroGoals?.carbs??'',
    fats:user.macroGoals?.fats??''
  }
});

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export default function ProfilePage(){
 const {user,logout,refreshUser,setUser}=useAuth();
 const nav=useNavigate();
 const [profile,setProfile]=useState(null),[savedProfile,setSavedProfile]=useState(null);
 const [goals,setGoals]=useState(null),[savedGoals,setSavedGoals]=useState(null);
 const [bmi,setBmi]=useState(null),[plan,setPlan]=useState(null),[error,setError]=useState(''),[planBusy,setPlanBusy]=useState(false),[goalsOpen,setGoalsOpen]=useState(false),[success,setSuccess]=useState(false),[successText,setSuccessText]=useState('Tus datos se actualizaron correctamente.'),[avatarBusy,setAvatarBusy]=useState(false),[profileBusy,setProfileBusy]=useState(false),[goalsBusy,setGoalsBusy]=useState(false);

 useEffect(()=>{
   const p=profileFromUser(user),g=goalsFromUser(user);
   setProfile(p);setSavedProfile(p);setGoals(g);setSavedGoals(g);
   endpoints.bmi().then(setBmi).catch(()=>{});
   endpoints.personalPlan().then(setPlan).catch(()=>{});
 // Solo inicializa al entrar/cambiar de cuenta; el avatar no debe borrar cambios sin guardar.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[user?._id]);

 const profileDirty=useMemo(()=>profile&&savedProfile&&!same(profile,savedProfile),[profile,savedProfile]);
 const goalsDirty=useMemo(()=>goals&&savedGoals&&!same(goals,savedGoals),[goals,savedGoals]);
 if(!profile||!goals)return <Loading/>;

 const setProfileField=(k,v)=>setProfile(x=>({...x,[k]:v}));
 const setGoal=(k,v)=>setGoals(x=>({...x,[k]:v}));
 const setMacro=(k,v)=>setGoals(x=>({...x,macroGoals:{...x.macroGoals,[k]:v}}));

 const syncUser=updated=>{setUser(updated);localStorage.setItem('fitcore_user',JSON.stringify(updated));};

 const saveProfile=async e=>{
   e.preventDefault();if(!profileDirty)return;
   setProfileBusy(true);setError('');
   try{
     const updated=await endpoints.updateMe({...profile,heightCm:Number(profile.heightCm)||undefined,currentWeightLb:profile.currentWeightLb?Number(profile.currentWeightLb):undefined,targetWeightLb:profile.targetWeightLb?Number(profile.targetWeightLb):undefined});
     syncUser(updated);const next=profileFromUser(updated);setProfile(next);setSavedProfile(next);
     setBmi(await endpoints.bmi().catch(()=>null));setSuccessText('Tus datos de perfil fueron guardados.');setSuccess(true);
   }catch(e){setError(e.message)}finally{setProfileBusy(false)}
 };

 const saveGoals=async e=>{
   e.preventDefault();if(!goalsDirty)return;
   setGoalsBusy(true);setError('');
   try{
     const updated=await endpoints.updateMe({
       waterGoalLiters:Number(goals.waterGoalLiters)||0,
       weeklyGymGoal:Number(goals.weeklyGymGoal),
       dailyDistanceGoalMeters:(Number(goals.dailyDistanceGoalKm)||0)*1000,
       sleepGoalHours:Number(goals.sleepGoalHours)||0,
       macroGoals:Object.fromEntries(Object.entries(goals.macroGoals).map(([k,v])=>[k,Number(v)||0]))
     });
     syncUser(updated);const next=goalsFromUser(updated);setGoals(next);setSavedGoals(next);
     setSuccessText('Tus metas diarias fueron actualizadas.');setSuccess(true);
   }catch(e){setError(e.message)}finally{setGoalsBusy(false)}
 };

 const chooseAvatar=async id=>{
   if(avatarBusy||Number(user.avatarId)===id)return;
   setAvatarBusy(true);setError('');
   try{const updated=await endpoints.updateMe({avatarId:id});syncUser(updated)}catch(e){setError(e.message)}finally{setAvatarBusy(false)}
 };

 const recalc=async()=>{setPlanBusy(true);setError('');try{const data=await endpoints.recalculatePlan(true);setPlan(data.plan);const updated=await refreshUser();const nextGoals=goalsFromUser(updated);setGoals(nextGoals);setSavedGoals(nextGoals);setSuccessText('Tu plan y tus macros se recalcularon.');setSuccess(true)}catch(e){setError(e.message)}finally{setPlanBusy(false)}};

 return <div className="page">
  <div className="profile-head"><div className="profile-avatar avatar-image"><img src={avatarUrl(user.avatarId)} alt="Avatar"/></div><div><span className="eyebrow">@{user.username}</span><h1>{user.name}</h1><p>{goalLabel[user.goal]} · Nivel {user.level||1}</p></div><Pill tone="green">{user.xp||0} XP</Pill></div>
  <div className="profile-quick"><Card><span>IMC</span><strong>{bmi?.bmi||'—'}</strong><small>{bmi?`${bmi.weightLb} lb / ${bmi.heightCm} cm`:'Completá altura y peso'}</small></Card><Card onClick={()=>nav('/settings')} className="clickable"><Settings2/><strong>Configuración y cuenta</strong><small>Privacidad, seguridad y preferencias</small></Card></div>
  {plan&&<Card className="plan-card"><SectionTitle title="Tu plan Zhealth" action={<Sparkles size={18}/>}/><div className="plan-main"><div><span>Calorías</span><strong>{plan.calories}</strong><small>kcal/día</small></div><div><span>Proteína</span><strong>{plan.protein}g</strong></div><div><span>Carbos</span><strong>{plan.carbs}g</strong></div><div><span>Grasas</span><strong>{plan.fats}g</strong></div></div><p className="muted">Gasto estimado: {plan.estimatedTdee} kcal · Cambio estimado: {plan.estimatedWeeklyChangeLb>0?'+':''}{plan.estimatedWeeklyChangeLb} lb/semana.</p><button className="btn secondary" onClick={recalc} disabled={planBusy}><RefreshCw size={17}/>{planBusy?'Calculando...':'Recalcular con mis datos actuales'}</button></Card>}

  <Card><SectionTitle title="Tu avatar"/><p className="muted avatar-help">El avatar se guarda en el momento en que lo seleccionás.</p><div className="avatar-picker">{AVATARS.map(a=><button type="button" key={a.id} disabled={avatarBusy} className={Number(user.avatarId)===a.id?'avatar-option selected':'avatar-option'} onClick={()=>chooseAvatar(a.id)}><img src={a.url} alt={`Avatar ${a.id}`}/></button>)}</div></Card>

  <form onSubmit={saveProfile}>
   <Card><SectionTitle title="Perfil y objetivo"/><div className="settings-grid">
    <label>Nombre<input value={profile.name} onChange={e=>setProfileField('name',e.target.value)} placeholder="Ingrese su nombre"/></label>
    <label>Fecha de nacimiento<input type="date" value={profile.birthDate} onChange={e=>setProfileField('birthDate',e.target.value)}/></label>
    <label>Sexo para estimación<select value={profile.biologicalSex} onChange={e=>setProfileField('biologicalSex',e.target.value)}><option value="unspecified">Prefiero no indicar</option><option value="male">Masculino</option><option value="female">Femenino</option></select></label>
    <label>Altura (cm)<input type="number" value={profile.heightCm} onChange={e=>setProfileField('heightCm',e.target.value)} placeholder="Ingrese su altura"/></label>
    <label>Peso actual (lb)<input type="number" step="0.1" value={profile.currentWeightLb} onChange={e=>setProfileField('currentWeightLb',e.target.value)} placeholder="Ingrese su peso actual"/></label>
    <label>Peso objetivo (lb)<input type="number" step="0.1" value={profile.targetWeightLb} onChange={e=>setProfileField('targetWeightLb',e.target.value)} placeholder="Ingrese su peso objetivo"/></label>
    <label>Objetivo<select value={profile.goal} onChange={e=>setProfileField('goal',e.target.value)}>{Object.entries(goalLabel).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label>
    <label>Actividad física<select value={profile.activityLevel} onChange={e=>setProfileField('activityLevel',e.target.value)}><option value="sedentary">Sedentario</option><option value="light">Ligero</option><option value="moderate">Moderado</option><option value="active">Activo</option><option value="very_active">Muy activo</option></select></label>
   </div></Card>
   <button className="btn primary profile-save" disabled={!profileDirty||profileBusy}><Save size={18}/>{profileBusy?'Guardando...':'Guardar cambios'}</button>
  </form>

  <Card className="collapsible-card daily-goals-card"><button type="button" className="collapse-trigger" onClick={()=>setGoalsOpen(v=>!v)}><div><span className="eyebrow">Metas diarias</span><strong>Editar mis objetivos del día</strong><small>Macros, agua, recorrido, sueño y gym</small></div>{goalsOpen?<ChevronUp/>:<ChevronDown/>}</button>{goalsOpen&&<form className="collapse-content" onSubmit={saveGoals}><p className="muted">Estos valores son tuyos. Podés usar el plan automático o ajustarlos manualmente.</p><div className="settings-grid"><label>Calorías<input type="number" value={goals.macroGoals.calories} onChange={e=>setMacro('calories',e.target.value)} placeholder="Ingrese su meta de calorías"/></label><label>Proteína (g)<input type="number" value={goals.macroGoals.protein} onChange={e=>setMacro('protein',e.target.value)} placeholder="Ingrese su meta de proteína"/></label><label>Carbohidratos (g)<input type="number" value={goals.macroGoals.carbs} onChange={e=>setMacro('carbs',e.target.value)} placeholder="Ingrese su meta de carbohidratos"/></label><label>Grasas (g)<input type="number" value={goals.macroGoals.fats} onChange={e=>setMacro('fats',e.target.value)} placeholder="Ingrese su meta de grasas"/></label><label>Agua (L)<input type="number" step="0.25" value={goals.waterGoalLiters} onChange={e=>setGoal('waterGoalLiters',e.target.value)} placeholder="Ingrese su meta diaria de agua"/></label><label>Gym por semana<select value={goals.weeklyGymGoal} onChange={e=>setGoal('weeklyGymGoal',e.target.value)}>{Array.from({length:8},(_,i)=><option value={i} key={i}>{i} {i===1?'día':'días'}</option>)}</select></label><label>Recorrido diario (km)<input type="number" min="0" step="0.1" value={goals.dailyDistanceGoalKm} onChange={e=>setGoal('dailyDistanceGoalKm',e.target.value)} placeholder="Ingrese su meta diaria en kilómetros"/></label><label>Sueño objetivo (h)<input type="number" step="0.25" value={goals.sleepGoalHours} onChange={e=>setGoal('sleepGoalHours',e.target.value)} placeholder="Ingrese sus horas objetivo de sueño"/></label></div><button className="btn primary goals-save" disabled={!goalsDirty||goalsBusy}><Save size={18}/>{goalsBusy?'Guardando...':'Guardar metas diarias'}</button></form>}</Card>

  <ErrorBox message={error}/>
  <Card className="account-card"><SectionTitle title="Cuenta" action={<ShieldCheck size={18}/>}/><p className="muted">La administración de seguridad y privacidad ahora está dentro de Configuración.</p><div className="account-actions"><button className="btn secondary" onClick={()=>nav('/settings')}><Settings2 size={17}/> Abrir configuración</button><button className="btn danger-outline" onClick={()=>{logout();nav('/auth')}}><LogOut size={18}/> Cerrar sesión</button></div></Card>
  <SuccessAlert open={success} title="Cambios guardados" text={successText} onClose={()=>setSuccess(false)}/>
 </div>;
}
