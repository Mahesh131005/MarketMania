// frontend/src/services/chatService.js
import { io } from 'socket.io-client';

let socket;
const backend_url = 'http://localhost:3000'; // Adjust if needed

export const initializeSocket = () => {
  if (!socket) {
    socket = io(backend_url);
  }
  return socket;
};

export const joinGameChat = (gameId) => {
  if (!socket) initializeSocket();
  socket.emit('join-lobby', gameId); // Reusing 'join-lobby' room logic for chat
};

export const sendMessage = (gameId, userId, username, avatar, text, roundNumber) => {
  if (!socket) initializeSocket();
  // Emit to socket only. Server handles persistence and broadcast.
  socket.emit('send-message', { gameId, userId, username, avatar, text, roundNumber });
};

export const subscribeToMessages = (callback) => {
  if (!socket) initializeSocket();
  // Listen for specific message event
  socket.on('receive-message', callback);
  return () => socket.off('receive-message', callback);
};