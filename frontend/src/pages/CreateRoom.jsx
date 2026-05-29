import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import api from '../utils/api';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { saveSession } = useGame();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Enter your name to continue.');
    if (trimmed.length < 2) return setError('Name must be at least 2 characters.');

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/rooms/create', { playerName: trimmed });
      saveSession({
        playerId: data.playerId,
        playerName: trimmed,
        roomCode: data.roomCode,
        isHost: true,
      });
      navigate(`/lobby/${data.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room. Try again.');
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
          onClick={() => navigate('/')}
        >
          ← Back
        </button>

        <div className="game-logo" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,6vw,3rem)' }}>HOST</h1>
          <p className="tagline">Create a New Room</p>
        </div>

        <div className="card card-glow-gold animate-scaleIn delay-1">

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleCreate}>
            <div className="input-group">
              <label className="input-label">Your Name</label>
              <input
                className="input-field"
                type="text"
                placeholder="Enter your name..."
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
              disabled={loading || !name.trim()}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <span className="pulse-dot" />
                  Creating Room…
                </>
              ) : (
                <>⚡ Create Room</>
              )}
            </button>
          </form>
        </div>

        {/* Info card */}
        <div className="card animate-fadeUp delay-3" style={{ marginTop: '1rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              ['⚡', 'A unique room code will be generated'],
              ['👑', 'Only you can start and manage the game'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
