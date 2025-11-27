import { useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export function useSocket(namespace: '/queue' | '/game' | '/admin') {
  const { token } = useAuth();

  const socket: Socket | null = useMemo(() => {
    if (!token) return null;
    return io(`${import.meta.env.VITE_API_URL}${namespace}`, {
      auth: { token },
      transports: ['websocket']
    });
  }, [token, namespace]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return socket;
}
