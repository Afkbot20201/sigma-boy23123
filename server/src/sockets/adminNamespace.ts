import { Server, Socket } from 'socket.io';
import { liveGames, rankedQueue, casualQueue } from './state.js';

export function registerAdminNamespace(io: Server) {
  const nsp = io.of('/admin');
  nsp.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (!user || user.username !== 'Gifty' || user.role !== 'admin') {
      socket.disconnect();
      return;
    }

    socket.on('admin:stats', () => {
      socket.emit('admin:stats', {
        activeUsers: io.engine.clientsCount,
        activeGames: liveGames.size,
        rankedQueueSize: rankedQueue.length,
        casualQueueSize: casualQueue.length,
        serverUptimeSec: process.uptime()
      });
    });
  });
}
