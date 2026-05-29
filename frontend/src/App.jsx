import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Lobby from './pages/Lobby';
import RevealRole from './pages/RevealRole';
import Round from './pages/Round';
import EndGame from './pages/EndGame';
import Rejoin from './pages/Rejoin';

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateRoom />} />
          <Route path="/join" element={<JoinRoom />} />
          <Route path="/lobby/:roomCode" element={<Lobby />} />
          <Route path="/reveal/:roomCode" element={<RevealRole />} />
          <Route path="/round/:roomCode" element={<Round />} />
          <Route path="/end/:roomCode" element={<EndGame />} />
          <Route path="/rejoin/:roomCode" element={<Rejoin />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}
