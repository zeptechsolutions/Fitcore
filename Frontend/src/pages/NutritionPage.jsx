import { useEffect, useRef, useState } from 'react';
import { Barcode, Brain, Camera, Heart, Plus, Search, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { endpoints } from '../services/api.js';
import { Card, Empty, ErrorBox, Loading, Modal, Pill, Progress, SectionTitle } from '../components/Ui.jsx';
import { n, pct, todayISO } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSearchParams } from 'react-router-dom';

const mealLabels={breakfast:'Desayuno',lunch:'Almuerzo',dinner:'Cena',snack:'Snack'};
const blankItem=()=>({name:'',quantity:1,unit:'porción',calories:'',protein:'',carbs:'',fats:''});

export default function NutritionPage(){
  const {user}=useAuth();
  const [params,setParams]=useSearchParams();
  const [meals,setMeals]=useState([]),[favorites,setFavorites]=useState([]),[recipes,setRecipes]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [modal,setModal]=useState(null),[type,setType]=useState('breakfast'),[description,setDescription]=useState(''),[aiResult,setAiResult]=useState(null),[busy,setBusy]=useState(false),[barcode,setBarcode]=useState(''),[product,setProduct]=useState(null),[grams,setGrams]=useState('100');
  const load=async()=>{try{setLoading(true);setError('');const [m,f,r]=await Promise.all([endpoints.meals(todayISO()),endpoints.favorites(),endpoints.recipes()]);setMeals(m);setFavorites(f);setRecipes(r);}catch(e){setError(e.message);}finally{setLoading(false);}};
  useEffect(()=>{load()},[]);
  useEffect(()=>{if(params.get('add')==='meal'){setModal('add');params.delete('add');setParams(params,{replace:true});}},[]);
  const totals=meals.reduce((a,m)=>({calories:a.calories+(m.totals?.calories||0),protein:a.protein+(m.totals?.protein||0),carbs:a.carbs+(m.totals?.carbs||0),fats:a.fats+(m.totals?.fats||0)}),{calories:0,protein:0,carbs:0,fats:0});
  const analyze=async()=>{setBusy(true);setError('');try{setAiResult(await endpoints.analyzeMeal(description));}catch(e){setError(e.message)}finally{setBusy(false)}};
  const saveAI=async()=>{setBusy(true);try{await endpoints.createMeal({type,title:aiResult.title,description,source:'ai',items:aiResult.items});closeAll();await load();}catch(e){setError(e.message)}finally{setBusy(false)}};
  const searchBarcode=async(code=barcode)=>{setBusy(true);setError('');try{setBarcode(code);setProduct(await endpoints.barcode(code));}catch(e){setError(e.message)}finally{setBusy(false)}};
  const logBarcode=async()=>{setBusy(true);try{const calc=await endpoints.barcodeServing(barcode,Number(grams));await endpoints.createMeal({type,title:calc.name,source:'barcode',items:[calc.mealItem]});closeAll();await load();}catch(e){setError(e.message)}finally{setBusy(false)}};
  const closeAll=()=>{setModal(null);setAiResult(null);setDescription('');setProduct(null);setBarcode('');setError('');};
  if(loading)return <Loading/>;
  return <div className="page">
    <div className="page-heading"><div><span className="eyebrow">Nutrición</span><h1>Comé. Registrá. Seguí.</h1></div><button className="btn primary compact" onClick={()=>setModal('add')}><Plus size={18}/> Agregar</button></div>
    <ErrorBox message={error}/>
    <Card className="nutrition-hero"><div className="calorie-total"><span>Calorías hoy</span><strong>{n(totals.calories)}</strong><small>de {n(user?.macroGoals?.calories)} kcal</small></div><Progress value={pct(totals.calories,user?.macroGoals?.calories)} tone="purple"/><div className="macro-chips"><span><b>{n(totals.protein,1)}g</b> proteína</span><span><b>{n(totals.carbs,1)}g</b> carbos</span><span><b>{n(totals.fats,1)}g</b> grasas</span></div></Card>
    <SectionTitle title="Comidas de hoy"/>
    <div className="meal-list">{meals.length?meals.map(m=><Card key={m._id} className="meal-card"><div><Pill tone="purple">{mealLabels[m.type]||m.type}</Pill><h3>{m.title||m.description||'Comida'}</h3><span>{n(m.totals?.calories)} kcal · {n(m.totals?.protein,1)}g proteína</span></div><button className="icon-btn danger" onClick={async()=>{await endpoints.deleteMeal(m._id);load();}}><Trash2 size={17}/></button></Card>):<Empty icon={UtensilsCrossed} title="Todavía no registraste comidas" text="Usá IA, un favorito o el escáner para empezar."/>}</div>
    <div className="nutrition-sections">
      <Card><SectionTitle title="Favoritos" action={<button className="mini-add" onClick={()=>setModal('favorite')}><Plus size={16}/></button>}/>{favorites.length?<div className="compact-list">{favorites.slice(0,6).map(f=><button key={f._id} onClick={async()=>{await endpoints.logFavorite(f._id);load();}}><div><strong>{f.name}</strong><span>{n(f.totals?.calories)} kcal · usado {f.useCount||0} veces</span></div><Plus size={18}/></button>)}</div>:<p className="muted">Guardá combinaciones frecuentes para registrarlas con un toque.</p>}</Card>
      <Card><SectionTitle title="Recetas" action={<button className="mini-add" onClick={()=>setModal('recipe')}><Plus size={16}/></button>}/>{recipes.length?<div className="compact-list">{recipes.slice(0,6).map(r=><div key={r._id}><div><strong>{r.name}</strong><span>{n(r.totals?.calories)} kcal · {r.servings} porciones</span></div></div>)}</div>:<p className="muted">Creá tus recetas y guardá todos sus ingredientes.</p>}</Card>
    </div>

    <Modal open={modal==='add'} title="Registrar comida" onClose={closeAll}>
      <div className="method-grid"><button onClick={()=>setModal('ai')}><Brain/><strong>Con IA</strong><span>Describí lo que comiste</span></button><button onClick={()=>setModal('barcode')}><Barcode/><strong>Código de barras</strong><span>Cámara o número manual</span></button><button onClick={()=>setModal('manual')}><Plus/><strong>Manual</strong><span>Ingresá macros</span></button><button onClick={()=>setModal('favorite')}><Heart/><strong>Nuevo favorito</strong><span>Guardá una comida frecuente</span></button></div>
    </Modal>

    <Modal open={modal==='ai'} title="Analizar comida con IA" onClose={closeAll} wide>
      <div className="form-stack"><MealType value={type} onChange={setType}/><label>¿Qué comiste?<textarea rows="4" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ej: 3 huevos, 2 panes con aguacate y un vaso de leche"/></label>{!aiResult&&<button className="btn primary" disabled={busy||description.length<3} onClick={analyze}>{busy?'Analizando...':'Analizar con IA'}</button>}{aiResult&&<div className="ai-result"><div className="ai-result-head"><div><span className="eyebrow">Estimación</span><h3>{aiResult.title}</h3></div><Pill tone="green">{Math.round((aiResult.confidence||0)*100)}% confianza</Pill></div><div className="macro-chips"><span><b>{n(aiResult.totals?.calories)}</b> kcal</span><span><b>{n(aiResult.totals?.protein,1)}g</b> proteína</span><span><b>{n(aiResult.totals?.carbs,1)}g</b> carbos</span><span><b>{n(aiResult.totals?.fats,1)}g</b> grasas</span></div><div className="compact-list">{aiResult.items?.map((x,i)=><div key={i}><div><strong>{x.name}</strong><span>{n(x.quantity,1)} {x.unit}</span></div><span>{n(x.calories)} kcal</span></div>)}</div><p className="fineprint">{aiResult.disclaimer}</p><button className="btn primary" disabled={busy} onClick={saveAI}>Confirmar y guardar</button></div>}<ErrorBox message={error}/></div>
    </Modal>

    <Modal open={modal==='barcode'} title="Escanear producto" onClose={closeAll}>
      <div className="form-stack"><BarcodeCamera onDetected={searchBarcode}/><label>Código de barras<div className="inline-field"><input inputMode="numeric" value={barcode} onChange={e=>setBarcode(e.target.value.replace(/\D/g,''))} placeholder="7501055300123"/><button className="btn secondary" disabled={busy||barcode.length<8} onClick={()=>searchBarcode()}><Search size={17}/></button></div></label>{product&&<div className="product-card"><Pill tone="yellow">{product.brand||'Producto'}</Pill><h3>{product.name}</h3><span>{n(product.macrosPer100g?.calories)} kcal / 100g</span><label>Gramos consumidos<input type="number" value={grams} onChange={e=>setGrams(e.target.value)}/></label><MealType value={type} onChange={setType}/><button className="btn primary" onClick={logBarcode}>Registrar producto</button><p className="fineprint">{product.note}</p></div>}<ErrorBox message={error}/></div>
    </Modal>

    <Modal open={modal==='manual'} title="Registro manual" onClose={closeAll}><ManualMeal onSaved={()=>{closeAll();load()}} type={type} setType={setType}/></Modal>
    <Modal open={modal==='favorite'} title="Crear favorito" onClose={closeAll} wide><SavedMealBuilder mode="favorite" onSaved={()=>{closeAll();load()}}/></Modal>
    <Modal open={modal==='recipe'} title="Crear receta" onClose={closeAll} wide><SavedMealBuilder mode="recipe" onSaved={()=>{closeAll();load()}}/></Modal>
  </div>;
}

function MealType({value,onChange}){return <label>Tipo<select value={value} onChange={e=>onChange(e.target.value)}>{Object.entries(mealLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>}

function ManualMeal({onSaved,type,setType}){const [form,setForm]=useState({title:'',calories:'',protein:'',carbs:'',fats:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');const submit=async(e)=>{e.preventDefault();setBusy(true);try{await endpoints.createMeal({type,title:form.title,source:'manual',items:[{name:form.title||'Comida',quantity:1,unit:'porción',calories:Number(form.calories),protein:Number(form.protein),carbs:Number(form.carbs),fats:Number(form.fats)}]});onSaved()}catch(err){setError(err.message)}finally{setBusy(false)}};return <form className="form-stack" onSubmit={submit}><MealType value={type} onChange={setType}/><label>Nombre<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Almuerzo" required/></label><div className="form-row"><label>Calorías<input type="number" value={form.calories} onChange={e=>setForm({...form,calories:e.target.value})} required/></label><label>Proteína<input type="number" value={form.protein} onChange={e=>setForm({...form,protein:e.target.value})}/></label></div><div className="form-row"><label>Carbos<input type="number" value={form.carbs} onChange={e=>setForm({...form,carbs:e.target.value})}/></label><label>Grasas<input type="number" value={form.fats} onChange={e=>setForm({...form,fats:e.target.value})}/></label></div><ErrorBox message={error}/><button className="btn primary" disabled={busy}>Guardar</button></form>}

function SavedMealBuilder({mode,onSaved}){
  const [name,setName]=useState(''),[servings,setServings]=useState(1),[defaultType,setDefaultType]=useState('snack'),[items,setItems]=useState([blankItem()]),[description,setDescription]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[aiInfo,setAiInfo]=useState(null);
  const update=(i,key,value)=>setItems(rows=>rows.map((r,index)=>index===i?{...r,[key]:value}:r));
  const add=()=>setItems(v=>[...v,blankItem()]); const remove=i=>setItems(v=>v.filter((_,index)=>index!==i));
  const submit=async(e)=>{e.preventDefault();setBusy(true);setError('');try{
    if(mode==='recipe'){
      const basicItems=items.filter(x=>x.name.trim()).map(x=>({name:x.name,quantity:Number(x.quantity)||1,unit:x.unit||'porción'}));
      if(!description.trim()&&!basicItems.length)throw new Error('Describí la receta o agregá ingredientes.');
      const saved=await endpoints.createRecipe({name,servings:Number(servings),description,ingredients:basicItems,analyzeWithAi:true});
      setAiInfo(saved.ai); onSaved();
    } else {
      const normalized=items.filter(x=>x.name.trim()).map(x=>({...x,quantity:Number(x.quantity)||1,calories:Number(x.calories)||0,protein:Number(x.protein)||0,carbs:Number(x.carbs)||0,fats:Number(x.fats)||0}));
      if(!normalized.length)throw new Error('Agregá al menos un alimento.'); await endpoints.createFavorite({name,defaultType,items:normalized}); onSaved();
    }
  }catch(e){setError(e.message)}finally{setBusy(false)}};
  if(mode==='recipe') return <form className="form-stack" onSubmit={submit}><div className="form-row"><label>Nombre<input value={name} onChange={e=>setName(e.target.value)} placeholder="Mi batido" required/></label><label>Porciones<input type="number" min="1" value={servings} onChange={e=>setServings(e.target.value)}/></label></div><label>Ingredientes y cantidades<textarea rows="5" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ej: 500 ml de leche entera, 80 g de avena, 1 guineo, 2 cucharadas de mantequilla de maní..."/></label><div className="recipe-ai-note"><Brain size={18}/><span><strong>Macros calculados con IA</strong><small>Al guardar, Zhealth analizará toda la receta y calculará calorías, proteína, carbos y grasas. Revisá siempre la estimación.</small></span></div><ErrorBox message={error}/>{aiInfo&&<p className="fineprint">{aiInfo.disclaimer}</p>}<button className="btn primary" disabled={busy}>{busy?'Analizando receta...':'Analizar y guardar receta'}</button></form>;
  return <form className="form-stack" onSubmit={submit}><div className="form-row"><label>Nombre<input value={name} onChange={e=>setName(e.target.value)} placeholder="Mi desayuno" required/></label><MealType value={defaultType} onChange={setDefaultType}/></div><div className="ingredient-builder"><div className="ingredient-head"><strong>Alimentos</strong><button type="button" className="mini-add" onClick={add}><Plus size={15}/></button></div>{items.map((item,i)=><div className="ingredient-row" key={i}><div className="ingredient-main"><input value={item.name} onChange={e=>update(i,'name',e.target.value)} placeholder="Alimento"/><button type="button" onClick={()=>remove(i)} disabled={items.length===1}><X size={15}/></button></div><div className="ingredient-macros"><input type="number" value={item.calories} onChange={e=>update(i,'calories',e.target.value)} placeholder="kcal"/><input type="number" value={item.protein} onChange={e=>update(i,'protein',e.target.value)} placeholder="Prot"/><input type="number" value={item.carbs} onChange={e=>update(i,'carbs',e.target.value)} placeholder="Carb"/><input type="number" value={item.fats} onChange={e=>update(i,'fats',e.target.value)} placeholder="Grasa"/></div></div>)}</div><ErrorBox message={error}/><button className="btn primary" disabled={busy}>Guardar favorito</button></form>
}

function BarcodeCamera({onDetected}){
  const videoRef=useRef(null),streamRef=useRef(null),timerRef=useRef(null);const [active,setActive]=useState(false),[message,setMessage]=useState('');
  const stop=()=>{clearInterval(timerRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;setActive(false)};
  useEffect(()=>stop,[]);
  const start=async()=>{setMessage('');if(!('BarcodeDetector' in window)){setMessage('Tu navegador no soporta escaneo automático. Podés escribir el código manualmente.');return;}try{const detector=new window.BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128']});const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});streamRef.current=stream;videoRef.current.srcObject=stream;await videoRef.current.play();setActive(true);timerRef.current=setInterval(async()=>{try{const codes=await detector.detect(videoRef.current);if(codes?.[0]?.rawValue){const code=codes[0].rawValue;stop();onDetected(code)}}catch{}},650);}catch{setMessage('No pude acceder a la cámara. Podés ingresar el código manualmente.')}};
  return <div className={`barcode-camera ${active?'active':''}`}>{active?<><video ref={videoRef} playsInline muted/><div className="scan-frame"/><button type="button" className="camera-stop" onClick={stop}><X size={16}/> Cerrar cámara</button></>:<button type="button" className="camera-start" onClick={start}><Camera size={20}/><span><strong>Usar cámara</strong><small>Apuntá al código de barras</small></span></button>}{message&&<p className="fineprint">{message}</p>}</div>
}
