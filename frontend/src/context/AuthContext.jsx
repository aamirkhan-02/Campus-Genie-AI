import { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  const { user: userData, token, requiresVerification } = res.data.data;
  localStorage.setItem('token', token);
  setUser(userData);
  if (requiresVerification) {
    toast('Please verify your email', { icon: '📧' });
  } else {
    toast.success('Welcome back! 🎉');
  }
  return { user: userData, requiresVerification };
};

  const register = async (username, email, password) => {
  const res = await api.post('/auth/register', { username, email, password });
  const { user: userData, token, requiresVerification } = res.data.data;
  localStorage.setItem('token', token);
  setUser(userData);
  toast.success('Account created! Check your email for verification code 📧');
  return { user: userData, requiresVerification };
};

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out');
  };

  const updateUser = (updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}