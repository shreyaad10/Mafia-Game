import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { ROLES } from '../utils/roles';
import api from '../utils/api';

export default function Round() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { playerId, isHost, socket, setRoom, clearSession, connectToRoom } = useGame();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [endingGame, setEndingGame] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [winner, setWinner] = useState('Villagers');
  const [eliminatingId, setEliminatingId] = useState(null);
  const [advancingRound, setAdvancingRound] = useState(false);
  const [myRole, setMyRole] = useState(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hostLeftNotice, setHostLeftNotice] = useState(false);

  const fetchRoom = useCallback(async () => {
    try {
      const { data } = await api.get(`/rooms/${roomCode}`);
      setRoomData(data);
      setRoom(data);
      if (playerId) {
        const { data: player } = await api.get(`/player/${playerId}`);
        setMyRole(player.role);
      }
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [roomCode, playerId]);

  useEffect(() => {
    if (!playerId || !roomCode) { navigate('/'); return; }
    fetchRoom();
  }, []);

  // Sockets
  useEffect(() => {
    if (!socket || !playerId || !roomCode) return;

    connectToRoom(roomCode, playerId);

    socket.on('roomUpdate', (data) => { setRoomData(data); setRoom(data); });
    socket.on('playerEliminated', ({ room }) => { setRoomData(room); setRoom(room); });
    socket.on('roundStarted', ({ room }) => { setRoomData(room); setRoom(room); });
    socket.on('gameEnded', ({ room, reason }) => {
      if (reason === 'hostLeft') {
        setHostLeftNotice(true);
        setTimeout(() => { clearSession(); navigate('/'); }, 3500);
        return;
      }
      setRoom(room);
      navigate(`/end/${roomCode}`);
    });

    return () => {
      socket.off('roomUpdate');
      socket.off('playerEliminated');
      socket.off('roundStarted');
      socket.off('gameEnded');
    };
  }, [socket, playerId, roomCode]);

  async function handleEliminate(targetId) {
    setEliminatingId(targetId);
    setError('');
    try {
      await api.post(`/rooms/${roomCode}/eliminate`, { playerId, targetPlayerId: targetId });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to eliminate player.');
    } finally {
      setEliminatingId(null);
    }
  }

  async function handleNextRound() {
    setAdvancingRound(true);
    setError('');
    try {
      await api.post(`/rooms/${roomCode}/nextround`, { playerId });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to advance round.');
    } finally {
      setAdvancingRound(false);
    }
  }

  async function handleEndGame() {
    setEndingGame(true);
    setError('');
    try {
      await api.post(`/rooms/${roomCode}/end`, { playerId, winner });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end game.');
      setEndingGame(false);
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

  const players = roomData?.players || [];
  const alivePlayers = players.filter((p) => p.isAlive);
  const deadPlayers = players.filter((p) => !p.isAlive);
  const roleInfo = myRole ? ROLES[myRole] : null;

  return (
    <div className="page page-glow-red" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
      <div className="content-wide animate-fadeIn">

        {/* ── TOP BAR ── */}
        <div className="responsive-row" style={{ marginBottom: '1.25rem' }}>
          {/* Leave */}
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

          {/* Round badge */}
          <div className="round-badge" style={{ margin: 0 }}>
            🌙 Round {roomData?.currentRound || 1}
          </div>
        </div>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 className="page-title">Game In Progress</h2>
          <p className="page-subtitle">Gameplay happens in real life. Use this to track the game.</p>
        </div>

        {/* ── MY ROLE REMINDER ── */}
        {roleInfo && (
          <div
            className="card animate-scaleIn delay-1"
            style={{
              marginBottom: '1.25rem',
              padding: '0.9rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: `${roleInfo.color}08`,
              borderColor: `${roleInfo.color}20`,
            }}
          >
            <span style={{ fontSize: '1.8rem', filter: `drop-shadow(0 0 8px ${roleInfo.color})` }}>
              {roleInfo.icon}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Your Role
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', color: roleInfo.color, fontSize: '1rem' }}>
                {roleInfo.title}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Status
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: players.find(p => p._id === playerId)?.isAlive ? 'var(--teal)' : '#f54242' }}>
                {players.find(p => p._id === playerId)?.isAlive ? '● Alive' : '💀 Eliminated'}
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        {/* ── MAIN GRID ── */}
        <div className="responsive-grid-two">

          {/* Alive players */}
          <div className="card animate-scaleIn delay-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <p className="section-title" style={{ margin: 0 }}>Alive</p>
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: '0.8rem',
                color: 'var(--teal)', background: 'rgba(66,245,185,0.1)',
                padding: '0.2rem 0.6rem', borderRadius: '100px',
                border: '1px solid rgba(66,245,185,0.2)',
              }}>
                {alivePlayers.length}
              </span>
            </div>
            <div className="player-list">
              {alivePlayers.map((p) => (
                <div key={p._id} className={`player-item ${p.isHost ? 'is-host' : ''}`}>
                  <div className="player-avatar">{p.name.charAt(0)}</div>
                  <span className="player-name">{p.name}</span>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {/* God sees all roles */}
                    {myRole === 'God' && p.role && (
                      <span className={`role-tag role-tag-${p.role.toLowerCase()}`}>
                        {ROLES[p.role]?.icon} {p.role}
                      </span>
                    )}
                    {p._id === playerId && <span className="player-badge badge-you">You</span>}
                    {p.isHost && <span className="player-badge badge-host">👑</span>}
                    {isHost && p._id !== playerId && (
                      <button
                        className="btn btn-red btn-sm"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.6rem' }}
                        onClick={() => handleEliminate(p._id)}
                        disabled={eliminatingId === p._id}
                      >
                        {eliminatingId === p._id ? '…' : '💀 Eliminate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {alivePlayers.length === 0 && (
                <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                  No players alive
                </p>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="responsive-stack">

            {/* Eliminated */}
            <div className="card animate-scaleIn delay-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p className="section-title" style={{ margin: 0 }}>Eliminated</p>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontSize: '0.8rem',
                  color: '#f54242', background: 'rgba(245,66,66,0.1)',
                  padding: '0.2rem 0.6rem', borderRadius: '100px',
                  border: '1px solid rgba(245,66,66,0.2)',
                }}>
                  {deadPlayers.length}
                </span>
              </div>
              {deadPlayers.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '0.5rem 0' }}>
                  No casualties yet
                </p>
              ) : (
                <div className="player-list">
                  {deadPlayers.map((p) => (
                    <div key={p._id} className="player-item is-dead">
                      <div className="player-avatar" style={{ opacity: 0.4 }}>💀</div>
                      <span className="player-name">{p.name}</span>
                      {myRole === 'God' && p.role && (
                        <span className={`role-tag role-tag-${p.role.toLowerCase()}`}>
                          {ROLES[p.role]?.icon} {p.role}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* God controls */}
            {isHost && (
              <div className="card animate-scaleIn delay-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p className="section-title" style={{ marginBottom: 0 }}>God Controls</p>

                <button
                  className="btn btn-teal"
                  onClick={handleNextRound}
                  disabled={advancingRound}
                >
                  {advancingRound
                    ? 'Advancing…'
                    : `⏭ Next Round (${(roomData?.currentRound || 1) + 1})`}
                </button>

                {!showEndConfirm ? (
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowEndConfirm(true)}
                    style={{ borderColor: 'rgba(245,66,66,0.3)', color: '#f54242' }}
                  >
                    🏁 End Game
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--text-dim)', textAlign: 'center' }}>
                      SELECT WINNER
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setWinner('Villagers')}
                        className="btn btn-ghost btn-sm"
                        style={{
                          flex: 1,
                          borderColor: winner === 'Villagers' ? 'var(--teal)' : undefined,
                          color: winner === 'Villagers' ? 'var(--teal)' : undefined,
                        }}
                      >
                        🏘️ Villagers
                      </button>
                      <button
                        onClick={() => setWinner('Mafia')}
                        className="btn btn-ghost btn-sm"
                        style={{
                          flex: 1,
                          borderColor: winner === 'Mafia' ? '#f54242' : undefined,
                          color: winner === 'Mafia' ? '#f54242' : undefined,
                        }}
                      >
                        🔪 Mafia
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-red"
                        onClick={handleEndGame}
                        disabled={endingGame}
                        style={{ flex: 2 }}
                      >
                        {endingGame ? 'Ending…' : '✓ Confirm End'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowEndConfirm(false)}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Non-host waiting card */}
            {!isHost && (
              <div className="card animate-scaleIn delay-4" style={{ padding: '1.25rem' }}>
                <div className="waiting-pulse">
                  <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                    Play continues in real life
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', marginTop: '0.75rem' }}>
                  The God will update player status here as the game progresses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
