// Status UI management
export class StatusManager {
  constructor(statusElementId) {
    this.statusElement = document.getElementById(statusElementId);
  }

  updateStatus(className, message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = `status ${className}`;
    }
  }

  setConnected(playerId) {
    this.updateStatus('connected', `Connected as ${playerId.slice(0, 6)}`);
  }

  setConnecting() {
    this.updateStatus('connecting', 'Connecting...');
  }

  setError(message = 'Connection error') {
    this.updateStatus('error', message);
  }
}