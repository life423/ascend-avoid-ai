// Input handling for keyboard and touch
export class InputManager {
  constructor() {
    this.keys = {};
    this.setupKeyboard();
    this.setupTouch();
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  setupTouch() {
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const direction = btn.dataset.direction;
        this.keys[direction] = true;
      });
      
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        const direction = btn.dataset.direction;
        this.keys[direction] = false;
      });
    });
  }

  isPressed(key) {
    return this.keys[key] || false;
  }

  getMovement() {
    const movement = { x: 0, y: 0 };
    const speed = 3;

    if (this.isPressed('w') || this.isPressed('arrowup') || this.isPressed('up')) {
      movement.y = -speed;
    }
    if (this.isPressed('s') || this.isPressed('arrowdown') || this.isPressed('down')) {
      movement.y = speed;
    }
    if (this.isPressed('a') || this.isPressed('arrowleft') || this.isPressed('left')) {
      movement.x = -speed;
    }
    if (this.isPressed('d') || this.isPressed('arrowright') || this.isPressed('right')) {
      movement.x = speed;
    }

    return movement;
  }
}