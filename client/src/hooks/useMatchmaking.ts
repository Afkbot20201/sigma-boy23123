import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export function useMatchmaking(mode: 'casual' | 'ranked') {
  const socket = useSocket('/queue');
  const [status, setStatus] = useState<'idle' | 'queued' | 'matched'>('idle');
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('queue:joined', () => setStatus('queued'));
    socket.on('queue:left', () => setStatus('idle'));
    socket.on('match:found', (data: any) => {
      setGameId(data.gameId);
      setStatus('matched');
    });
    return () => {
      socket.off('queue:joined');
      socket.off('queue:left');
      socket.off('match:found');
    };
  }, [socket]);

  const joinQueue = (timeControl: string) => {
    socket?.emit('queue:join', { mode, timeControl });
  };

  const leaveQueue = () => {
    socket?.emit('queue:leave');
    setStatus('idle');
  };

  return { status, gameId, joinQueue, leaveQueue };
}
