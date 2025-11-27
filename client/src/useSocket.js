import { useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

export function useSocket(ns) {
  const { token } = useAuth();
  const socket = useMemo(() => {
    if (!token) return null;
    return io((import.meta.env.VITE_API_URL || 'http://localhost:4000') + ns, {
      auth: { token }
    });
  }, [token, ns]);

  useEffect(() => {
    return () => socket && socket.disconnect();
  }, [socket]);

  return socket;
}
