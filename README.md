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

---

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally OR a MongoDB Atlas URI

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/mafia-game
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Or from root (requires concurrently):
```bash
npm install
npm run dev
```

### 4. Open in Browser

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

---

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

## 🚀 Production Build

```bash
# Build frontend
cd frontend && npm run build

# Serve static files from backend
# (Configure Express to serve frontend/dist)
```
