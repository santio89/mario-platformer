const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket', 'polling'],
});

app.use(express.static(path.join(__dirname, 'public')));

const MATCH_DURATION = 300;
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function endMatch(room) {
  if (room.state === 'finished') return;
  room.state = 'finished';
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  const players = Array.from(room.players.values());
  const finished = players.filter(p => p.finished).sort((a, b) => a.finishTime - b.finishTime);
  const alive = players.filter(p => !p.finished && p.alive).sort((a, b) => b.progress - a.progress);
  const dead = players.filter(p => !p.finished && !p.alive).sort((a, b) => b.progress - a.progress);

  const rankings = [...finished, ...alive, ...dead].map((p, i) => ({
    ...p,
    rank: i + 1,
    finalScore: calcScore(p, i),
  }));

  io.to(room.code).emit('matchEnd', rankings);
}

function calcScore(player, rank) {
  let s = 0;
  const posBonus = [5000, 3000, 2000, 1500, 1000, 500, 250, 100];
  s += posBonus[rank] || 50;
  if (player.finished && player.finishTime) {
    s += Math.max(0, Math.floor((MATCH_DURATION * 1000 - player.finishTime) / 100));
  }
  s += (player.coins || 0) * 200;
  s += Math.floor((player.gameScore || 0) / 10);
  if (!player.finished) {
    s += Math.floor((player.progress || 0) * 2000);
  }
  return s;
}

function createPlayerData(id, name) {
  return {
    id, name: (name || 'Player').substring(0, 12),
    progress: 0, finished: false, finishTime: null,
    alive: true, coins: 0, gameScore: 0,
  };
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('createRoom', (playerName, callback) => {
    let code = generateRoomCode();
    while (rooms.has(code)) code = generateRoomCode();

    const room = {
      code, host: socket.id,
      players: new Map(),
      state: 'waiting',
      startTime: null, timerInterval: null,
    };
    room.players.set(socket.id, createPlayerData(socket.id, playerName || 'Mario'));
    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;
    callback({ success: true, code, players: Array.from(room.players.values()) });
  });

  socket.on('joinRoom', (data, callback) => {
    const { code, playerName } = data;
    const room = rooms.get(code);
    if (!room) return callback({ success: false, error: 'Room not found' });
    if (room.state !== 'waiting') return callback({ success: false, error: 'Game already started' });
    if (room.players.size >= 8) return callback({ success: false, error: 'Room full (max 8)' });

    room.players.set(socket.id, createPlayerData(socket.id, playerName || 'Luigi'));
    socket.join(code);
    socket.roomCode = code;

    const players = Array.from(room.players.values());
    callback({ success: true, code, players });
    socket.to(code).emit('playerJoined', players);
  });

  socket.on('startGame', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.host !== socket.id || room.state !== 'waiting') return;

    room.state = 'countdown';
    io.to(room.code).emit('countdown');

    setTimeout(() => {
      if (room.state !== 'countdown') return;
      room.state = 'playing';
      room.startTime = Date.now();
      io.to(room.code).emit('gameStart', { duration: MATCH_DURATION });

      let remaining = MATCH_DURATION;
      room.timerInterval = setInterval(() => {
        remaining--;
        io.to(room.code).emit('timerSync', remaining);
        if (remaining <= 0) endMatch(room);
      }, 1000);
    }, 3000);
  });

  socket.on('progressUpdate', (data) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.state !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || player.finished) return;

    if (typeof data === 'object') {
      player.progress = Math.max(player.progress, data.progress || 0);
      player.coins = data.coins || 0;
      player.gameScore = data.score || 0;
    } else {
      player.progress = Math.max(player.progress, data);
    }
    socket.volatile.to(room.code).emit('raceUpdate', Array.from(room.players.values()));
  });

  socket.on('playerFinished', (data) => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.state !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || player.finished) return;

    player.finished = true;
    player.finishTime = Date.now() - room.startTime;
    player.coins = data?.coins || player.coins;
    player.gameScore = data?.score || player.gameScore;
    player.progress = 1;
    io.to(room.code).emit('raceUpdate', Array.from(room.players.values()));

    if (Array.from(room.players.values()).every(p => p.finished || !p.alive)) {
      endMatch(room);
    }
  });

  socket.on('playerDied', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.state !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player) return;
    player.alive = false;
    io.to(room.code).emit('raceUpdate', Array.from(room.players.values()));
    if (Array.from(room.players.values()).every(p => p.finished || !p.alive)) {
      endMatch(room);
    }
  });

  socket.on('returnToLobby', () => {
    const room = rooms.get(socket.roomCode);
    if (!room || room.host !== socket.id) return;
    room.state = 'waiting';
    room.startTime = null;
    if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
    for (const [, p] of room.players) Object.assign(p, { progress: 0, finished: false, finishTime: null, alive: true, coins: 0, gameScore: 0 });
    io.to(room.code).emit('returnedToLobby', Array.from(room.players.values()));
  });

  socket.on('disconnect', () => {
    const code = socket.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    room.players.delete(socket.id);

    if (room.players.size === 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      rooms.delete(code);
      return;
    }
    if (room.host === socket.id) {
      room.host = room.players.keys().next().value;
    }
    const players = Array.from(room.players.values());
    io.to(code).emit('playerLeft', { players, newHost: room.host });
    if (room.state === 'playing' && players.every(p => p.finished || !p.alive)) {
      endMatch(room);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Super Mario Online running at http://localhost:${PORT}`);
});
