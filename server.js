const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 10000,
  pingTimeout: 5000,
});

app.use(express.static(path.join(__dirname, 'public')));

const rooms = new Map();
const MAX_PLAYERS = 10;
const MATCH_DURATION = 300;

function broadcast(roomCode, event, data, excludeId) {
  const room = rooms.get(roomCode);
  if (!room) return;
  for (const [pid, sock] of room.sockets) {
    if (pid !== excludeId) {
      sock.emit(event, data);
    }
  }
}

function broadcastAll(roomCode, event, data) {
  broadcast(roomCode, event, data, null);
}

function getRoomState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    state: room.state,
    startTime: room.startTime,
    matchDuration: room.matchDuration,
    players: Object.fromEntries(room.players),
    rankings: room.rankings,
  };
}

function getPlayersList(room) {
  return Array.from(room.players.values());
}

function migrateHost(room) {
  const ids = Array.from(room.players.keys()).sort();
  if (ids.length > 0) {
    room.hostId = ids[0];
    broadcastAll(room.code, 'host_changed', { hostId: room.hostId });
  }
}

function calcScore(player, rank) {
  let s = 0;
  const posBonus = [5000, 3000, 2000, 1500, 1000, 500, 250, 100];
  s += posBonus[rank] || 50;
  if (player.finished && player.finishTime) {
    s += Math.max(0, Math.floor((MATCH_DURATION * 1000 - player.finishTime) / 50));
  }
  s += (player.coins || 0) * 200;
  s += (player.gameScore || 0);
  if (!player.finished) {
    s += Math.floor((player.progress || 0) * 2000);
  }
  return s;
}

function endMatch(room) {
  const players = Array.from(room.players.values());
  const finished = players.filter(p => p.finished).sort((a, b) => a.finishTime - b.finishTime);
  const alive = players.filter(p => !p.finished && p.alive).sort((a, b) => (b.progress || 0) - (a.progress || 0));
  const dead = players.filter(p => !p.finished && !p.alive).sort((a, b) => (b.progress || 0) - (a.progress || 0));
  const rankings = [...finished, ...alive, ...dead].map((p, i) => ({
    id: p.id, name: p.name, color: p.color || 'red', progress: p.progress,
    finished: p.finished, finishTime: p.finishTime,
    alive: p.alive, coins: p.coins, gameScore: p.gameScore,
    rank: i + 1, finalScore: calcScore(p, i),
  }));
  room.state = 'finished';
  room.rankings = rankings;
  broadcastAll(room.code, 'match_finished', { rankings });
}

function checkMatchEnd(room) {
  if (room.state !== 'playing') return;
  const players = Array.from(room.players.values());
  if (players.length === 0) return;
  if (players.every(p => p.finished || !p.alive)) {
    endMatch(room);
  }
}

io.on('connection', (socket) => {
  let playerId = null;
  let playerRoom = null;

  socket.on('create_room', ({ name, color }, callback) => {
    playerId = 'p_' + Math.random().toString(36).substring(2, 10);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    } while (rooms.has(code));

    const playerData = {
      id: playerId,
      name: (name || 'Mario').substring(0, 12),
      color: color || 'red',
      progress: 0, finished: false, finishTime: null,
      alive: true, coins: 0, gameScore: 0,
    };

    const room = {
      code,
      hostId: playerId,
      state: 'waiting',
      startTime: null,
      matchDuration: MATCH_DURATION,
      rankings: null,
      players: new Map([[playerId, playerData]]),
      sockets: new Map([[playerId, socket]]),
    };
    rooms.set(code, room);
    playerRoom = code;
    socket.join(code);

    callback({ ok: true, code, playerId, players: [playerData] });
  });

  socket.on('join_room', ({ code, name, color }, callback) => {
    const room = rooms.get(code);
    if (!room) return callback({ ok: false, error: 'Room not found' });
    if (room.state !== 'waiting') return callback({ ok: false, error: 'Game already started' });
    if (room.players.size >= MAX_PLAYERS) return callback({ ok: false, error: 'Room full (max ' + MAX_PLAYERS + ')' });

    const finalColor = color || 'red';

    playerId = 'p_' + Math.random().toString(36).substring(2, 10);
    const playerData = {
      id: playerId,
      name: (name || 'Luigi').substring(0, 12),
      color: finalColor,
      progress: 0, finished: false, finishTime: null,
      alive: true, coins: 0, gameScore: 0,
    };

    room.players.set(playerId, playerData);
    room.sockets.set(playerId, socket);
    playerRoom = code;
    socket.join(code);

    const playersList = getPlayersList(room);
    broadcast(code, 'player_joined', { players: playersList }, playerId);
    callback({ ok: true, code, playerId, color: finalColor, players: playersList, hostId: room.hostId });
  });

  socket.on('change_color', ({ color }) => {
    if (!playerRoom || !playerId) return;
    const room = rooms.get(playerRoom);
    if (!room || room.state !== 'waiting') return;

    const player = room.players.get(playerId);
    if (player) {
      player.color = color;
      broadcastAll(playerRoom, 'player_updated', { players: getPlayersList(room) });
    }
  });

  socket.on('start_game', () => {
    if (!playerRoom || !playerId) return;
    const room = rooms.get(playerRoom);
    if (!room || room.hostId !== playerId || room.state !== 'waiting') return;

    room.state = 'countdown';
    broadcastAll(playerRoom, 'countdown', {});

    setTimeout(() => {
      if (!rooms.has(playerRoom)) return;
      const r = rooms.get(playerRoom);
      if (r.state !== 'countdown') return;
      r.state = 'playing';
      r.startTime = Date.now();
      r.rankings = null;
      for (const [, p] of r.players) {
        p.progress = 0; p.finished = false; p.finishTime = null;
        p.alive = true; p.coins = 0; p.gameScore = 0;
      }
      broadcastAll(playerRoom, 'game_start', {
        startTime: r.startTime,
        matchDuration: r.matchDuration,
        players: getPlayersList(r),
      });
    }, 3000);
  });

  socket.on('progress', ({ progress, coins, gameScore }) => {
    if (!playerRoom || !playerId) return;
    const room = rooms.get(playerRoom);
    if (!room || room.state !== 'playing') return;
    const player = room.players.get(playerId);
    if (!player || player.finished || !player.alive) return;

    player.progress = progress;
    player.coins = coins;
    player.gameScore = gameScore;

    broadcast(playerRoom, 'room_state', { players: getPlayersList(room) }, playerId);
  });

  socket.on('time_expired', () => {
    if (!playerRoom || !playerId) return;
    const room = rooms.get(playerRoom);
    if (!room || room.state !== 'playing' || room.hostId !== playerId) return;
    endMatch(room);
  });

  socket.on('player_finished', ({ finishTime, coins, gameScore }) => {
    if (!playerRoom || !playerId) return;
    const room = rooms.get(playerRoom);
    if (!room || room.state !== 'playing') return;
    const player = room.players.get(playerId);
    if (!player) return;

    player.finished = true;
    player.finishTime = finishTime;
    player.progress = 1;
    player.coins = coins;
    player.gameScore = gameScore;

    broadcastAll(playerRoom, 'room_state', { players: getPlayersList(room) });
    checkMatchEnd(room);
  });

  socket.on('player_died', ({ coins, gameScore, progress }) => {
    if (!playerRoom || !playerId) return;
    const room = rooms.get(playerRoom);
    if (!room || room.state !== 'playing') return;
    const player = room.players.get(playerId);
    if (!player) return;

    player.alive = false;
    player.coins = coins;
    player.gameScore = gameScore;
    player.progress = progress;

    broadcastAll(playerRoom, 'room_state', { players: getPlayersList(room) });
    checkMatchEnd(room);
  });

  socket.on('return_to_lobby', () => {
    if (!playerRoom || !playerId) return;
    const room = rooms.get(playerRoom);
    if (!room || room.hostId !== playerId) return;

    room.state = 'waiting';
    room.startTime = null;
    room.rankings = null;
    for (const [, p] of room.players) {
      p.progress = 0; p.finished = false; p.finishTime = null;
      p.alive = true; p.coins = 0; p.gameScore = 0;
    }
    broadcastAll(playerRoom, 'returned_to_lobby', { players: getPlayersList(room) });
  });

  socket.on('leave_room', () => {
    handleDisconnect();
  });

  socket.on('disconnect', () => {
    handleDisconnect();
  });

  function handleDisconnect() {
    if (!playerRoom || !playerId) return;
    const room = rooms.get(playerRoom);
    if (!room) return;

    room.players.delete(playerId);
    room.sockets.delete(playerId);

    if (room.players.size === 0) {
      rooms.delete(playerRoom);
    } else {
      if (room.hostId === playerId) {
        migrateHost(room);
      }
      broadcastAll(playerRoom, 'player_left', { players: getPlayersList(room), hostId: room.hostId });

      if (room.state === 'playing') {
        checkMatchEnd(room);
      }
    }

    playerRoom = null;
    playerId = null;
  }
});

const PORT = process.env.PORT || 3000;

function startServer(port) {
  server.listen(port, () => {
    console.log('Server running on http://localhost:' + port);
  });
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('Port ' + port + ' in use, trying ' + (port + 1) + '...');
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

startServer(PORT);
