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
          const user_id = localStorage.getItem('user_id');
          if (!user_id) {
            console.error("User not logged in");
            return;
          }

          const response = await fetch('/api/game/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomID: roomId, userId: user_id }),
          });

          const data = await response.json();
          
          if (data.exists) {
            // Transform backend data to match the expected roomSettings format
            setFetchedRoomSettings({
              name: data.room.room_name,
              numStocks: data.room.num_stocks,
              roundTime: data.room.round_time,
              maxPlayers: data.room.max_players,
              initialMoney: data.room.initial_money,
              numRounds: data.room.num_rounds
            });
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