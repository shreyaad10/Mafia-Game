import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { ROLES } from '../utils/roles';
import api from '../utils/api';

export default function RevealRole() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { playerId, isHost, socket, clearSession, connectToRoom } = useGame();
  const [player, setPlayer] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hostLeftNotice, setHostLeftNotice] = useState(false);

  useEffect(() => {
    if (!playerId) { navigate('/'); return; }
    loadPlayer();
  }, []);

  // Listen for host-left during role reveal
  useEffect(() => {
    if (!socket || !playerId || !roomCode) return;

    connectToRoom(roomCode, playerId);

    socket.on('gameEnded', ({ reason }) => {
      if (reason === 'hostLeft') {
        setHostLeftNotice(true);
        setTimeout(() => { clearSession(); navigate('/'); }, 3500);
      }
    });

    return () => {
      socket.off('gameEnded');
    };
  }, [socket, playerId, roomCode]);

  async function loadPlayer() {
    try {
      const { data } = await api.get(`/player/${playerId}`);
      setPlayer(data);
      if (data.hasRevealedRole) {
        setFlipped(true);
        setRevealed(true);
      }
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleFlip() {
    if (flipped) return;
    setFlipped(true);
    setTimeout(async () => {
      setRevealed(true);
      try { await api.post(`/player/${playerId}/reveal`); } catch {}
    }, 900);
  }

  async function handleContinue() {
    setContinuing(true);
    navigate(`/round/${roomCode}`);
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      await api.post(`/rooms/${roomCode}/leave`, { playerId });
    } catch {}
    finally {
      clearSession();
      navigate('/');
    }
  }

  // ── Host-left notice ──
  if (hostLeftNotice) {
    return (
      <div className="page" style={{ textAlign: 'center' }}>
        <div className="content animate-scaleIn">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👑</div>
          <h2 className="page-title" style={{ color: '#f54242' }}>Host Left the Game</h2>
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
        </div>
      </div>
    );
  }

  const roleInfo = ROLES[player?.role] || ROLES['Villager'];
  const isGod = player?.role === 'God';
  const isMafia = player?.role === 'Mafia';

  return (
    <div
      className={`page ${isGod ? 'page-glow-gold' : isMafia ? 'page-glow-red' : ''}`}
      style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}
    >
      <div className="content animate-fadeUp" style={{ textAlign: 'center' }}>

        {/* ── TOP BAR ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
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
                {isHost ? 'Leaving will end the game.' : 'Leave this room?'}
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
        </div>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: '0.7rem',
            letterSpacing: '0.45em', color: 'var(--text-dim)',
            textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>
            Your Role Awaits
          </p>
          <h2 className="page-title" style={{ marginBottom: 0 }}>{player?.name}</h2>
        </div>

        {/* ── ROLE CARD ── */}
        <div className={`role-card ${flipped ? 'flipped' : ''}`} onClick={!flipped ? handleFlip : undefined}>
          <div className="role-card-inner">

            {/* BACK face */}
            <div className="role-card-face role-card-back">
              <div className="role-card-back-pattern" />
              <div className="role-card-back-content">
                <div className="role-card-back-icon animate-glowPulse">🃏</div>
                <div className="role-card-back-text">Tap to Reveal</div>
              </div>
            </div>

            {/* FRONT face */}
            <div
              className="role-card-face role-card-front"
              style={{
                background: 'linear-gradient(160deg, #16161f 0%, #0d0d14 100%)',
                border: `1px solid ${roleInfo.color}33`,
                boxShadow: `0 0 60px ${roleInfo.glow}, inset 0 0 40px ${roleInfo.glow.replace('0.6', '0.05')}`,
              }}
            >
              {/* Inner border decoration */}
              <div style={{
                position: 'absolute', top: '1rem', left: '1rem', right: '1rem', bottom: '1rem',
                border: `1px solid ${roleInfo.color}1a`,
                borderRadius: 'calc(var(--radius-lg) - 4px)',
                pointerEvents: 'none',
              }} />

              <div style={{
                fontSize: '4.5rem', marginBottom: '1rem',
                filter: `drop-shadow(0 0 20px ${roleInfo.color})`,
                animation: 'floatY 3s ease-in-out infinite',
              }}>
                {roleInfo.icon}
              </div>

              <div style={{
                fontFamily: 'var(--font-heading)', fontSize: '0.6rem',
                letterSpacing: '0.5em', color: roleInfo.color,
                textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.8,
              }}>
                You Are
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.1rem, 4vw, 1.6rem)',
                color: roleInfo.color,
                textShadow: `0 0 20px ${roleInfo.glow}`,
                marginBottom: '1.25rem', lineHeight: 1.2,
              }}>
                {roleInfo.title}
              </h3>

              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                color: 'var(--text-dim)', fontStyle: 'italic',
                lineHeight: 1.6, padding: '0 0.5rem',
              }}>
                {roleInfo.description}
              </p>

              <div style={{
                marginTop: '1.5rem', padding: '0.4rem 1rem',
                background: `${roleInfo.color}15`,
                border: `1px solid ${roleInfo.color}30`,
                borderRadius: '100px',
                fontFamily: 'var(--font-heading)', fontSize: '0.6rem',
                letterSpacing: '0.3em', color: roleInfo.color, textTransform: 'uppercase',
              }}>
                {roleInfo.team === 'mafia' ? '⚡ Mafia Team' : roleInfo.team === 'neutral' ? '👁️ Neutral' : '🏘️ Village Team'}
              </div>
            </div>
          </div>
        </div>

        {/* Pre-flip hint */}
        {!flipped && (
          <p className="animate-fadeIn" style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.95rem', marginTop: '-0.5rem' }}>
            Make sure no one else can see your screen
          </p>
        )}

        {/* Post-flip CTA */}
        {revealed && (
          <div className="animate-fadeUp" style={{ marginTop: '1.5rem' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic' }}>
              Remember your role. Don't reveal it.
            </p>
            <button
              className="btn btn-gold"
              onClick={handleContinue}
              disabled={continuing}
              style={{ maxWidth: '280px', margin: '0 auto' }}
            >
              {continuing ? 'Loading…' : 'Continue to Game →'}
            </button>
          </div>
        )}

        {/* God special note */}
        {revealed && isGod && (
          <div
            className="card animate-fadeUp"
            style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(212,160,23,0.05)', borderColor: 'rgba(212,160,23,0.15)', maxWidth: '360px', margin: '1rem auto 0' }}
          >
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center' }}>
              👁️ As God, you will see all players and roles from the round screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
