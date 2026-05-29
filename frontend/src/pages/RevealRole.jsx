import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { ROLES } from '../utils/roles';
import api from '../utils/api';

export default function RevealRole() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { playerId, isHost } = useGame();
  const [player, setPlayer] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    if (!playerId) { navigate('/'); return; }
    loadPlayer();
  }, []);

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

    // Small delay before marking revealed
    setTimeout(async () => {
      setRevealed(true);
      try {
        await api.post(`/player/${playerId}/reveal`);
      } catch {}
    }, 900);
  }

  async function handleContinue() {
    setContinuing(true);
    navigate(`/round/${roomCode}`);
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
      style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
    >
      <div className="content animate-fadeUp" style={{ textAlign: 'center' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.7rem',
            letterSpacing: '0.45em',
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>Your Role Awaits</p>
          <h2 className="page-title" style={{ marginBottom: 0 }}>{player?.name}</h2>
        </div>

        {/* Role Card */}
        <div className={`role-card ${flipped ? 'flipped' : ''}`} onClick={!flipped ? handleFlip : undefined}>
          <div className="role-card-inner">
            {/* BACK */}
            <div className="role-card-face role-card-back">
              <div className="role-card-back-pattern" />
              <div className="role-card-back-content">
                <div className="role-card-back-icon animate-glowPulse">🃏</div>
                <div className="role-card-back-text">Tap to Reveal</div>
              </div>
            </div>

            {/* FRONT */}
            <div
              className="role-card-face role-card-front"
              style={{
                background: `linear-gradient(160deg, #16161f 0%, #0d0d14 100%)`,
                border: `1px solid ${roleInfo.color}33`,
                boxShadow: `0 0 60px ${roleInfo.glow}, inset 0 0 40px ${roleInfo.glow.replace('0.6', '0.05')}`,
              }}
            >
              {/* Decorative corner */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                right: '1rem',
                bottom: '1rem',
                border: `1px solid ${roleInfo.color}1a`,
                borderRadius: 'calc(var(--radius-lg) - 4px)',
                pointerEvents: 'none',
              }} />

              <div style={{
                fontSize: '4.5rem',
                marginBottom: '1rem',
                filter: `drop-shadow(0 0 20px ${roleInfo.color})`,
                animation: 'floatY 3s ease-in-out infinite',
              }}>
                {roleInfo.icon}
              </div>

              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.6rem',
                letterSpacing: '0.5em',
                color: roleInfo.color,
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                opacity: 0.8,
              }}>
                You Are
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.1rem, 4vw, 1.6rem)',
                color: roleInfo.color,
                textShadow: `0 0 20px ${roleInfo.glow}`,
                marginBottom: '1.25rem',
                lineHeight: 1.2,
              }}>
                {roleInfo.title}
              </h3>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                color: 'var(--text-dim)',
                fontStyle: 'italic',
                lineHeight: 1.6,
                padding: '0 0.5rem',
              }}>
                {roleInfo.description}
              </p>

              {/* Team indicator */}
              <div style={{
                marginTop: '1.5rem',
                padding: '0.4rem 1rem',
                background: `${roleInfo.color}15`,
                border: `1px solid ${roleInfo.color}30`,
                borderRadius: '100px',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.6rem',
                letterSpacing: '0.3em',
                color: roleInfo.color,
                textTransform: 'uppercase',
              }}>
                {roleInfo.team === 'mafia' ? '⚡ Mafia Team' : roleInfo.team === 'neutral' ? '👁️ Neutral' : '🏘️ Village Team'}
              </div>
            </div>
          </div>
        </div>

        {/* Hint before reveal */}
        {!flipped && (
          <p className="animate-fadeIn" style={{
            color: 'var(--text-dim)',
            fontStyle: 'italic',
            fontSize: '0.95rem',
            marginTop: '-0.5rem',
          }}>
            Make sure no one else can see your screen
          </p>
        )}

        {/* Continue button after reveal */}
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
          <div className="card" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(212,160,23,0.05)', borderColor: 'rgba(212,160,23,0.15)', maxWidth: '360px', margin: '1rem auto 0' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center' }}>
              👁️ As God, you will see all players and can manage the game from the round screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
