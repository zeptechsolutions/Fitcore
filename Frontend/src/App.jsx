import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import AuthPage from './pages/AuthPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import HomePage from './pages/HomePage.jsx';
import NutritionPage from './pages/NutritionPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import SocialPage from './pages/SocialPage.jsx';
import AIPage from './pages/AIPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import GymPage from './pages/GymPage.jsx';
import { Loading } from './components/Ui.jsx';

function MainProtected(){const {user,loading}=useAuth();if(loading)return <div className="splash"><img className="splash-logo" src="/zhealth-mark.png" alt="Zhealth"/><Loading/></div>;if(!user)return <Navigate to="/auth" replace/>;if(user.onboardingCompleted===false)return <Navigate to="/onboarding" replace/>;return <AppShell/>}
function OnboardingProtected(){const {user,loading}=useAuth();if(loading)return <Loading/>;if(!user)return <Navigate to="/auth" replace/>;if(user.onboardingCompleted!==false)return <Navigate to="/" replace/>;return <OnboardingPage/>}
export default function App(){const {user}=useAuth();return <Routes><Route path="/auth" element={user?<Navigate to={user.onboardingCompleted===false?'/onboarding':'/'} replace/>:<AuthPage/>}/><Route path="/onboarding" element={<OnboardingProtected/>}/><Route element={<MainProtected/>}><Route path="/" element={<HomePage/>}/><Route path="/nutrition" element={<NutritionPage/>}/><Route path="/progress" element={<ProgressPage/>}/><Route path="/gym" element={<GymPage/>}/><Route path="/social" element={<SocialPage/>}/><Route path="/ai" element={<AIPage/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
