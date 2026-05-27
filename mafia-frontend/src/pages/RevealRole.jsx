// src/pages/RevealRole.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

export default function RevealRole() {
  const { roomCode, playerId } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await axios.get(`${API}/player/${playerId}`);
        if (res.data?.success) {
          setRole(res.data.role);
        }
      } catch (err) {
        console.log("Error getting role:", err);
      }
      setLoading(false);
    };

    fetchRole();
  }, [playerId]);

  const goToNext = () => {
    navigate(`/round/${roomCode}/${playerId}`);
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.loading}>Revealing your role…</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Your Role</h1>

        <p style={styles.roleText}>
          {role === "mafia" && "🔪 Mafia"}
          {role === "villager" && "👨‍🌾 Villager"}
          {role === "doctor" && "⚕️ Doctor"}
        </p>

        <p style={styles.description}>
          {role === "mafia" && "You eliminate one player each night. Stay hidden."}
          {role === "villager" && "Find the mafia and survive. Trust no one."}
          {role === "doctor" && "Choose one person to save each night."}
        </p>

        <button style={styles.button} onClick={goToNext}>
          Continue →
        </button>
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
    width: "90%",
    maxWidth: "450px",
    background: "#0d0d0d",
    padding: "35px",
    borderRadius: "20px",
    border: "1px solid #ff4c7b33",
    boxShadow: "0 0 40px #ff4c7b22",
    textAlign: "center",
  },

  title: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "20px",
  },

  roleText: {
    fontSize: "40px",
    color: "#ff4c7b",
    marginBottom: "10px",
    fontWeight: "bold",
  },

  description: {
    color: "#bbb",
    fontSize: "14px",
    marginBottom: "30px",
  },

  button: {
    width: "100%",
    padding: "12px",
    background: "#ff4c7b",
    color: "#000",
    fontWeight: "bold",
    fontSize: "16px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
  },

  loading: {
    color: "#fff",
    fontSize: "20px",
  },
};
