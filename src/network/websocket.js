// WebSocket connection management
export class WebSocketManager {
  constructor() {
    this.ws = null;
    this.onMessage = null;
    this.onStatusChange = null;
  }

  connect() {
    const wsUrl = `ws://${window.location.hostname}:8080`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('Connected to server');
      if (this.onStatusChange) {
        this.onStatusChange('connected', 'Connected');
      }
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (this.onMessage) {
        this.onMessage(message);
      }
    };
    
    this.ws.onclose = () => {
      if (this.onStatusChange) {
        this.onStatusChange('connecting', 'Disconnected');
      }
      setTimeout(() => this.connect(), 2000);
    };
    
    this.ws.onerror = () => {
      if (this.onStatusChange) {
        this.onStatusChange('error', 'Connection error');
      }
    };
  }

  sendMove(x, y) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'move',
        x: Math.max(0, x),
        y: Math.max(0, y)
      }));
    }
  }

  setMessageHandler(handler) {
    this.onMessage = handler;
  }

  setStatusHandler(handler) {
    this.onStatusChange = handler;
  }
}