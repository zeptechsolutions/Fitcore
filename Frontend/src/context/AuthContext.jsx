import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { endpoints } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fitcore_user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('fitcore_token')));

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('fitcore:unauthorized', onUnauthorized);
    if (!localStorage.getItem('fitcore_token')) {
      setLoading(false);
      return () => window.removeEventListener('fitcore:unauthorized', onUnauthorized);
    }
    endpoints.me().then((data) => {
      setUser(data); localStorage.setItem('fitcore_user', JSON.stringify(data));
    }).catch(() => {
      localStorage.removeItem('fitcore_token'); localStorage.removeItem('fitcore_user'); setUser(null);
    }).finally(() => setLoading(false));
    return () => window.removeEventListener('fitcore:unauthorized', onUnauthorized);
  }, []);

  const authenticate = (data) => {
    localStorage.setItem('fitcore_token', data.token);
    localStorage.setItem('fitcore_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (payload) => { const data = await endpoints.login(payload); authenticate(data); return data; };
  const register = async (payload) => { const data = await endpoints.register(payload); authenticate(data); return data; };
  const logout = () => { localStorage.removeItem('fitcore_token'); localStorage.removeItem('fitcore_user'); setUser(null); };
  const refreshUser = async () => { const data = await endpoints.me(); setUser(data); localStorage.setItem('fitcore_user', JSON.stringify(data)); return data; };

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
