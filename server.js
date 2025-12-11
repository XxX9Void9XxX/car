// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // adjust cors if you host client separately
  cors: {
    origin: "*",
    methods: ["GET","POST"]
  }
});

app.use(express.static('public'));

const TICK_RATE = 20; // server updates per second
const players = {}; // { socketId: {id, x, y, angle, speed, color} }

io.on('connection', socket => {
  console.log('connect', socket.id);

  // create new player
  players[socket.id] = {
    id: socket.id,
    x: Math.random() * 800,
    y: Math.random() * 400,
    angle: 0,
    speed: 0,
    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')
  };

  // tell the new client its id
  socket.emit('init', { id: socket.id });

  // broadcast new player to others
  socket.broadcast.emit('playerJoined', players[socket.id]);

  // receive inputs from client
  socket.on('input', data => {
    const p = players[socket.id];
    if (!p) return;
    // simple input: {throttle: -1..1, steer: -1..1}
    p.speed += data.throttle * 0.4;
    // clamp speed
    p.speed = Math.max(-6, Math.min(12, p.speed));
    p.angle += data.steer * 0.06;
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

// Physics/update loop
setInterval(() => {
  // update positions
  for (const id in players) {
    const p = players[id];
    // simple friction
    p.speed *= 0.98;
    // move
    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;
    // wrap-around world (or clamp)
    if (p.x < 0) p.x += 800;
    if (p.x > 800) p.x -= 800;
    if (p.y < 0) p.y += 600;
    if (p.y > 600) p.y -= 600;
  }
  // broadcast snapshot
  io.emit('state', players);
}, 1000 / TICK_RATE);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`listening ${PORT}`));
