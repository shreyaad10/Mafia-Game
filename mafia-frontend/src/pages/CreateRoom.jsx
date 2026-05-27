import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

export default function CreateRoom() {
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!playerName.trim()) return alert("enter name");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/rooms/create`, { playerName });
      if (res.data && res.data.success) {
        const { roomCode, playerId } = res.data;
        // Save name locally
        localStorage.setItem("playerName", playerName);
        // Navigate using URL parameters, not query strings
        navigate(`/lobby/${encodeURIComponent(roomCode)}/${encodeURIComponent(playerId)}`);
      } else {
        alert("Error creating room: " + (res.data?.message || ""));
      }
    } catch (err) {
      console.error(err);
      alert("Network error creating room");
    }
    setLoading(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh"}}>
      <h1>Create room</h1>
      <input value={playerName} onChange={e=>setPlayerName(e.target.value)} placeholder="your name" />
      <button onClick={handleCreate} disabled={loading}>{loading? "Creating...":"Create"}</button>
    </div>
  );
}
