import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [playerId, setPlayerId]     = useState(() => localStorage.getItem('mafiaPlayerId') || null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('mafiaPlayerName') || '');
  const [roomCode, setRoomCode]     = useState(() => localStorage.getItem('mafiaRoomCode') || null);
  const [isHost, setIsHost]         = useState(() => localStorage.getItem('mafiaIsHost') === 'true');
  const [room, setRoom]             = useState(null);
  const socketRef = useRef(null);

  // Create socket once on mount
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
    socketRef.current = io(backendUrl, {
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  function saveSession({ playerId: pid, playerName: pname, roomCode: code, isHost: host }) {
    if (pid)              { setPlayerId(pid);       localStorage.setItem('mafiaPlayerId',   pid); }
    if (pname)            { setPlayerName(pname);   localStorage.setItem('mafiaPlayerName', pname); }
    if (code)             { setRoomCode(code);      localStorage.setItem('mafiaRoomCode',   code); }
    if (host !== undefined) { setIsHost(host);      localStorage.setItem('mafiaIsHost',     String(host)); }
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
    // Disconnect socket on full session clear
    socketRef.current?.disconnect();
  }

  // Convenience: connect + join room in one call
  const connectToRoom = useCallback((code, pid) => {
    if (!socketRef.current) return;
    if (!socketRef.current.connected) socketRef.current.connect();
    socketRef.current.emit('joinRoom', { roomCode: code, playerId: pid });
  }, []);

  return (
    <GameContext.Provider value={{
      playerId,
      playerName,
      roomCode,
      isHost,
      room,
      setRoom,
      saveSession,
      clearSession,
      connectToRoom,
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
