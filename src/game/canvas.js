// Canvas management and rendering
export class CanvasManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();
  }

  setupCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPlayer(player, id) {
    this.ctx.fillStyle = player.color;
    this.ctx.fillRect(player.x, player.y, 20, 20);
    
    // Draw player ID
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px system-ui';
    this.ctx.fillText(id.slice(0, 6), player.x, player.y - 5);
  }

  getCanvas() {
    return this.canvas;
  }

  getContext() {
    return this.ctx;
  }
}