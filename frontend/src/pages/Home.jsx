import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const PARTICLE_COUNT = 18;

export default function Home() {
  const navigate = useNavigate();
  const { clearSession } = useGame();
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

  useEffect(() => { clearSession(); }, []);

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
        <div className="game-logo" style={{ marginBottom: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'floatY 3s ease-in-out infinite' }}>🌙</div>
          <h1>MAFIA</h1>
          <p className="tagline">The Night Begins</p>
        </div>

        {/* Atmospheric text */}
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

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '320px', margin: '0 auto' }}>
          <button
            className="btn btn-gold animate-fadeUp delay-2"
            onClick={() => navigate('/create')}
          >
            <span>⚡</span> Host a Game
          </button>

          <button
            className="btn btn-ghost animate-fadeUp delay-3"
            onClick={() => navigate('/join')}
          >
            <span>🚪</span> Join a Game
          </button>
        </div>

        {/* Footer ornament */}
        <div style={{ marginTop: '3rem', color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '0.4em', fontFamily: 'var(--font-heading)' }}>
          ✦ COMPANION APP ✦
        </div>
      </div>
    </div>
  );
}
