import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuth } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setAuth(token);
      api.get('/auth/me').then(r => setUser(r.data.user)).catch(() => {
        setToken(null);
        setAuth(null);
        localStorage.removeItem('token');
      });
    }
  }, [token]);

  const login = async (identifier, password) => {
    const r = await api.post('/auth/login', { emailOrUsername: identifier, password });
    localStorage.setItem('token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
  };

  const register = async (username, email, password) => {
    const r = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAuth(null);
  };

  return <Ctx.Provider value={{ user, token, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
