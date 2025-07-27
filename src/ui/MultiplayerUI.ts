/**
 * Handles UI elements for multiplayer mode
 * Converted to TypeScript and organized in ui/ directory.
 */
import { GAME_CONSTANTS } from '../constants/gameConstants';
import { generateRandomName } from '../utils/utils';

// Define interfaces for the MultiplayerUI
interface Player {
  name: string;
  state: string;
  playerIndex: number;
}

interface GameState {
  countdownTime?: number;
  areaPercentage?: number;
  winnerName?: string;
}

interface MultiplayerManager {
  players: Record<string, Player>;
  localSessionId: string;
  setServerAddress(address: string): void;
  connect(playerName: string): Promise<boolean>;
  disconnect(): void;
  getAliveCount(): number;
  getTotalPlayers(): number;
  getGameState(): string;
  getPlayerColor(index: number): string;
  requestRestart(): void;
  
  // Callback methods
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: string) => void;
  onGameStateChange?: (state: GameState) => void;
  onPlayerJoin?: (data: any) => void;
  onPlayerLeave?: (data: any) => void;
  onGameOver?: (winnerName: string) => void;
}

export default class MultiplayerUI {
  private multiplayerManager: MultiplayerManager;
  private isVisible: boolean;
  // private _gameContainer: HTMLElement | null; // Removed unused property
  
  // References to UI elements
  private multiplayerContainer: HTMLElement;
  private lobbyContainer: HTMLElement;
  private gameStatusContainer: HTMLElement;
  private playerListContainer: HTMLElement;
  private playerList: HTMLElement;
  private connectButton: HTMLButtonElement;
  private disconnectButton: HTMLButtonElement;
  private playerNameInput: HTMLInputElement;
  private serverAddressInput: HTMLInputElement;
  private countdownDisplay: HTMLElement;
  private playerCountDisplay: HTMLElement;
  private gameStatusDisplay: HTMLElement;
  private arenaIndicator: HTMLElement;
  private restartButton?: HTMLButtonElement;
  // private _players?: Record<string, Player>; // Removed unused property
  
  /**
   * Creates a new MultiplayerUI instance
   * @param multiplayerManager - The multiplayer manager instance
   */
  constructor(multiplayerManager: MultiplayerManager) {
    this.multiplayerManager = multiplayerManager;
    this.isVisible = false;
    // this._gameContainer = document.querySelector('.app-root[data-app="ascend-avoid"]'); // Removed unused assignment
    
    // Initialize UI elements (will be set in init)
    this.multiplayerContainer = null!;
    this.lobbyContainer = null!;
    this.gameStatusContainer = null!;
    this.playerListContainer = null!;
    this.playerList = null!;
    this.connectButton = null!;
    this.disconnectButton = null!;
    this.playerNameInput = null!;
    this.serverAddressInput = null!;
    this.countdownDisplay = null!;
    this.playerCountDisplay = null!;
    this.gameStatusDisplay = null!;
    this.arenaIndicator = null!;
    
    // Initialize UI elements
    this.init();
  }
  
  /**
   * Initialize UI elements
   */
  private init(): void {
    // Create main container
    this.multiplayerContainer = document.createElement('div');
    this.multiplayerContainer.id = 'multiplayer-container';
    this.multiplayerContainer.className = 'multiplayer-container';
    
    // Create lobby UI
    this.createLobbyUI();
    
    // Create game status UI
    this.createGameStatusUI();
    
    // Create player list UI
    this.createPlayerListUI();
    
    // Create arena indicator
    this.createArenaIndicator();
    
    // Add to DOM
    document.body.appendChild(this.multiplayerContainer);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Add styles
    this.addStyles();
    
    // Hide initially
    this.hide();
  }
  
  /**
   * Create lobby UI elements
   */
  private createLobbyUI(): void {
    this.lobbyContainer = document.createElement('div');
    this.lobbyContainer.className = 'multiplayer-lobby';
    
    // Create header
    const header = document.createElement('h2');
    header.textContent = 'Multiplayer Mode';
    this.lobbyContainer.appendChild(header);
    
    // Create form
    const form = document.createElement('div');
    form.className = 'multiplayer-form';
    
    // Player name input
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Your Name:';
    this.playerNameInput = document.createElement('input');
    this.playerNameInput.type = 'text';
    
    // Get stored name or generate a fun new one
    const storedName = sessionStorage.getItem('playerName');
    if (storedName) {
        this.playerNameInput.value = storedName;
    } else {
        const newName = generateRandomName();
        this.playerNameInput.value = newName;
        sessionStorage.setItem('playerName', newName);
    }
    
    nameLabel.appendChild(this.playerNameInput);
    form.appendChild(nameLabel);
    
    // Server address input
    const serverLabel = document.createElement('label');
    serverLabel.textContent = 'Server:';
    this.serverAddressInput = document.createElement('input');
    this.serverAddressInput.type = 'text';
    this.serverAddressInput.value = 'ws://localhost:3000';
    serverLabel.appendChild(this.serverAddressInput);
    form.appendChild(serverLabel);
    
    // Connect button
    this.connectButton = document.createElement('button') as HTMLButtonElement;
    this.connectButton.textContent = 'Connect';
    this.connectButton.className = 'connect-button';
    form.appendChild(this.connectButton);
    
    // Disconnect button
    this.disconnectButton = document.createElement('button') as HTMLButtonElement;
    this.disconnectButton.textContent = 'Disconnect';
    this.disconnectButton.className = 'disconnect-button';
    this.disconnectButton.style.display = 'none';
    form.appendChild(this.disconnectButton);
    
    this.lobbyContainer.appendChild(form);
    
    // Game description
    const description = document.createElement('div');
    description.className = 'multiplayer-description';
    description.innerHTML = `
      <h3>Last Player Standing Mode</h3>
      <p>In this multiplayer mode, up to 30 players compete to be the last one alive!</p>
      <ul>
        <li>Avoid hitting obstacles and other players</li>
        <li>The playing field shrinks over time</li>
        <li>If you hit an obstacle or leave the arena, you're eliminated</li>
        <li>The last player alive wins!</li>
      </ul>
    `;
    this.lobbyContainer.appendChild(description);
    
    this.multiplayerContainer.appendChild(this.lobbyContainer);
  }
  
  /**
   * Create game status UI elements
   */
  private createGameStatusUI(): void {
    this.gameStatusContainer = document.createElement('div');
    this.gameStatusContainer.className = 'multiplayer-status';
    
    // Countdown display
    this.countdownDisplay = document.createElement('div');
    this.countdownDisplay.className = 'countdown-display';
    this.countdownDisplay.textContent = '';
    this.gameStatusContainer.appendChild(this.countdownDisplay);
    
    // Player count
    this.playerCountDisplay = document.createElement('div');
    this.playerCountDisplay.className = 'player-count';
    this.playerCountDisplay.textContent = 'Players: 0/30';
    this.gameStatusContainer.appendChild(this.playerCountDisplay);
    
    // Game status
    this.gameStatusDisplay = document.createElement('div');
    this.gameStatusDisplay.className = 'game-status';
    this.gameStatusDisplay.textContent = 'Waiting for players...';
    this.gameStatusContainer.appendChild(this.gameStatusDisplay);
    
    this.multiplayerContainer.appendChild(this.gameStatusContainer);
  }
  
  /**
   * Create player list UI
   */
  private createPlayerListUI(): void {
    this.playerListContainer = document.createElement('div');
    this.playerListContainer.className = 'player-list-container';
    
    const header = document.createElement('h3');
    header.textContent = 'Players';
    this.playerListContainer.appendChild(header);
    
    const list = document.createElement('ul');
    list.className = 'player-list';
    this.playerList = list;
    this.playerListContainer.appendChild(list);
    
    this.multiplayerContainer.appendChild(this.playerListContainer);
  }
  
  /**
   * Create arena indicator
   */
  private createArenaIndicator(): void {
    this.arenaIndicator = document.createElement('div');
    this.arenaIndicator.className = 'arena-indicator';
    this.arenaIndicator.style.display = 'none';
    document.body.appendChild(this.arenaIndicator);
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Connect button
    this.connectButton.addEventListener('click', () => {
      const playerName = this.playerNameInput.value.trim();
      const serverAddress = this.serverAddressInput.value.trim();
      
      if (playerName && serverAddress) {
        this.connectToServer(playerName, serverAddress);
      }
    });
    
    // Disconnect button
    this.disconnectButton.addEventListener('click', () => {
      this.disconnectFromServer();
    });
    
    // Set up event callbacks for multiplayer manager
    if (this.multiplayerManager) {
      this.multiplayerManager.onConnectionSuccess = () => {
        this.handleConnectionSuccess();
      };
      
      this.multiplayerManager.onConnectionError = (error: string) => {
        this.handleConnectionError(error);
      };
      
      this.multiplayerManager.onGameStateChange = (state: GameState) => {
        this.updateUIFromGameState(state);
      };
      
      this.multiplayerManager.onPlayerJoin = (_data: any) => {
        this.updatePlayerList();
      };
      
      this.multiplayerManager.onPlayerLeave = (_data: any) => {
        this.updatePlayerList();
      };
      
      this.multiplayerManager.onGameOver = (winnerName: string) => {
        this.handleGameOver(winnerName);
      };
    }
  }
  
  /**
   * Add CSS styles for multiplayer UI
   */
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Using CSS variables for consistent color scheme */
      :root {
        --mp-primary-dark: #0a192f;
        --mp-primary-light: #172a46;
        --mp-accent-primary: #00bcd4;
        --mp-accent-secondary: #64ffda;
        --mp-text-light: #f5f5f5;
        --mp-text-dark: #121212;
        --mp-warning: #ff5252;
        --mp-success: #4caf50;
        --mp-neutral: #607d8b;
      }

      .multiplayer-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(23, 42, 70, 0.95);
        border: 2px solid var(--mp-accent-primary);
        box-shadow: 0 0 25px rgba(0, 188, 212, 0.5);
        border-radius: 8px;
        padding: 20px;
        width: 450px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1000;
        color: var(--mp-text-light);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      }
      
      .multiplayer-lobby h2 {
        color: var(--mp-accent-secondary);
        text-align: center;
        margin-top: 0;
        font-weight: 600;
      }
      
      .multiplayer-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .multiplayer-form label {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 14px;
        color: var(--mp-accent-secondary);
      }
      
      .multiplayer-form input {
        padding: 10px;
        border-radius: 4px;
        border: 1px solid var(--mp-accent-primary);
        background: rgba(0, 0, 0, 0.3);
        color: var(--mp-text-light);
        transition: border-color 0.2s;
      }
      
      .multiplayer-form input:focus {
        border-color: var(--mp-accent-secondary);
        outline: none;
        box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.25);
      }
      
      .multiplayer-form button {
        padding: 10px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
        font-size: 16px;
      }
      
      .connect-button {
        background: var(--mp-accent-primary);
        color: var(--mp-text-dark);
        border: none;
      }
      
      .connect-button:hover {
        background: var(--mp-accent-secondary);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 188, 212, 0.5);
      }
      
      .disconnect-button {
        background: var(--mp-warning);
        color: var(--mp-text-light);
        border: none;
      }
      
      .disconnect-button:hover {
        background: #ff7b7b;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(255, 82, 82, 0.5);
      }
      
      .multiplayer-description {
        background: rgba(23, 42, 70, 0.7);
        padding: 15px;
        border-radius: 8px;
        margin-top: 15px;
        border-left: 3px solid var(--mp-accent-primary);
      }
      
      .multiplayer-description h3 {
        color: var(--mp-accent-secondary);
        margin-top: 0;
        font-size: 18px;
      }
      
      .multiplayer-description ul {
        padding-left: 20px;
        list-style-type: square;
      }
      
      .multiplayer-description li {
        margin-bottom: 5px;
      }
      
      .multiplayer-status {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        background: rgba(23, 42, 70, 0.7);
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 15px;
        border-left: 3px solid var(--mp-accent-primary);
      }
      
      .countdown-display {
        font-size: 28px;
        font-weight: bold;
        color: var(--mp-accent-secondary);
        text-shadow: 0 0 10px rgba(100, 255, 218, 0.5);
      }
      
      .player-count {
        font-size: 14px;
        color: var(--mp-accent-primary);
      }
      
      .game-status {
        width: 100%;
        text-align: center;
        margin-top: 5px;
        font-weight: bold;
        padding: 5px 0;
        color: var(--mp-text-light);
      }
      
      .player-list-container {
        background: rgba(23, 42, 70, 0.7);
        padding: 15px;
        border-radius: 8px;
        border-left: 3px solid var(--mp-accent-primary);
      }
      
      .player-list-container h3 {
        color: var(--mp-accent-secondary);
        margin-top: 0;
        font-size: 18px;
      }
      
      .player-list {
        max-height: 200px;
        overflow-y: auto;
        padding-left: 0;
        list-style-type: none;
        margin-top: 10px;
      }
      
      .player-list li {
        padding: 8px 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        transition: background 0.2s;
      }
      
      .player-list li:hover {
        background: rgba(0, 0, 0, 0.2);
      }
      
      .player-list li:last-child {
        border-bottom: none;
      }
      
      .player-color-indicator {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 10px;
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
      }
      
      .player-status {
        margin-left: auto;
        font-size: 12px;
        padding: 3px 8px;
        border-radius: 12px;
        font-weight: 600;
      }
      
      .player-alive {
        background: var(--mp-success);
        color: var(--mp-text-light);
      }
      
      .player-dead {
        background: var(--mp-warning);
        color: var(--mp-text-light);
      }
      
      .player-spectating {
        background: var(--mp-neutral);
        color: var(--mp-text-light);
      }
      
      .arena-indicator {
        position: absolute;
        border: 2px solid rgba(255, 82, 82, 0.7);
        box-shadow: 0 0 15px rgba(255, 82, 82, 0.5);
        pointer-events: none;
        z-index: 10;
        border-radius: 4px;
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 0 15px rgba(255, 82, 82, 0.5); }
        50% { box-shadow: 0 0 25px rgba(255, 82, 82, 0.8); }
        100% { box-shadow: 0 0 15px rgba(255, 82, 82, 0.5); }
      }
      
      @media (max-width: 480px) {
        .multiplayer-container {
          width: 95%;
          padding: 15px;
        }
        
        .multiplayer-form input,
        .multiplayer-form button {
          padding: 12px 8px;
          font-size: 16px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Connect to the multiplayer server
   * @param playerName - The player's name
   * @param serverAddress - The server address
   */
  async connectToServer(playerName: string, serverAddress: string): Promise<void> {
    // Disable connect button during connection attempt
    this.connectButton.disabled = true;
    this.connectButton.textContent = 'Connecting...';
    
    // Set server address
    this.multiplayerManager.setServerAddress(serverAddress);
    
    // Attempt connection
    const success = await this.multiplayerManager.connect(playerName);
    
    // Re-enable button if failed
    if (!success) {
      this.connectButton.disabled = false;
      this.connectButton.textContent = 'Connect';
    }
  }
  
  /**
   * Handle successful connection to server
   */
  handleConnectionSuccess(): void {
    // Update UI
    this.connectButton.style.display = 'none';
    this.disconnectButton.style.display = 'block';
    this.playerNameInput.disabled = true;
    this.serverAddressInput.disabled = true;
    
    // Show game status
    this.gameStatusContainer.style.display = 'block';
    this.playerListContainer.style.display = 'block';
    
    // Update player list
    this.updatePlayerList();
    
    // Show arena indicator when game starts
    this.arenaIndicator.style.display = 'block';
  }
  
  /**
   * Handle connection error
   * @param error - The error message
   */
  handleConnectionError(error: string): void {
    // Show error message
    alert(`Connection error: ${error}`);
    
    // Reset UI
    this.connectButton.disabled = false;
    this.connectButton.textContent = 'Connect';
  }
  
  /**
   * Disconnect from the server
   */
  disconnectFromServer(): void {
    // Disconnect
    this.multiplayerManager.disconnect();
    
    // Update UI
    this.connectButton.style.display = 'block';
    this.disconnectButton.style.display = 'none';
    this.playerNameInput.disabled = false;
    this.serverAddressInput.disabled = false;
    
    // Hide arena indicator
    this.arenaIndicator.style.display = 'none';
  }
  
  /**
   * Update UI based on game state
   * @param state - The current game state
   */
  updateUIFromGameState(state: GameState): void {
    // Update player count
    const aliveCount = this.multiplayerManager.getAliveCount();
    const totalPlayers = this.multiplayerManager.getTotalPlayers();
    this.playerCountDisplay.textContent = `Players: ${aliveCount}/${totalPlayers} alive`;
    
    // Update game status
    const gameState = this.multiplayerManager.getGameState();
    let statusText = '';
    
    switch (gameState) {
      case GAME_CONSTANTS.STATE.WAITING:
        statusText = 'Waiting for players...';
        this.countdownDisplay.textContent = '';
        break;
        
      case GAME_CONSTANTS.STATE.STARTING:
        statusText = 'Game starting soon!';
        if (state.countdownTime !== undefined) {
          this.countdownDisplay.textContent = state.countdownTime.toString();
        }
        break;
        
      case GAME_CONSTANTS.STATE.PLAYING:
        statusText = 'Game in progress';
        this.countdownDisplay.textContent = '';
        this.updateArenaIndicator(state);
        break;
        
      case GAME_CONSTANTS.STATE.GAME_OVER:
        statusText = `Game over! ${state.winnerName} wins!`;
        this.countdownDisplay.textContent = '';
        break;
    }
    
    this.gameStatusDisplay.textContent = statusText;
    
    // Update player list to reflect current states
    this.updatePlayerList();
  }
  
  /**
   * Update the arena indicator
   * @param state - The current game state
   */
  updateArenaIndicator(state: GameState): void {
    if (!state || state.areaPercentage === undefined || state.areaPercentage >= 100) {
      this.arenaIndicator.style.display = 'none';
      return;
    }
    
    // Get canvas dimensions and position
    const canvas = document.querySelector('.game-canvas[data-canvas="primary"]') as HTMLCanvasElement;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate the shrinking arena
    const shrinkScale = state.areaPercentage / 100;
    const centerX = canvasRect.left + canvasRect.width / 2;
    const centerY = canvasRect.top + canvasRect.height / 2;
    
    // Size of the shrunk arena
    const arenaWidth = canvasRect.width * shrinkScale;
    const arenaHeight = canvasRect.height * shrinkScale;
    
    // Set indicator position
    this.arenaIndicator.style.left = `${centerX - arenaWidth / 2}px`;
    this.arenaIndicator.style.top = `${centerY - arenaHeight / 2}px`;
    this.arenaIndicator.style.width = `${arenaWidth}px`;
    this.arenaIndicator.style.height = `${arenaHeight}px`;
    
    // Ensure it's visible
    this.arenaIndicator.style.display = 'block';
    
    // Make it pulse when area is small
    if (state.areaPercentage < 60) {
      this.arenaIndicator.style.borderColor = 'rgba(255, 0, 0, 0.7)';
      this.arenaIndicator.style.animation = 'pulse 1s infinite';
    } else {
      this.arenaIndicator.style.borderColor = 'rgba(255, 0, 0, 0.5)';
      this.arenaIndicator.style.animation = 'none';
    }
  }
  
  /**
   * Update the player list
   */
  updatePlayerList(): void {
    // Clear existing list
    this.playerList.innerHTML = '';
    
    // Get players
    const players = this.multiplayerManager.players;
    if (!players) return;
    
    // Add player items
    for (const sessionId in players) {
      const player = players[sessionId];
      const isLocal = sessionId === this.multiplayerManager.localSessionId;
      
      // Create list item
      const item = document.createElement('li');
      
      // Add color indicator
      const colorIndicator = document.createElement('span');
      colorIndicator.className = 'player-color-indicator';
      colorIndicator.style.backgroundColor = this.multiplayerManager.getPlayerColor(player.playerIndex);
      item.appendChild(colorIndicator);
      
      // Add player name (with "You" indicator for local player)
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${player.name}${isLocal ? ' (You)' : ''}`;
      item.appendChild(nameSpan);
      
      // Add status indicator
      const statusSpan = document.createElement('span');
      statusSpan.className = 'player-status';
      
      switch (player.state) {
        case GAME_CONSTANTS.PLAYER_STATE.ALIVE:
          statusSpan.textContent = 'Alive';
          statusSpan.classList.add('player-alive');
          break;
          
        case GAME_CONSTANTS.PLAYER_STATE.DEAD:
          statusSpan.textContent = 'Eliminated';
          statusSpan.classList.add('player-dead');
          break;
          
        case GAME_CONSTANTS.PLAYER_STATE.SPECTATING:
          statusSpan.textContent = 'Spectating';
          statusSpan.classList.add('player-spectating');
          break;
      }
      
      item.appendChild(statusSpan);
      
      // Add to list
      this.playerList.appendChild(item);
    }
  }
  
  /**
   * Handle game over
   * @param winnerName - The name of the winner
   */
  handleGameOver(winnerName: string): void {
    // Update game status
    this.gameStatusDisplay.textContent = `Game over! ${winnerName} wins!`;
    
    // Add restart button if not exists
    if (!this.restartButton) {
      this.restartButton = document.createElement('button') as HTMLButtonElement;
      this.restartButton.textContent = 'Play Again';
      this.restartButton.className = 'connect-button';
      this.restartButton.addEventListener('click', () => {
        this.multiplayerManager.requestRestart();
      });
      this.gameStatusContainer.appendChild(this.restartButton);
    } else {
      this.restartButton.style.display = 'block';
    }
  }
  
  /**
   * Get the player name from the input field
   * @returns The player name
   */
  getPlayerName(): string {
    return this.playerNameInput.value.trim();
  }
  
  /**
   * Show connected state in the UI
   */
  showConnected(): void {
    this.handleConnectionSuccess();
  }
  
  /**
   * Update the player list and player count
   * @param players - The players object
   * @param totalPlayers - The total number of players
   */
  updatePlayerCount(_players?: Record<string, Player>, totalPlayers?: number): void {
    // Update players and total count if provided
    // if (players) {
    //   this._players = players; // Removed unused assignment
    // }
    
    if (totalPlayers) {
      this.playerCountDisplay.textContent = `Players: ${totalPlayers}`;
    }
    
    // Update the player list UI
    this.updatePlayerList();
  }
  
  /**
   * Update game state display
   * @param gameState - The current game state
   * @param players - The players object
   * @param totalPlayers - The total number of players
   * @param aliveCount - The number of alive players
   */
  updateGameState(gameState: string, _players?: Record<string, Player>, totalPlayers?: number, aliveCount?: number): void {
    // Update player count
    if (totalPlayers !== undefined && aliveCount !== undefined) {
      this.playerCountDisplay.textContent = `Players: ${aliveCount}/${totalPlayers} alive`;
    }
    
    // Update game status
    let statusText = '';
    
    switch (gameState) {
      case GAME_CONSTANTS.STATE.WAITING:
        statusText = 'Waiting for players...';
        this.countdownDisplay.textContent = '';
        break;
        
      case GAME_CONSTANTS.STATE.STARTING:
        statusText = 'Game starting soon!';
        break;
        
      case GAME_CONSTANTS.STATE.PLAYING:
        statusText = 'Game in progress';
        this.countdownDisplay.textContent = '';
        break;
        
      case GAME_CONSTANTS.STATE.GAME_OVER:
        statusText = 'Game over!';
        this.countdownDisplay.textContent = '';
        break;
    }
    
    this.gameStatusDisplay.textContent = statusText;
    
    // Update player list
    this.updatePlayerList();
  }
  
  /**
   * Update the countdown display
   * @param countdownTime - The countdown time in seconds
   */
  updateCountdown(countdownTime?: number): void {
    if (countdownTime !== undefined) {
      this.countdownDisplay.textContent = countdownTime.toString();
    } else {
      this.countdownDisplay.textContent = '';
    }
  }
  
  /**
   * Show game over UI
   * @param winnerName - The name of the winner
   * @param resetCallback - The callback to reset the game
   */
  showGameOver(winnerName: string, resetCallback: () => void): void {
    // Update game status
    this.gameStatusDisplay.textContent = `Game over! ${winnerName} wins!`;
    
    // Add restart button if not exists
    if (!this.restartButton) {
      this.restartButton = document.createElement('button') as HTMLButtonElement;
      this.restartButton.textContent = 'Play Again';
      this.restartButton.className = 'connect-button';
      this.restartButton.addEventListener('click', resetCallback);
      this.gameStatusContainer.appendChild(this.restartButton);
    } else {
      this.restartButton.style.display = 'block';
    }
  }
  
  /**
   * Hide game over UI
   */
  hideGameOver(): void {
    if (this.restartButton) {
      this.restartButton.style.display = 'none';
    }
  }
  
  /**
   * Show the multiplayer UI
   */
  show(): void {
    this.multiplayerContainer.style.display = 'block';
    this.isVisible = true;
  }
  
  /**
   * Hide the multiplayer UI
   */
  hide(): void {
    this.multiplayerContainer.style.display = 'none';
    this.isVisible = false;
    
    // Also hide arena indicator
    if (this.arenaIndicator) {
      this.arenaIndicator.style.display = 'none';
    }
  }
  
  /**
   * Toggle the multiplayer UI visibility
   * @returns The new visibility state
   */
  toggle(): boolean {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
    return this.isVisible;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Remove event listeners from buttons
    if (this.connectButton) {
      this.connectButton.replaceWith(this.connectButton.cloneNode(true));
    }
    
    if (this.disconnectButton) {
      this.disconnectButton.replaceWith(this.disconnectButton.cloneNode(true));
    }
    
    if (this.restartButton) {
      this.restartButton.replaceWith(this.restartButton.cloneNode(true));
    }
    
    // Remove UI elements from DOM if they exist
    if (this.multiplayerContainer && this.multiplayerContainer.parentNode) {
      this.multiplayerContainer.parentNode.removeChild(this.multiplayerContainer);
    }
    
    if (this.arenaIndicator && this.arenaIndicator.parentNode) {
      this.arenaIndicator.parentNode.removeChild(this.arenaIndicator);
    }
  }
}
