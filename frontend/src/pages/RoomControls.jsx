import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import CreateRoom from "./CreateRoom";

const RoomControls = () => {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    const backend_url = 'http://localhost:3000';
    if (!roomCode.trim()) {
      alert("Enter a valid room code!");
      return;
    }
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const user_id = storedUser.user_id;
    
    try {
      // Step 1: Check if the room exists and the user can join.
      const res = await fetch(`${backend_url}/api/game/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomID: roomCode.trim(), userId: user_id }),
      });

      const data = await res.json();
      const roomId = roomCode.trim();
      
      if (res.ok && data.exists) {
        // Step 2: Navigate to the lobby using hardcoded room settings for now.
        // As requested, this section uses temporary data instead of fetching it.
     
        // Directly navigate with the hardcoded settings.
        navigate(`/lobby/${roomId}`, {
          state: {
            roomSettings: data.roomData,
            isHost: false // A joining player is never the host
          }
        });

      } else {
        alert("❌ Invalid Room Code! Room does not exist or you cannot join.");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Server error while joining room.");
    }
  };

  // Handle room creation - navigate to lobby
  const handleRoomCreated = (roomSettings, roomId) => {
    navigate(`/lobby/${roomId}`, {
      state: {
        roomSettings: roomSettings,
        isHost: true
      }
    });
  };

  return (
    <div className="flex items-center justify-between w-full p-4 bg-gray-50 rounded shadow">
      {/* Left part: Input + Join button */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Enter room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())} // Ensure code is uppercase
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button onClick={handleJoin}>Join Room</Button>
      </div>

      {/* Right part: Create Room button */}
      <CreateRoom onRoomCreated={handleRoomCreated} />
    </div>
  );
};

export default RoomControls;
