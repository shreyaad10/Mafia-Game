import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { ROLES } from '../utils/roles';
import api from '../utils/api';

const PARTICLE_COUNT = 24;

export default function EndGame() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { playerId, playerName, isHost, socket, saveSession, clearSession, connectToRoom } = useGame();

  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [rejoining, setRejoining] = useState(false);
  const [error, setError] = useState('');

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

  // Listen for roomReset — non-host players get sent back to lobby
  useEffect(() => {
    if (!socket || !roomCode) return;

    socket.on('roomReset', (room) => {
      // Non-hosts: room was reset, send to join screen with code pre-filled
      if (!isHost) {
        navigate(`/rejoin/${roomCode}`);
      }
    });

    return () => { socket.off('roomReset'); };
  }, [socket, roomCode, isHost]);

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

  // Host: reset same room and go back to lobby
  async function handlePlayAgainSameRoom() {
    if (!playerName) return;
    setResetting(true);
    setError('');
    try {
      const { data } = await api.post(`/rooms/${roomCode}/reset`, {
        playerId,
        playerName,
      });
      saveSession({
        playerId: data.playerId,
        playerName,
        roomCode: data.roomCode,
        isHost: true,
      });
      connectToRoom(data.roomCode, data.playerId);
      navigate(`/lobby/${data.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset room.');
      setResetting(false);
    }
  }

  // Host: create a completely new room
  async function handleNewRoom() {
    clearSession();
    navigate('/create');
  }

  // Non-host: rejoin the same room code (will land on join page pre-filled)
  async function handleRejoinSameRoom() {
    navigate(`/rejoin/${roomCode}`);
  }

  // Anyone: go home
  function handleGoHome() {
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
  const isAbandoned = winner === null || winner === undefined;

  return (
    <div className={`page ${isMafiaWin ? 'page-glow-red' : 'page-glow-gold'}`}>
      {/* Particles */}
      <div className="particles">
        {particles.map((p) => (
          <span key={p.id} className="particle" style={{
            left: `${p.left}%`, width: p.size, height: p.size,
            background: p.color, animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`, '--drift': `${p.drift}px`,
          }} />
        ))}
      </div>

      <div className="content-wide animate-fadeUp" style={{ textAlign: 'center' }}>

        {/* ── WINNER ── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'floatY 2.5s ease-in-out infinite' }}>
            {isAbandoned ? '🏚️' : isMafiaWin ? '🔪' : '🏘️'}
          </div>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', letterSpacing: '0.5em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            GAME OVER
          </p>
          {isAbandoned ? (
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,8vw,3.5rem)', color: 'var(--text-dim)', textShadow: '0 0 20px rgba(120,120,120,0.4)' }}>
              GAME ABANDONED
            </h1>
          ) : (
            <h1 className={`winner-glow ${isMafiaWin ? 'winner-mafia' : 'winner-village'}`}>
              {isMafiaWin ? 'MAFIA WINS' : 'VILLAGE WINS'}
            </h1>
          )}
          <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '1rem', fontSize: '1.05rem' }}>
            {isAbandoned
              ? 'The host left and the game was dissolved.'
              : isMafiaWin
              ? 'The shadows consumed the village. The Mafia claimed victory.'
              : 'Justice was served. The village rooted out the evil among them.'}
          </p>
        </div>

        {/* ── PLAY AGAIN SECTION ── */}
        <div className="card card-glow-gold animate-scaleIn delay-1" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', letterSpacing: '0.4em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            ✦ Play Again ✦
          </p>

          {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

          {isHost ? (
            /* HOST OPTIONS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Same room — primary action */}
              <button
                className="btn btn-gold"
                onClick={handlePlayAgainSameRoom}
                disabled={resetting}
              >
                {resetting ? (
                  <><span className="pulse-dot" /> Resetting Room…</>
                ) : (
                  <>⚡ Play Again — Same Room Code ({roomCode})</>
                )}
              </button>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', margin: '-0.25rem 0 0.25rem' }}>
                Keeps the same code. Players rejoin with <strong style={{ color: 'var(--gold-bright)' }}>{roomCode}</strong> — no sharing needed.
              </p>

              {/* New room — secondary */}
              <button
                className="btn btn-ghost"
                onClick={handleNewRoom}
                disabled={resetting}
              >
                🔀 Start a Brand New Room
              </button>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', margin: '-0.25rem 0 0' }}>
                Generates a fresh room code.
              </p>
            </div>
          ) : (
            /* NON-HOST OPTIONS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-gold"
                onClick={handleRejoinSameRoom}
                disabled={rejoining}
              >
                {rejoining ? (
                  <><span className="pulse-dot" /> Joining…</>
                ) : (
                  <>🚪 Rejoin — Same Room ({roomCode})</>
                )}
              </button>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', margin: '-0.25rem 0 0' }}>
                Wait for the host to reset the room first.
              </p>
            </div>
          )}

          <div className="divider" style={{ margin: '1.25rem 0 1rem' }}>
            <span>or</span>
          </div>

          <button className="btn btn-ghost" onClick={handleGoHome}>
            🏠 Go Home
          </button>
        </div>

        {/* ── ALL ROLES REVEALED ── */}
        <div className="card animate-scaleIn delay-2" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <p className="section-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>All Roles Revealed</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {players.map((p) => {
              const role = p.role || 'Villager';
              const ri = ROLES[role];
              return (
                <div key={p._id} className="player-item" style={{ borderColor: `${ri.color}25`, background: `${ri.color}06` }}>
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

        {/* ── STATS ── */}
        <div className="card animate-scaleIn delay-3" style={{ marginBottom: '1.5rem' }}>
          <div className="stats-grid">
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

        {/* ── TEAM BREAKDOWN ── */}
        <div className="card animate-scaleIn delay-4" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <p className="section-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Team Breakdown</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { team: 'Village', icon: '🏘️', color: 'var(--teal)', roles: ['Doctor', 'Villager'], borderColor: 'rgba(66,245,185,0.2)' },
              { team: 'Mafia',   icon: '🔪', color: '#f54242',      roles: ['Mafia'],             borderColor: 'rgba(245,66,66,0.2)' },
              { team: 'Neutral', icon: '👁️', color: 'var(--gold-bright)', roles: ['God'],        borderColor: 'rgba(212,160,23,0.2)' },
            ].map(({ team, icon, color, roles, borderColor }) => {
              const count = players.filter((p) => roles.includes(p.role)).length;
              const alive = players.filter((p) => roles.includes(p.role) && p.isAlive).length;
              return (
                <div key={team} style={{ flex: '1 1 120px', textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{icon}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.65rem', letterSpacing: '0.2em', color, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{team}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-bright)' }}>
                    {alive}<span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>/{count}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>alive</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
