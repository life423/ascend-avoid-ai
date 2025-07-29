import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const players = new Map();

console.log('🚀 WebSocket server running on port 8080');

wss.on('connection', (ws) => {
  const playerId = Math.random().toString(36).substr(2, 9);
  
  console.log(`Player ${playerId} connected`);
  
  // Add new player
  players.set(playerId, {
    id: playerId,
    x: Math.random() * 400,
    y: Math.random() * 300,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  });
  
  // Send current players to new player
  ws.send(JSON.stringify({
    type: 'init',
    playerId,
    players: Array.from(players.values())
  }));
  
  // Broadcast new player to others
  broadcast({
    type: 'playerJoined',
    player: players.get(playerId)
  }, ws);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'move') {
        const player = players.get(playerId);
        if (player) {
          player.x = message.x;
          player.y = message.y;
          
          broadcast({
            type: 'playerMoved',
            playerId,
            x: message.x,
            y: message.y
          }, ws);
        }
      }
    } catch (error) {
      console.error('Invalid message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`Player ${playerId} disconnected`);
    players.delete(playerId);
    
    broadcast({
      type: 'playerLeft',
      playerId
    });
  });
});

function broadcast(message, exclude = null) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === 1) {
      client.send(data);
    }
  });
}