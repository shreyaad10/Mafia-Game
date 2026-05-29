import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import api from '../utils/api';

const PARTICLE_COUNT = 18;

export default function Home() {
  const navigate = useNavigate();
  const { playerId, playerName, roomCode, isHost, clearSession } = useGame();
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 6 + Math.random() * 10,
      delay: Math.random() * 8,
      drift: (Math.random() - 0.5) * 60,
      size: 2 + Math.random() * 3,
    }))
  );

  // Active session state
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [leavingRoom, setLeavingRoom] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  // Check if saved session is still valid
  useEffect(() => {
    if (playerId && roomCode) {
      checkSession();
    }
  }, []);

  async function checkSession() {
    setSessionLoading(true);
    try {
      const { data: room } = await api.get(`/rooms/${roomCode}`);
      const player = room.players.find((p) => p._id === playerId);
      if (player && room.status !== 'ended') {
        setActiveSession({ room, player });
      } else {
        // Session is stale — clear it
        clearSession();
      }
    } catch {
      clearSession();
    } finally {
      setSessionLoading(false);
    }
  }

  function handleContinue() {
    if (!activeSession) return;
    const { room } = activeSession;
    if (room.status === 'waiting') {
      navigate(`/lobby/${roomCode}`);
    } else if (room.status === 'in_progress') {
      if (activeSession.player.hasRevealedRole) {
        navigate(`/round/${roomCode}`);
      } else {
        navigate(`/reveal/${roomCode}`);
      }
    }
  }

  async function handleLeave() {
    setLeavingRoom(true);
    try {
      await api.post(`/rooms/${roomCode}/leave`, { playerId });
    } catch {
      // Even if it fails, clear local session
    } finally {
      clearSession();
      setActiveSession(null);
      setLeaveConfirm(false);
      setLeavingRoom(false);
    }
  }

  return (
    <div className="page page-glow-red" style={{ justifyContent: 'center' }}>
      {/* Floating particles */}
      <div className="particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
            }}
          />
        ))}
      </div>

      <div className="content animate-fadeUp" style={{ textAlign: 'center' }}>
        {/* Logo */}
        <div className="game-logo" style={{ marginBottom: activeSession ? '1.5rem' : '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'floatY 3s ease-in-out infinite' }}>🌙</div>
          <h1>MAFIA</h1>
          <p className="tagline">The Night Begins</p>
        </div>

        {/* ── ACTIVE SESSION CARD ── */}
        {sessionLoading && (
          <div className="card animate-scaleIn" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <div className="waiting-pulse">
              <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
              <span style={{ marginLeft: '0.5rem' }}>Checking your session…</span>
            </div>
          </div>
        )}

        {activeSession && !sessionLoading && (
          <div
            className="card card-glow-gold animate-scaleIn"
            style={{ marginBottom: '1.5rem', textAlign: 'left' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(212,160,23,0.3), rgba(212,160,23,0.1))',
                border: '1px solid rgba(212,160,23,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>
                🎭
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.6rem', letterSpacing: '0.35em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Active Session
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--gold-bright)', fontSize: '0.95rem' }}>
                  Room {roomCode}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.2em',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '100px',
                  textTransform: 'uppercase',
                  background: activeSession.room.status === 'in_progress'
                    ? 'rgba(245,66,66,0.12)' : 'rgba(66,245,185,0.1)',
                  color: activeSession.room.status === 'in_progress' ? '#f54242' : 'var(--teal)',
                  border: `1px solid ${activeSession.room.status === 'in_progress' ? 'rgba(245,66,66,0.25)' : 'rgba(66,245,185,0.2)'}`,
                }}>
                  {activeSession.room.status === 'in_progress' ? '🔴 Live' : '⏳ Lobby'}
                </span>
              </div>
            </div>

            {/* Session info */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                ['Player', activeSession.player.name],
                ['Role', isHost ? '👑 Host' : 'Player'],
                ['Players', activeSession.room.players.length],
              ].map(([label, val]) => (
                <div key={label} style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.55rem', letterSpacing: '0.25em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--text-bright)' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            {!leaveConfirm ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-gold"
                  style={{ flex: 2 }}
                  onClick={handleContinue}
                >
                  ▶ Continue Room
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, borderColor: 'rgba(245,66,66,0.3)', color: '#f54242' }}
                  onClick={() => setLeaveConfirm(true)}
                >
                  Leave
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  color: 'var(--text-dim)',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}>
                  {isHost
                    ? 'You are the host. Leaving will transfer host to the next player, or delete the room if empty.'
                    : 'Are you sure you want to leave this room?'}
                </p>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    className="btn btn-red"
                    style={{ flex: 1 }}
                    onClick={handleLeave}
                    disabled={leavingRoom}
                  >
                    {leavingRoom ? 'Leaving…' : '✓ Yes, Leave'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1 }}
                    onClick={() => setLeaveConfirm(false)}
                    disabled={leavingRoom}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DIVIDER if session exists ── */}
        {activeSession && !sessionLoading && (
          <div className="divider" style={{ marginBottom: '1.5rem' }}>
            <span>or start fresh</span>
          </div>
        )}

        {/* Atmospheric text — hide when session card is shown */}
        {!activeSession && !sessionLoading && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            color: 'var(--text-dim)',
            fontSize: '1.05rem',
            maxWidth: '340px',
            margin: '0 auto 3rem',
            lineHeight: '1.7',
          }}>
            A village. A secret. A deadly game of trust and deception.
            Who among you wears the mask of the Mafia?
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '320px', margin: '0 auto' }}>
          <button
            className="btn btn-gold animate-fadeUp delay-2"
            onClick={() => { clearSession(); navigate('/create'); }}
          >
            <span>⚡</span> Host a Game
          </button>

          <button
            className="btn btn-ghost animate-fadeUp delay-3"
            onClick={() => { clearSession(); navigate('/join'); }}
          >
            <span>🚪</span> Join a Game
          </button>
        </div>

        {/* Footer ornament */}
        <div style={{ marginTop: '3rem', color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '0.4em', fontFamily: 'var(--font-heading)' }}>
          ✦ Designed and Developed by Shreya Desai ✦
        </div>
      </div>
    </div>
  );
}
