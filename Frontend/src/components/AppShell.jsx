import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Utensils, Plus, ChartNoAxesCombined, Users, Bell, Droplets, Scale, Dumbbell, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { endpoints } from '../services/api.js';
import QuickAdd from './QuickAdd.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { avatarUrl } from '../utils/avatar.js';

export default function AppShell() {
  const [quickOpen, setQuickOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  useEffect(() => { endpoints.reminders().then(setReminders).catch(() => {}); }, [location.pathname]);

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand brand-logo-button" onClick={() => navigate('/')}><img className="brand-logo-mark" src="/zhealth-mark.png" alt="Zhealth"/><span>Zhealth</span></button>
      <div className="top-actions">
        <button className="icon-btn notification-btn" onClick={() => navigate('/notifications')}><Bell size={20}/>{reminders.length > 0 && <i>{Math.min(reminders.length, 9)}</i>}</button>
        <button className="avatar-btn user-avatar-btn" onClick={() => navigate('/profile')}><img src={avatarUrl(user?.avatarId)} alt="Avatar" /></button>
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
    ['Comida', Utensils, 'purple', 'meal'], ['Agua', Droplets, 'blue', 'water'], ['Peso', Scale, 'green', 'weight'], ['Gym', Dumbbell, 'yellow', 'gym'], ['Zhealth AI', Sparkles, 'purple', 'ai']
  ];
  return <div className="quick-grid">{actions.map(([label, Icon, tone, key]) => <button key={key} onClick={() => onPick(key)}><span className={`quick-icon ${tone}`}><Icon size={21}/></span><span>{label}</span></button>)}</div>;
}
