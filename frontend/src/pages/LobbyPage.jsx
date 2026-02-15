import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Navigate } from 'react-router-dom';
import GameLobby from './GameLobby';

export default function LobbyPage() {
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [fetchedRoomSettings, setFetchedRoomSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use room settings from location state if available (from room creation)
  const roomSettingsFromState = location.state?.roomSettings;

  // Fetch room settings if not available in location state
  useEffect(() => {
    if (!roomSettingsFromState && roomId) {
      const fetchRoomSettings = async () => {
        try {
          const userString = localStorage.getItem('user');
          if (!userString) {
            console.error("User not logged in");
            return;
          }
          const user = JSON.parse(userString);
          const user_id = user.user_id;

          console.log(`[LobbyPage] Joining room: ${roomId} with user: ${user_id}`);
          if (!roomId || !user_id) {
            console.error("Missing roomId or user_id", { roomId, user_id });
            alert("Invalid room or user information.");
            navigate('/user-home');
            return;
          }

          const response = await fetch('http://localhost:3000/api/game/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomID: roomId, userId: user_id }),
          });

          const data = await response.json();

          if (data.exists) {
            // Backend returns 'roomData' with camelCase keys
            setFetchedRoomSettings(data.roomData);
          } else {
            alert("Room not found!");
            navigate('/user-home');
          }
        } catch (error) {
          console.error("Error fetching room settings:", error);
          alert("Failed to join room. Please try again.");
          navigate('/user-home');
        } finally {
          setLoading(false);
        }
      };

      fetchRoomSettings();
    } else {
      setLoading(false);
    }
  }, [roomId, roomSettingsFromState, navigate]);

  // Use either the fetched settings or the ones from location state
  const roomSettings = roomSettingsFromState || fetchedRoomSettings;

  const handleStartGame = () => {
    navigate(`/game/${roomId}`, {
      state: { roomSettings: roomSettings }
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading room data...</div>;
  }

  if (!roomSettings) {
    return <Navigate to="/user-home" replace />;
  }

  return (
    <GameLobby
      roomSettings={roomSettings}
      roomID={roomId}
      onStartGame={handleStartGame}
    />
  );
}