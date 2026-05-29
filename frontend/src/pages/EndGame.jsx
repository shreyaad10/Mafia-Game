import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { ROLES } from '../utils/roles';
import api from '../utils/api';

const PARTICLE_COUNT = 24;

export default function EndGame() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { playerId, clearSession } = useGame();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 5 + Math.random() * 8,
      delay: Math.random() * 5,
      drift: (Math.random() - 0.5) * 80,
      size: 2 + Math.random() * 4,
      color: Math.random() > 0.5 ? 'rgba(245,66,66,0.7)' : 'rgba(212,160,23,0.5)',
    }))
  );

  useEffect(() => {
    if (!roomCode) { navigate('/'); return; }
    loadRoom();
  }, []);

  async function loadRoom() {
    try {
      const { data } = await api.get(`/rooms/${roomCode}`);
      setRoomData(data);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  function handlePlayAgain() {
    clearSession();
    navigate('/');
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

  const players = roomData?.players || [];
  const winner = roomData?.winner;
  const isMafiaWin = winner === 'Mafia';

  // Group by role
  const byRole = ['God', 'Doctor', 'Mafia', 'Villager'].map((role) => ({
    role,
    players: players.filter((p) => p.role === role),
  })).filter((r) => r.players.length > 0);

  return (
    <div className={`page ${isMafiaWin ? 'page-glow-red' : 'page-glow-gold'}`}>
      {/* Particles */}
      <div className="particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
            }}
          />
        ))}
      </div>

      <div className="content-wide animate-fadeUp" style={{ textAlign: 'center' }}>
        {/* Winner announcement */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'floatY 2.5s ease-in-out infinite' }}>
            {isMafiaWin ? '🔪' : '🏘️'}
          </div>

          <p style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.7rem',
            letterSpacing: '0.5em',
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}>
            GAME OVER
          </p>

          <h1 className={`winner-glow ${isMafiaWin ? 'winner-mafia' : 'winner-village'}`}>
            {isMafiaWin ? 'MAFIA WINS' : 'VILLAGE WINS'}
          </h1>

          <p style={{
            color: 'var(--text-dim)',
            fontStyle: 'italic',
            marginTop: '1rem',
            fontSize: '1.05rem',
          }}>
            {isMafiaWin
              ? 'The shadows consumed the village. The Mafia claimed victory.'
              : 'Justice was served. The village rooted out the evil among them.'}
          </p>
        </div>

        {/* Role reveal grid */}
        <div className="card card-glow-gold animate-scaleIn delay-2" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <p className="section-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>All Roles Revealed</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {players.map((p) => {
              const role = p.role || 'Villager';
              const ri = ROLES[role];
              return (
                <div
                  key={p._id}
                  className="player-item"
                  style={{
                    borderColor: `${ri.color}25`,
                    background: `${ri.color}06`,
                  }}
                >
                  <span style={{ fontSize: '1.4rem', filter: `drop-shadow(0 0 6px ${ri.color})` }}>{ri.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="player-name" style={{ fontSize: '1rem' }}>{p.name}</span>
                      {p._id === playerId && <span className="player-badge badge-you">You</span>}
                    </div>
                    <span className={`role-tag role-tag-${role.toLowerCase()}`} style={{ marginTop: '0.2rem', display: 'inline-flex' }}>
                      {role}
                    </span>
                  </div>
                  {!p.isAlive && <span style={{ fontSize: '0.9rem' }}>💀</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="card animate-scaleIn delay-3" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            {[
              ['Rounds Played', roomData?.currentRound || 0],
              ['Total Players', players.length],
              ['Casualties', players.filter((p) => !p.isAlive).length],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--text-bright)', marginBottom: '0.25rem' }}>{val}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.6rem', letterSpacing: '0.25em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Play again */}
        <button
          className="btn btn-gold animate-fadeUp delay-4"
          style={{ maxWidth: '280px', margin: '0 auto' }}
          onClick={handlePlayAgain}
        >
          ⚡ Play Again
        </button>
      </div>
    </div>
  );
}
