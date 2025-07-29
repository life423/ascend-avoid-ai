// Main game loop and state management
export class GameLoop {
  constructor(canvasManager, inputManager, networkManager, statusManager) {
    this.canvas = canvasManager;
    this.input = inputManager;
    this.network = networkManager;
    this.status = statusManager;
    
    this.players = new Map();
    this.myPlayerId = null;
    this.isRunning = false;
    
    this.setupNetworkHandlers();
  }

  setupNetworkHandlers() {
    this.network.setMessageHandler((message) => this.handleMessage(message));
    this.network.setStatusHandler((className, text) => {
      this.status.updateStatus(className, text);
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'init':
        this.myPlayerId = message.playerId;
        message.players.forEach(player => {
          this.players.set(player.id, player);
        });
        this.status.setConnected(this.myPlayerId);
        break;
        
      case 'playerJoined':
        this.players.set(message.player.id, message.player);
        break;
        
      case 'playerMoved':
        const player = this.players.get(message.playerId);
        if (player) {
          player.x = message.x;
          player.y = message.y;
        }
        break;
        
      case 'playerLeft':
        this.players.delete(message.playerId);
        break;
    }
  }

  start() {
    this.isRunning = true;
    this.network.connect();
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;

    // Handle input
    if (this.myPlayerId && this.players.has(this.myPlayerId)) {
      const myPlayer = this.players.get(this.myPlayerId);
      const movement = this.input.getMovement();
      
      if (movement.x !== 0 || movement.y !== 0) {
        myPlayer.x += movement.x;
        myPlayer.y += movement.y;
        
        // Constrain to canvas bounds
        const canvas = this.canvas.getCanvas();
        myPlayer.x = Math.max(0, Math.min(canvas.width / window.devicePixelRatio - 20, myPlayer.x));
        myPlayer.y = Math.max(0, Math.min(canvas.height / window.devicePixelRatio - 20, myPlayer.y));
        
        this.network.sendMove(myPlayer.x, myPlayer.y);
      }
    }
    
    // Render
    this.canvas.clear();
    this.players.forEach((player, id) => {
      this.canvas.drawPlayer(player, id);
    });
    
    requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.isRunning = false;
  }
}