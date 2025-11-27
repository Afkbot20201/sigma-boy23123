import { Server } from 'socket.io';
import { registerQueueNamespace } from './queueNamespace.js';
import { registerGameNamespace } from './gameNamespace.js';
import { registerAdminNamespace } from './adminNamespace.js';

export function registerSockets(io: Server) {
  registerQueueNamespace(io);
  registerGameNamespace(io);
  registerAdminNamespace(io);
}
