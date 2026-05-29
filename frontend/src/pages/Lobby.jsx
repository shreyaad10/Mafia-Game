import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import api from '../utils/api';

export default function Lobby() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { playerId, isHost, socket, setRoom, clearSession, connectToRoom } = useGame();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hostLeftNotice, setHostLeftNotice] = useState(false);

  const fetchRoom = useCallback(async () => {
    try {
      const { data } = await api.get(`/rooms/${roomCode}`);
      setRoomData(data);
      setRoom(data);
    } catch {
      setError('Room not found or expired.');
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!playerId || !roomCode) { navigate('/'); return; }
    fetchRoom();
  }, []);

  // Socket setup
  useEffect(() => {
    if (!socket || !playerId || !roomCode) return;

    connectToRoom(roomCode, playerId);

    socket.on('roomUpdate', (data) => {
      setRoomData(data);
      setRoom(data);
    });

    socket.on('roundStarted', ({ room }) => {
      setRoom(room);
      navigate(`/reveal/${roomCode}`);
    });

    socket.on('roomReset', (data) => {
      // Fresh room state pushed after host resets — update player list
      setRoomData(data);
      setRoom(data);
    });

    socket.on('gameEnded', ({ reason }) => {
      if (reason === 'hostLeft') {
        setHostLeftNotice(true);
        setTimeout(() => { clearSession(); navigate('/'); }, 3500);
      }
    });

    return () => {
      socket.off('roomUpdate');
      socket.off('roundStarted');
      socket.off('roomReset');
      socket.off('gameEnded');
    };
  }, [socket, playerId, roomCode]);

  // Status redirects
  useEffect(() => {
    if (roomData?.status === 'in_progress') navigate(`/reveal/${roomCode}`);
    if (roomData?.status === 'ended') navigate(`/end/${roomCode}`);
  }, [roomData?.status]);

  async function handleStartGame() {
    if (roomData?.players?.length < 4) {
      setError('Need at least 4 players to start the game.');
      return;
    }
    setStarting(true);
    setError('');
    try {
      await api.post(`/rooms/${roomCode}/start`, { playerId });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start game.');
      setStarting(false);
    }
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      await api.post(`/rooms/${roomCode}/leave`, { playerId });
    } catch {
      // Still clear locally
    } finally {
      clearSession();
      navigate('/');
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── Host-left notice overlay ──
  if (hostLeftNotice) {
    return (
      <div className="page" style={{ textAlign: 'center' }}>
        <div className="content animate-scaleIn">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👑</div>
          <h2 className="page-title" style={{ color: '#f54242' }}>Host Left the Room</h2>
          <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '0.5rem' }}>
            The game has been dissolved. Returning to home…
          </p>
          <div className="waiting-pulse" style={{ marginTop: '1.5rem' }}>
            <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="waiting-pulse">
          <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
          <span style={{ marginLeft: '0.5rem' }}>Loading room…</span>
        </div>
      </div>
    );
  }

  if (error && !roomData) {
    return (
      <div className="page">
        <div className="content" style={{ textAlign: 'center' }}>
          <div className="error-msg" style={{ marginBottom: '1.5rem' }}>{error}</div>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back to Home</button>
        </div>
      </div>
    );
  }

  const players = roomData?.players || [];

  return (
    <div className="page page-glow-gold">
      <div className="content-wide animate-fadeUp">

        {/* ── TOP BAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          {/* Leave button */}
          {!leaveConfirm ? (
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: 'auto', borderColor: 'rgba(245,66,66,0.3)', color: '#f54242' }}
              onClick={() => setLeaveConfirm(true)}
            >
              🚪 Leave Room
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,66,66,0.08)', border: '1px solid rgba(245,66,66,0.2)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>
                {isHost ? 'Host transfer / room dissolve?' : 'Leave this room?'}
              </span>
              <button
                className="btn btn-red btn-sm"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.65rem' }}
                onClick={handleLeave}
                disabled={leaving}
              >
                {leaving ? '…' : 'Yes, Leave'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.65rem' }}
                onClick={() => setLeaveConfirm(false)}
                disabled={leaving}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Player count pill */}
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.75rem',
            color: 'var(--gold-bright)',
            background: 'rgba(212,160,23,0.1)',
            padding: '0.25rem 0.75rem',
            borderRadius: '100px',
            border: '1px solid rgba(212,160,23,0.2)',
          }}>
            {players.length} / ∞ players
          </span>
        </div>

        {/* ── ROOM CODE ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="game-logo" style={{ marginBottom: '1rem' }}>
            <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)' }}>LOBBY</h1>
            <p className="tagline">Waiting for players</p>
          </div>
          <div
            className="room-code-display animate-scaleIn delay-1"
            onClick={copyCode}
            title="Click to copy"
          >
            {roomCode}
          </div>
          <div className="copy-feedback" style={{ opacity: copied ? 1 : 0 }}>
            ✓ Copied to clipboard
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.4rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.2em' }}>
            SHARE THIS CODE WITH PLAYERS
          </p>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1.25rem' }}>

          {/* Player list */}
          <div className="card animate-scaleIn delay-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <p className="section-title" style={{ margin: 0 }}>Players</p>
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: '0.8rem',
                color: 'var(--gold-bright)', background: 'rgba(212,160,23,0.1)',
                padding: '0.2rem 0.6rem', borderRadius: '100px',
                border: '1px solid rgba(212,160,23,0.2)',
              }}>
                {players.length} joined
              </span>
            </div>
            <div className="player-list">
              {players.map((p) => (
                <div key={p._id} className={`player-item ${p.isHost ? 'is-host' : ''}`}>
                  <div className="player-avatar">{p.name.charAt(0)}</div>
                  <span className="player-name">{p.name}</span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {p.isHost && <span className="player-badge badge-host">👑 Host</span>}
                    {p._id === playerId && <span className="player-badge badge-you">You</span>}
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No players yet</p>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Game info */}
            <div className="card animate-scaleIn delay-3">
              <p className="section-title">Game Info</p>
              {[
                ['Players', players.length],
                ['Min Required', 4],
                ['Status', 'Waiting'],
              ].map(([label, val]) => (
                <div key={label} className="stat-row">
                  <span className="stat-label">{label}</span>
                  <span className="stat-value">{val}</span>
                </div>
              ))}
            </div>

            {/* Roles at glance */}
            <div className="card animate-scaleIn delay-4">
              <p className="section-title">Roles at Glance</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {getRolePreview(players.length).map((r) => (
                  <div key={r.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>{r.role}</span>
                    <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem' }}>×{r.count}</span>
                  </div>
                ))}
              </div>
              {players.length < 4 && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--blood-red)', fontStyle: 'italic' }}>
                  Need {4 - players.length} more player{4 - players.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Action */}
            {error && <div className="error-msg">{error}</div>}

            {isHost ? (
              <button
                className="btn btn-gold animate-fadeUp delay-5"
                onClick={handleStartGame}
                disabled={starting || players.length < 4}
              >
                {starting
                  ? <><span className="pulse-dot" /> Starting…</>
                  : <>⚡ Start Game</>}
              </button>
            ) : (
              <div className="card animate-scaleIn delay-5" style={{ padding: '1.25rem' }}>
                <div className="waiting-pulse">
                  <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem' }}>Waiting for host…</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getRolePreview(count) {
  if (count < 2) return [{ role: '👁️ God', count: 1 }];
  const mafia = count >= 12 ? 3 : count >= 8 ? 2 : 1;
  const villagers = Math.max(0, count - 2 - mafia);
  return [
    { role: '👁️ God', count: 1 },
    { role: '💉 Doctor', count: 1 },
    { role: '🔪 Mafia', count: mafia },
    ...(villagers > 0 ? [{ role: '🏘️ Villager', count: villagers }] : []),
  ];
}
