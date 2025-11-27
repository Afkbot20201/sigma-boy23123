const jwt = require('jsonwebtoken');
const { enqueuePlayer, leaveQueue } = require('./matchmaking');
const {
  handleMove,
  handleResign,
  handleOfferDraw,
  handleRespondDraw,
  handleRematchRequest,
  handleChat,
  handleTyping
} = require('./gameManager');

function setupSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.emit('authSuccess', { userId: socket.user.id, username: socket.user.username });

    socket.on('joinQueue', (payload) => enqueuePlayer(io, socket, payload));
    socket.on('leaveQueue', () => leaveQueue(socket));

    socket.on('move', (payload) => handleMove(io, socket, payload));
    socket.on('resign', (payload) => handleResign(io, socket, payload));
    socket.on('offerDraw', (payload) => handleOfferDraw(io, socket, payload));
    socket.on('respondDraw', (payload) => handleRespondDraw(io, socket, payload));
    socket.on('requestRematch', (payload) => handleRematchRequest(io, socket, payload));

    socket.on('sendChat', (payload) => handleChat(io, socket, payload));
    socket.on('typing', (payload) => handleTyping(io, socket, payload));

    socket.on('disconnect', () => {
      leaveQueue(socket);
    });
  });
}

module.exports = setupSockets;
