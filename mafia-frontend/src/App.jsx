import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Lobby from "./pages/Lobby";
import RevealRole from "./pages/RevealRole";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* HOME PAGE */}
        <Route path="/" element={<Home />} />

        {/* CREATE & JOIN */}
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />

        {/* LOBBY */}
        <Route path="/lobby/:roomCode/:playerId" element={<Lobby />} />

        {/* REVEAL ROLE PAGE */}
        <Route path="/reveal/:roomCode/:playerId" element={<RevealRole />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
