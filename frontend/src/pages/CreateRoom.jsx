import React, { useState } from "react";

const Button = ({ children, onClick, variant, className = '', disabled, ...props }) => {
  const base = "px-6 py-3 rounded-2xl font-semibold text-white shadow-md transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = variant === 'destructive' 
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" 
    : variant === 'success'
    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500";
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
};

const Input = (props) => <input {...props} className={`p-3 w-full border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className}`} />;

const Dialog = ({ open, onOpenChange, children }) => open ? (
  <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4" onClick={() => onOpenChange(false)}>
    <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>{children}</div>
  </div>
) : null;

const DialogContent = ({ children, className }) => <div className={`bg-white rounded-2xl shadow-2xl p-6 ${className}`}>{children}</div>;

const DialogHeader = ({ children }) => <div className="mb-6">{children}</div>;

const DialogTitle = ({ children }) => <h2 className="text-3xl font-extrabold text-gray-800">{children}</h2>;

const DialogDescription = ({ children }) => <p className="text-gray-500 mt-2">{children}</p>;

export default function CreateRoom({ onRoomCreated }) {
  const [open, setOpen] = useState(false);
  const [roomData, setRoomData] = useState({
    name: "",
    numStocks: "15",
    roundTime: "8",
    maxPlayers: "5",
    initialMoney: "500000",
    numRounds: "25"
  });
  const [roomID, setRoomID] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setRoomData({ ...roomData, [field]: value });

  const handleCreate = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const user_id = storedUser.user_id;

    if (!user_id) return setError("Please log in to create a room.");

    for (const key in roomData) if (!roomData[key]) return setError("Please fill all fields!");

    if (parseInt(roomData.numStocks) < 5 || parseInt(roomData.numStocks) > 50) {
      return setError("Number of stocks must be between 5 and 50");
    }

    setError("");
    const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
    let id = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    setLoading(true);

    try {
      const backend_url = "http://localhost:3000";
      const res = await fetch(`${backend_url}/api/game/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...roomData, roomID: id, createdBy: user_id }),
      });

      if (res.ok) setRoomID(id);
      else setError("Failed to create room. Please try again.");
    } catch (err) {
      console.error(err);
      setError("Server error while creating room.");
    } finally { setLoading(false); }
  };

  const handleEnterLobby = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (onRoomCreated) onRoomCreated({ ...roomData, createdBy: storedUser.user_id }, roomID);
    setOpen(false);
    setRoomID("");
    setError("");
    setRoomData({ name: "", numStocks: "15", roundTime: "8", maxPlayers: "5", initialMoney: "500000", numRounds: "25" });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600">Create Game Room</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Game Room</DialogTitle>
            <DialogDescription>Set your room preferences before starting.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label className="font-semibold text-gray-700 text-sm">Room Name</label>
              <Input value={roomData.name} onChange={e => handleChange("name", e.target.value)} placeholder="Enter room name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-700 text-sm">Stocks (5-50)</label>
                <Input type="number" min="5" max="50" value={roomData.numStocks} onChange={e => handleChange("numStocks", e.target.value)} />
              </div>
              <div>
                <label className="font-semibold text-gray-700 text-sm">Rounds (5-100)</label>
                <Input type="number" min="5" max="100" value={roomData.numRounds} onChange={e => handleChange("numRounds", e.target.value)} />
              </div>
              <div>
                <label className="font-semibold text-gray-700 text-sm">Round Time (s)</label>
                <Input type="number" min="5" max="60" value={roomData.roundTime} onChange={e => handleChange("roundTime", e.target.value)} />
              </div>
              <div>
                <label className="font-semibold text-gray-700 text-sm">Max Players</label>
                <Input type="number" min="2" max="10" value={roomData.maxPlayers} onChange={e => handleChange("maxPlayers", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="font-semibold text-gray-700 text-sm">Initial Money</label>
              <Input type="number" min="10000" value={roomData.initialMoney} onChange={e => handleChange("initialMoney", e.target.value)} />
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            {!roomID ? (
              <Button onClick={handleCreate} disabled={loading} className="w-full mt-2">{loading ? "Creating..." : "Create Room"}</Button>
            ) : (
              <div className="flex flex-col gap-3 p-4 bg-gradient-to-r from-green-100 to-green-200 border border-green-300 rounded-2xl text-center mt-2">
                <p className="text-green-800 font-semibold">
                  Room Created! ID: 
                  <span className="block font-bold text-2xl tracking-widest bg-white px-2 py-1 rounded-md mt-1">{roomID}</span>
                </p>
                <Button onClick={handleEnterLobby} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700">Enter Lobby</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
