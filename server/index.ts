// server/index.ts
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { GameRoom } from "./rooms/GameRoom";
import config from "./config";
import logger from "./utils/logger";

// Create an Express application
// Express handles HTTP requests, while Colyseus handles WebSocket connections
const app = express();

// Enable CORS to allow connections from your game client
// This is like putting up a sign that says "players from other domains are welcome"
app.use(cors());

// Parse JSON bodies for any REST endpoints you might add later
app.use(express.json());

// Serve static files from the client build directory
// This allows you to host your game client from the same server
app.use(express.static("../dist"));

// Create the HTTP server using our Express app
const httpServer = createServer(app);

// Initialize Colyseus with our HTTP server
// This creates the game server that will manage all your rooms and players
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
    pingInterval: config.pingInterval,
    pingMaxRetries: config.pingMaxRetries
  })
});

// Register your game room
// This tells Colyseus: "When a player wants to join a game called 'game_room', 
// create or find an instance of our GameRoom class"
gameServer.define("game_room", GameRoom);

// Add a simple health check endpoint
// This is useful for monitoring if your server is running
app.get("/health", (_req, res) => {
  res.json({ 
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start listening for connections
const PORT = config.port;
gameServer.listen(PORT);

logger.info(`🎮 Ascend & Avoid Game Server is running on port ${PORT}`);
logger.info(`🌐 Health check available at http://localhost:${PORT}/health`);
  
  // In production, you might want to log the actual server URL
  if (process.env.NODE_ENV === 'production') {
    logger.info(`🚀 Server is running in production mode`);
  } else {
    logger.info(`🔧 Server is running in development mode`);
  }
});

// Graceful shutdown handling
// This ensures players are properly disconnected when the server stops
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
});