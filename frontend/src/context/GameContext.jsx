import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('mafiaPlayerId') || null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('mafiaPlayerName') || '');
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('mafiaRoomCode') || null);
  const [isHost, setIsHost] = useState(() => localStorage.getItem('mafiaIsHost') === 'true');
  const [room, setRoom] = useState(null);
  const socketRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL || window.location.origin, {
      autoConnect: false,
      withCredentials: true,
    });
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  function saveSession(data) {
    const { playerId: pid, playerName: pname, roomCode: code, isHost: host } = data;
    if (pid) { setPlayerId(pid); localStorage.setItem('mafiaPlayerId', pid); }
    if (pname) { setPlayerName(pname); localStorage.setItem('mafiaPlayerName', pname); }
    if (code) { setRoomCode(code); localStorage.setItem('mafiaRoomCode', code); }
    if (host !== undefined) { setIsHost(host); localStorage.setItem('mafiaIsHost', host); }
  }

  function clearSession() {
    setPlayerId(null);
    setPlayerName('');
    setRoomCode(null);
    setIsHost(false);
    setRoom(null);
    localStorage.removeItem('mafiaPlayerId');
    localStorage.removeItem('mafiaPlayerName');
    localStorage.removeItem('mafiaRoomCode');
    localStorage.removeItem('mafiaIsHost');
  }

  return (
    <GameContext.Provider value={{
      playerId, playerName, roomCode, isHost, room,
      setRoom, saveSession, clearSession,
      socket: socketRef.current,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
