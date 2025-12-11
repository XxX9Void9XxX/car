// client.js
const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const info = document.getElementById('info');

let myId = null;
let players = {};

socket.on('connect', () => {
  info.textContent = 'Connected. Waiting for init...';
});

socket.on('init', data => {
  myId = data.id;
  info.textContent = `You: ${myId} — Use W/S to accelerate, A/D to steer`;
});

socket.on('state', state => {
  players = state;
});

socket.on('playerJoined', p => {
  // optional: play join sound
});

socket.on('playerLeft', id => {
  // optional: remove
  delete players[id];
});

// input handling
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function sendInput() {
  const throttle = (keys['w'] ? 1 : 0) + (keys['s'] ? -1 : 0);
  const steer = (keys['d'] ? 1 : 0) + (keys['a'] ? -1 : 0);
  socket.emit('input', { throttle, steer });
}

// basic render
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // draw all players
  for (const id in players) {
    const p = players[id];
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    // vehicle body
    ctx.fillStyle = p.color || '#88f';
    ctx.fillRect(-12, -8, 24, 16);
    // highlight the local player
    if (id === myId) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -10, 28, 20);
    }
    ctx.restore();
  }

  requestAnimationFrame(draw);
}

// tick: send inputs at a modest rate
setInterval(sendInput, 50);
requestAnimationFrame(draw);
