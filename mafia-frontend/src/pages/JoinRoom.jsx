import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API = "http://localhost:5000"; // backend URL

export default function JoinRoom() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!name || !roomCode) {
      alert("Enter name and room code!");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API}/rooms/join`, {
        playerName: name,
        roomCode: roomCode.toUpperCase(),
      });

      if (res.data && res.data.success) {
        const { playerId } = res.data;
        // Save name locally
        localStorage.setItem("playerName", name);
        // Navigate using URL parameters, not query strings
        navigate(`/lobby/${encodeURIComponent(roomCode.toUpperCase())}/${encodeURIComponent(playerId)}`);
      } else {
        alert(res.data?.message || "Error joining room");
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Error joining room. Check the code and try again!";
      alert(errorMsg);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        background: "#000",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ fontSize: "38px", marginBottom: "20px" }}
      >
        Join Room
      </motion.h1>

      <motion.input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          padding: "12px",
          width: "280px",
          marginBottom: "15px",
          borderRadius: "8px",
          border: "none",
        }}
      />

      <motion.input
        type="text"
        placeholder="Room Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          padding: "12px",
          width: "280px",
          marginBottom: "20px",
          borderRadius: "8px",
          border: "none",
        }}
      />

      <motion.button
        onClick={handleJoin}
        disabled={loading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: "12px 20px",
          backgroundColor: "#ff4d6d",
          border: "none",
          color: "white",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        {loading ? "Joining..." : "Join Room"}
      </motion.button>
    </div>
  );
}
