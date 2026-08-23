import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import NutritionPage from './pages/NutritionPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import SocialPage from './pages/SocialPage.jsx';
import AIPage from './pages/AIPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import { Loading } from './components/Ui.jsx';

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="brand-mark large">Z</div><Loading/></div>;
  return user ? <AppShell/> : <Navigate to="/auth" replace/>;
}

export default function App() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/auth" element={user ? <Navigate to="/" replace/> : <AuthPage/>}/>
    <Route element={<Protected/>}>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/nutrition" element={<NutritionPage/>}/>
      <Route path="/progress" element={<ProgressPage/>}/>
      <Route path="/social" element={<SocialPage/>}/>
      <Route path="/ai" element={<AIPage/>}/>
      <Route path="/profile" element={<ProfilePage/>}/>
      <Route path="/settings" element={<SettingsPage/>}/>
      <Route path="/notifications" element={<NotificationsPage/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
