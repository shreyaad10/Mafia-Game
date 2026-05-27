import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

const API = "http://localhost:5000";
const socket = io("http://localhost:5000");

export default function Lobby() {
  const { roomCode, playerId } = useParams();
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const navigate = useNavigate();

  const localName = localStorage.getItem("playerName") || "You";

  // ---------------- FETCH ROOM DATA ----------------
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`${API}/rooms/${roomCode}`);

        if (res.data?.room?.players) {
          const list = res.data.room.players;
          const hostId = res.data.room.hostId; // ⭐ host stored in DB

          const formatted = list.map((p) => ({
            id: p._id,
            name: p.name,
            isHost: p._id === hostId,
          }));

          setPlayers(formatted);
          setIsHost(playerId === hostId);
        }
      } catch (err) {
        console.log("fetch room error:", err.message);
      }
    };

    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [roomCode, playerId]);

  // ---------------- SOCKET LISTENER ----------------
  useEffect(() => {
    socket.on("roundStarted", () => {
      navigate(`/reveal/${roomCode}/${playerId}`);
    });

    return () => socket.off("roundStarted");
  }, [navigate, roomCode, playerId]);

  // ---------------- START GAME (HOST ONLY) ----------------
  const startGame = async () => {
    if (!isHost) return;

    await axios.post(`${API}/rooms/${roomCode}/start`); 
    // NEW: No roleConfig needed — backend auto assigns
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Game Lobby</h1>

        {/* ROOM CODE */}
        <div style={styles.roomBox}>
          <p style={styles.roomLabel}>ROOM CODE</p>
          <p style={styles.roomCode}>{roomCode}</p>
        </div>

        {/* SELF INFO */}
        <div style={styles.selfInfoRow}>
          <div style={styles.selfBox}>
            <p style={styles.infoLabel}>Your Name</p>
            <p style={styles.infoValue}>{localName}</p>
          </div>
          <div style={styles.selfBox}>
            <p style={styles.infoLabel}>Your Status</p>
            <p style={styles.infoValue}>{isHost ? "👑 Host" : "🎮 Player"}</p>
          </div>
        </div>

        {/* PLAYERS LIST */}
        <h2 style={styles.playersTitle}>Players ({players.length})</h2>

        <div style={styles.playersList}>
          {players.map((p) => (
            <div key={p.id} style={styles.playerItem}>
              <span style={styles.playerIcon}>{p.isHost ? "👑" : "🎮"}</span>
              <div style={styles.playerTextBox}>
                <p style={styles.playerName}>
                  {p.name} {p.id === playerId ? "(You)" : ""}
                </p>
                <p style={styles.playerRole}>
                  {p.isHost ? "Host 👑" : "Player 🎮"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* START GAME BUTTON → HOST ONLY */}
        {isHost ? (
          <button style={styles.startButton} onClick={startGame}>
            🚀 Start Game
          </button>
        ) : (
          <p style={styles.waitText}>
            ⏳ Waiting for host to start the game…
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle, #111, #000)",
    padding: "20px",
  },

  card: {
    width: "95%",
    maxWidth: "550px",
    background: "#0d0d0d",
    padding: "30px",
    borderRadius: "18px",
    border: "1px solid #ff4c7b33",
    boxShadow: "0 0 35px #ff4c7b22",
  },

  heading: {
    textAlign: "center",
    color: "#fff",
    marginBottom: "25px",
  },

  roomBox: {
    textAlign: "center",
    marginBottom: "20px",
  },

  roomLabel: {
    color: "#bbb",
    fontSize: "12px",
  },

  roomCode: {
    color: "#ff4c7b",
    fontSize: "32px",
    fontWeight: "bold",
    letterSpacing: "3px",
  },

  selfInfoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginBottom: "20px",
  },

  selfBox: {
    background: "#151515",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #333",
  },

  infoLabel: {
    color: "#888",
    fontSize: "11px",
  },

  infoValue: {
    color: "#fff",
    fontSize: "15px",
    fontWeight: "bold",
  },

  playersTitle: {
    color: "#fff",
    fontSize: "18px",
    marginBottom: "10px",
  },

  playersList: {
    background: "#141414",
    borderRadius: "10px",
    border: "1px solid #222",
    marginBottom: "20px",
    overflow: "hidden",
  },

  playerItem: {
    display: "flex",
    gap: "12px",
    padding: "12px 15px",
    borderBottom: "1px solid #222",
  },

  playerIcon: {
    fontSize: "22px",
  },

  playerTextBox: {
    flex: 1,
  },

  playerName: {
    color: "#fff",
    marginBottom: "3px",
    fontWeight: "bold",
  },

  playerRole: {
    color: "#888",
    fontSize: "12px",
  },

  startButton: {
    width: "100%",
    padding: "12px",
    background: "#ff4c7b",
    border: "none",
    borderRadius: "10px",
    color: "#000",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  waitText: {
    textAlign: "center",
    color: "#888",
  },
};
