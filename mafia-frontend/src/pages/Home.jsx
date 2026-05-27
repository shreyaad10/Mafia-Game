import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="home"
      style={{ textAlign: "center", marginTop: "80px" }}
    >
      <h1 style={{ fontSize: "40px", color: "#e94560" }}>Mafia Game</h1>
      
      <p style={{ marginTop: "10px", fontSize: "18px" }}>
        Create or join a game to discover your secret role 👀
      </p>

      <div style={{ marginTop: "40px" }}>
        <Link to="/create">
          <button className="btn">Create Room</button>
        </Link>

        <Link to="/join">
          <button className="btn" style={{ marginLeft: "20px" }}>
            Join Room
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
