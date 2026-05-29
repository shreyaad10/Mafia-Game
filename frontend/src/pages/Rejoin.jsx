import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import api from '../utils/api';

export default function Rejoin() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { playerName: savedName, saveSession, clearSession, connectToRoom } = useGame();

  const [name, setName] = useState(savedName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomStatus, setRoomStatus] = useState(null); // 'waiting' | 'ended' | null

  // Check current room status
  useEffect(() => {
    if (!roomCode) { navigate('/'); return; }
    checkRoom();
  }, []);

  async function checkRoom() {
    try {
      const { data } = await api.get(`/rooms/${roomCode}`);
      setRoomStatus(data.status);
    } catch {
      setError('Room not found. It may have been deleted.');
    }
  }

  async function handleRejoin(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Enter your name to continue.');
    if (trimmed.length < 2) return setError('Name must be at least 2 characters.');

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/rooms/join', {
        playerName: trimmed,
        roomCode,
      });
      saveSession({
        playerId: data.playerId,
        playerName: trimmed,
        roomCode: data.roomCode,
        isHost: false,
      });
      connectToRoom(data.roomCode, data.playerId);
      navigate(`/lobby/${data.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to rejoin. The host may not have reset the room yet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page page-glow-gold">
      <div className="content animate-fadeUp">

        {/* Back */}
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: 'auto', marginBottom: '2rem' }}
          onClick={() => navigate(`/end/${roomCode}`)}
        >
          ← Back
        </button>

        {/* Logo */}
        <div className="game-logo" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,6vw,3rem)' }}>REJOIN</h1>
          <p className="tagline">Same Room — New Game</p>
        </div>

        <div className="card card-glow-gold animate-scaleIn delay-1">

          {/* Room code display */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', letterSpacing: '0.35em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Rejoining Room
            </p>
            <div className="room-code-display" style={{ cursor: 'default', fontSize: '2rem', letterSpacing: '0.4em' }}>
              {roomCode}
            </div>
          </div>

          {/* Status notice */}
          {roomStatus === 'ended' && (
            <div style={{ background: 'rgba(245,66,66,0.08)', border: '1px solid rgba(245,66,66,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center' }}>
              ⏳ Waiting for the host to reset the room before you can join.
            </div>
          )}
          {roomStatus === 'waiting' && (
            <div style={{ background: 'rgba(66,245,185,0.08)', border: '1px solid rgba(66,245,185,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--teal)', fontStyle: 'italic', textAlign: 'center' }}>
              ✓ Room is open — you can join now!
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleRejoin}>
            <div className="input-group">
              <label className="input-label">Your Name</label>
              <input
                className="input-field"
                type="text"
                placeholder="Enter your name…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              disabled={loading || !name.trim() || roomStatus === 'ended' || roomStatus === null}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <><span className="pulse-dot" /> Joining…</>
              ) : roomStatus === 'ended' ? (
                '⏳ Waiting for Host to Reset…'
              ) : (
                <>🚪 Rejoin Room</>
              )}
            </button>
          </form>

          {roomStatus === 'ended' && (
            <button
              className="btn btn-ghost"
              style={{ marginTop: '0.75rem' }}
              onClick={checkRoom}
            >
              🔄 Check Again
            </button>
          )}
        </div>

        {/* Go home option */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: 'auto', color: 'var(--text-dim)' }}
            onClick={() => { clearSession(); navigate('/'); }}
          >
            Go Home Instead
          </button>
        </div>
      </div>
    </div>
  );
}
