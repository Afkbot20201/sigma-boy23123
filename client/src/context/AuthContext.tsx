import React, { createContext, useEffect, useState } from 'react';
import { getMe, login, register as apiRegister } from '../services/authApi';

interface User {
  id: string;
  username: string;
  email: string;
  elo_rating: number;
  rank_tier: string;
  role: string;
}

interface AuthValue {
  user: User | null;
  token: string | null;
  loginFn: (id: string, pw: string) => Promise<void>;
  registerFn: (u: string, e: string, p: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const u = await getMe(token);
        setUser(u);
      } catch {
        setToken(null);
        localStorage.removeItem('token');
      }
    })();
  }, [token]);

  const loginFn = async (identifier: string, password: string) => {
    const { token: t } = await login(identifier, password);
    setToken(t);
    localStorage.setItem('token', t);
    const u = await getMe(t);
    setUser(u);
  };

  const registerFn = async (u: string, e: string, p: string) => {
    const { token: t } = await apiRegister(u, e, p);
    setToken(t);
    localStorage.setItem('token', t);
    const user = await getMe(t);
    setUser(user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loginFn, registerFn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
