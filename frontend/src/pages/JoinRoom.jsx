import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import api from '../utils/api';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { saveSession } = useGame();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName) return setError('Enter your name to continue.');
    if (trimmedName.length < 2) return setError('Name must be at least 2 characters.');
    if (!trimmedCode || trimmedCode.length !== 6) return setError('Enter a valid 6-character room code.');

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/rooms/join', {
        playerName: trimmedName,
        roomCode: trimmedCode,
      });
      saveSession({
        playerId: data.playerId,
        playerName: trimmedName,
        roomCode: data.roomCode,
        isHost: false,
      });
      navigate(`/lobby/${data.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page page-glow-red">
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
          <h1 style={{ fontSize: 'clamp(1.8rem,6vw,3rem)' }}>JOIN</h1>
          <p className="tagline">Enter an Existing Room</p>
        </div>

        <div className="card card-glow-red animate-scaleIn delay-1">
          <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>
            Ask the host for their <strong style={{ color: 'var(--gold-bright)' }}>room code</strong> and enter below.
          </p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleJoin}>
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

            <div className="input-group">
              <label className="input-label">Room Code</label>
              <input
                className="input-field code-field"
                type="text"
                placeholder="XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                maxLength={6}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-red"
              disabled={loading || !name.trim() || code.length !== 6}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <span className="pulse-dot" />
                  Joining Room…
                </>
              ) : (
                <>🚪 Join Room</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
