import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ChatPage from './ChatPage';
import { MessageSquare } from "lucide-react";

const Button = ({ children, onClick, variant, className = '', disabled, ...props }) => {
  const base = "px-6 py-3 rounded-lg font-semibold text-white shadow-md transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
  const styles = variant === 'destructive'
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    : variant === 'success'
      ? "bg-sky-600 hover:bg-sky-700 focus:ring-sky-500"
      : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-sky-100 rounded-2xl shadow-lg hover:shadow-xl transition-shadow ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => <div className="p-6 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-t-2xl">{children}</div>;
const CardTitle = ({ children }) => <h3 className="text-2xl font-bold text-sky-700">{children}</h3>;
const CardContent = ({ children }) => <div className="p-6 space-y-8">{children}</div>;

export default function GameLobby({ roomSettings, roomID, onStartGame, onNavigateToGame }) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120);
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      const user = JSON.parse(userString);
      if (user.user_id === roomSettings.createdBy) setIsHost(true);
    }

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);
    newSocket.emit('join-lobby', roomID);

    const fetchLobbyData = async () => {
      const res = await fetch(`http://localhost:3000/api/game/${roomID}/lobby`);
      const data = await res.json();
      setPlayers(data.players.map(p => ({ id: p.user_id, name: p.full_name, isReady: true, isHost: p.user_id === roomSettings.createdBy })));
    };
    fetchLobbyData();

    newSocket.on('player-joined', fetchLobbyData);
    newSocket.on('game-started', () => onStartGame(roomSettings, roomID));

    return () => {
      newSocket.off('player-joined', fetchLobbyData);
      newSocket.off('game-started');
      newSocket.disconnect();
    };
  }, [roomID, onStartGame, roomSettings]);

  <div className="mb-8 text-center">
  <div className="inline-block bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-8 shadow-xl">
    <p className="text-white text-sm uppercase tracking-wider mb-2">Status</p>
    <div className="text-4xl font-bold text-white bg-white/20 rounded-xl px-8 py-4 shadow-inner">
       Waiting for Host
    </div>
    <p className="text-white text-xs mt-3 opacity-80">Game starts when host clicks start</p>
  </div>
</div>

  const handleStartGame = () => {
    if (socket && isHost) socket.emit('start-game', roomID);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 60) return "text-green-600";
    if (timeLeft > 30) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <CardTitle>Game Lobby</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Room Code:</span>
                <span className="text-2xl font-bold tracking-widest bg-white px-4 py-2 rounded-lg shadow-inner text-sky-700">{roomID}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Timer Section */}
            <div className="mb-8 text-center">
              <div className="inline-block bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-8 shadow-xl">
                <p className="text-white text-sm uppercase tracking-wider mb-2">Game starts in</p>
                <div className={`text-6xl font-bold ${getTimerColor()} bg-white rounded-xl px-8 py-4 shadow-inner`}>{formatTime(timeLeft)}</div>
                <p className="text-white text-xs mt-3 opacity-80">or when host clicks start</p>
              </div>
            </div>

            {/* Game Settings */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-sky-700">Game Settings</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(roomSettings).map(([key, value], index) => (
                  <div key={index} className={`bg-gradient-to-br from-white to-sky-50 p-4 rounded-lg border border-sky-100`}>
                    <p className="text-sm text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-lg font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Players List */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-sky-700">Players ({players.length}/{roomSettings.maxPlayers})</h3>
              <div className="space-y-3">
                {players.map(player => (
                  <div key={player.id} className="flex items-center justify-between bg-sky-50 p-4 rounded-xl border border-sky-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">{player.name.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{player.name}</p>
                        {player.isHost && <p className="text-xs text-sky-600">👑 Host</p>}
                      </div>
                    </div>
                    <div>
                      {player.isReady ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">✓ Ready</span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">⏳ Waiting</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button */}
            {isHost && (
              <div className="flex justify-center">
                <Button variant="success" onClick={handleStartGame} className="text-lg px-12 py-4">🚀 Start Game Now</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen && (
          <Button onClick={() => setIsChatOpen(true)} className="rounded-full h-14 w-14 shadow-xl bg-indigo-600">
            <MessageSquare size={24} />
          </Button>
        )}
      </div>
      {/* FIX: Passed hardcoded 0 because we are in the lobby */}
      <ChatPage gameId={roomID} chatOpen={isChatOpen} setChatOpen={setIsChatOpen} currentRound={0} />
    </div>
  );
}