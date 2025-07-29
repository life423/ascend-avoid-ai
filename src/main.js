// Mobile-first multiplayer canvas game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

// Game state
let players = new Map();
let myPlayerId = null;
let ws = null;
let keys = {};

// Initialize canvas size
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// Connect to WebSocket server
function connect() {
  const wsUrl = `ws://${window.location.hostname}:8080`;
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    status.textContent = 'Connected';
    console.log('Connected to server');
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
      case 'init':
        myPlayerId = message.playerId;
        message.players.forEach(player => {
          players.set(player.id, player);
        });
        status.textContent = `Connected as ${myPlayerId.slice(0, 6)}`;
        break;
        
      case 'playerJoined':
        players.set(message.player.id, message.player);
        break;
        
      case 'playerMoved':
        const player = players.get(message.playerId);
        if (player) {
          player.x = message.x;
          player.y = message.y;
        }
        break;
        
      case 'playerLeft':
        players.delete(message.playerId);
        break;
    }
  };
  
  ws.onclose = () => {
    status.textContent = 'Disconnected';
    setTimeout(connect, 2000);
  };
  
  ws.onerror = () => {
    status.textContent = 'Connection error';
  };
}

// Send movement to server
function sendMove(x, y) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'move',
      x: Math.max(0, Math.min(canvas.width / window.devicePixelRatio - 20, x)),
      y: Math.max(0, Math.min(canvas.height / window.devicePixelRatio - 20, y))
    }));
  }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Touch controls
document.querySelectorAll('.dpad-btn').forEach(btn => {
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const direction = btn.dataset.direction;
    keys[direction] = true;
  });
  
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    const direction = btn.dataset.direction;
    keys[direction] = false;
  });
});

// Game loop
function gameLoop() {
  // Handle input
  if (myPlayerId && players.has(myPlayerId)) {
    const myPlayer = players.get(myPlayerId);
    let moved = false;
    const speed = 3;
    
    if (keys['w'] || keys['arrowup'] || keys['up']) {
      myPlayer.y -= speed;
      moved = true;
    }
    if (keys['s'] || keys['arrowdown'] || keys['down']) {
      myPlayer.y += speed;
      moved = true;
    }
    if (keys['a'] || keys['arrowleft'] || keys['left']) {
      myPlayer.x -= speed;
      moved = true;
    }
    if (keys['d'] || keys['arrowright'] || keys['right']) {
      myPlayer.x += speed;
      moved = true;
    }
    
    if (moved) {
      sendMove(myPlayer.x, myPlayer.y);
    }
  }
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw players
  players.forEach((player, id) => {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, 20, 20);
    
    // Draw player ID
    ctx.fillStyle = 'white';
    ctx.font = '12px system-ui';
    ctx.fillText(id.slice(0, 6), player.x, player.y - 5);
  });
  
  requestAnimationFrame(gameLoop);
}

// Initialize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
connect();
gameLoop();