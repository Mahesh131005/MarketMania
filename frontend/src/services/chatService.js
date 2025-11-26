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

export const sendMessage = (gameId, userId, username, text, roundNumber) => {
  if (!socket) initializeSocket();
  // We emit to socket AND call API to save to DB
  socket.emit('send-message', { gameId, userId, username, text, roundNumber });

  // Optimistic UI or let socket broadcast handle it. 
  // Ideally call the API here:
  fetch(`${backend_url}/api/game/${gameId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, username, text, roundNumber })
  }).catch(err => console.error(err));
};

export const subscribeToMessages = (callback) => {
  if (!socket) initializeSocket();
  // Listen for specific message event
  socket.on('receive-message', callback);
  return () => socket.off('receive-message', callback);
};