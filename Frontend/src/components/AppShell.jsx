import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Utensils, Plus, ChartNoAxesCombined, Users, Bell, UserRound, Droplets, Scale, Dumbbell, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { endpoints } from '../services/api.js';
import QuickAdd from './QuickAdd.jsx';

const nav = [
  ['/', Home, 'Inicio'], ['/nutrition', Utensils, 'Nutrición'], ['/progress', ChartNoAxesCombined, 'Progreso'], ['/social', Users, 'Social']
];

export default function AppShell() {
  const [quickOpen, setQuickOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { endpoints.reminders().then(setReminders).catch(() => {}); }, [location.pathname]);

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => navigate('/')}><span className="brand-mark">F</span><span>FitCore</span></button>
      <div className="top-actions">
        <button className="icon-btn notification-btn" onClick={() => navigate('/settings')}><Bell size={20}/>{reminders.length > 0 && <i>{Math.min(reminders.length, 9)}</i>}</button>
        <button className="avatar-btn" onClick={() => navigate('/profile')}><UserRound size={20}/></button>
      </div>
    </header>
    <main className="main-content"><Outlet /></main>
    <nav className="bottom-nav">
      <NavLink to="/" end>{({isActive}) => <><Home size={21}/><span>Inicio</span><i className={isActive?'active-dot':''}/></>}</NavLink>
      <NavLink to="/nutrition">{({isActive}) => <><Utensils size={21}/><span>Nutrición</span><i className={isActive?'active-dot':''}/></>}</NavLink>
      <button className="quick-add" onClick={() => setQuickOpen(true)}><Plus size={28}/></button>
      <NavLink to="/progress">{({isActive}) => <><ChartNoAxesCombined size={21}/><span>Progreso</span><i className={isActive?'active-dot':''}/></>}</NavLink>
      <NavLink to="/social">{({isActive}) => <><Users size={21}/><span>Social</span><i className={isActive?'active-dot':''}/></>}</NavLink>
    </nav>
    <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} onNavigate={(path) => { setQuickOpen(false); navigate(path); }} />
  </div>;
}

export function QuickActionGrid({ onPick }) {
  const actions = [
    ['Comida', Utensils, 'purple', 'meal'], ['Agua', Droplets, 'blue', 'water'], ['Peso', Scale, 'green', 'weight'], ['Gym', Dumbbell, 'yellow', 'gym'], ['FitCore AI', Sparkles, 'purple', 'ai']
  ];
  return <div className="quick-grid">{actions.map(([label, Icon, tone, key]) => <button key={key} onClick={() => onPick(key)}><span className={`quick-icon ${tone}`}><Icon size={21}/></span><span>{label}</span></button>)}</div>;
}
