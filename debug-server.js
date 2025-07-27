// Simple server debug script to test player control issues
const http = require('http');
const { Server } = require('colyseus');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { GameRoom } = require('./server/dist/server/rooms/GameRoom.js');

const port = 3001; // Use different port for debugging
const server = http.createServer();
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: server,
  }),
});

// Register the game room
gameServer.define('game_room', GameRoom);

console.log(`🚀 Debug server starting on port ${port}...`);
console.log(`📊 Colyseus Monitor will be at http://localhost:${port}/colyseus`);

server.listen(port, () => {
  console.log(`✅ Debug server listening on port ${port}`);
  console.log(`🎮 Ready for player control testing`);
  console.log(`\n📝 To test:`);
  console.log(`  1. Open test-player-control.html in multiple browser tabs`);
  console.log(`  2. Change the connection URL to ws://localhost:${port}`);
  console.log(`  3. Connect both clients and test movement`);
  console.log(`  4. Watch the server logs for input handling`);
});

// Enhanced logging for debugging
gameServer.onShutdown(() => {
  console.log('🛑 Debug server shutting down...');
});

// Log all room events
gameServer.define('game_room', GameRoom).onJoin = (room, client) => {
  console.log(`\n🔗 CLIENT JOINED DEBUG`);
  console.log(`  Session ID: ${client.sessionId}`);
  console.log(`  Room ID: ${room.roomId}`);
  console.log(`  Players in room: ${room.state.totalPlayers}`);
};

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});