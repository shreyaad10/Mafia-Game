# 🎭 MAFIA — Real-Life Game Companion App

A full-stack web application that helps you run Mafia games in real life. It handles room creation, player joining, role assignment, and round management — **all gameplay happens physically**.

---

## 🗂 Project Structure

```
mafia-game/
├── backend/               # Node.js + Express + Socket.io + MongoDB
│   ├── models/
│   │   ├── Player.js
│   │   └── Room.js
│   ├── controllers/
│   │   ├── roomController.js
│   │   └── playerController.js
│   ├── routes/
│   │   ├── roomRoutes.js
│   │   └── playerRoutes.js
│   ├── socket/
│   │   └── socketHandlers.js
│   ├── server.js
│   └── .env.example
│
└── frontend/              # React + Vite + React Router + Socket.io-client
    └── src/
        ├── context/
        │   └── GameContext.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── CreateRoom.jsx
        │   ├── JoinRoom.jsx
        │   ├── Lobby.jsx
        │   ├── RevealRole.jsx
        │   ├── Round.jsx
        │   └── EndGame.jsx
        ├── utils/
        │   ├── api.js
        │   └── roles.js
        └── styles/
            └── global.css
```

## 🎮 Game Flow

| Step | Action |
|------|--------|
| 1 | Host enters name → clicks "Host a Game" → gets room code |
| 2 | Players enter name + room code → join room |
| 3 | Lobby shows live player list (sockets) |
| 4 | Host clicks "Start Game" (needs 4+ players) |
| 5 | Roles auto-assigned, each player privately taps to reveal |
| 6 | Round screen shows alive/dead players |
| 7 | Host (God) marks players as eliminated |
| 8 | Host ends game and declares winner |
| 9 | End screen reveals all roles |

---

## 🃏 Role Assignment Rules

| Players | God | Doctor | Mafia | Villagers |
|---------|-----|--------|-------|-----------|
| 4       | 1   | 1      | 1     | 1         |
| 8       | 1   | 1      | 2     | 4         |
| 12      | 1   | 1      | 3     | 7         |

---

## 📡 API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/rooms/create` | Create room (host) |
| POST | `/api/rooms/join` | Join existing room |
| GET | `/api/rooms/:code` | Get room state |
| POST | `/api/rooms/:code/start` | Start game + assign roles |
| POST | `/api/rooms/:code/eliminate` | Mark player as dead |
| POST | `/api/rooms/:code/nextround` | Advance to next round |
| POST | `/api/rooms/:code/end` | End game with winner |
| GET | `/api/player/:id` | Get player info + role |
| POST | `/api/player/:id/reveal` | Mark role as revealed |

---

## 🔌 Socket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `joinRoom` | Client → Server | `{ roomCode, playerId }` |
| `roomUpdate` | Server → Client | Room object |
| `roundStarted` | Server → Client | `{ round, room }` |
| `playerEliminated` | Server → Client | `{ targetPlayerId, room }` |
| `gameEnded` | Server → Client | `{ winner, room }` |

---
