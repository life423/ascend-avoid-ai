"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObstacleSchema = void 0;
const schema_1 = require("@colyseus/schema");
class ObstacleSchema extends schema_1.Schema {
    constructor(id = 0) {
        super();
        this.id = 0;
        this.x = 0;
        this.y = 0;
        this.type = "rectangle";
        this.speed = 2;
        this.width = 50;
        this.height = 30;
        this.isActive = true;
        this.id = id;
        this.isActive = true;
    }
    /**
     * Reset obstacle to a new position
     * @param canvasWidth - Width of the game canvas
     * @param canvasHeight - Height of the game canvas
     * @param playerPositions - Array of player positions to avoid
     */
    reset(canvasWidth, canvasHeight, playerPositions = []) {
        // Random width and height
        this.width = 30 + Math.random() * 30; // 30-60px
        this.height = 20 + Math.random() * 10; // 20-30px
        // Start from the top
        this.y = -this.height;
        // Random x position
        this.x = Math.random() * (canvasWidth - this.width);
        // Random speed
        this.speed = 2 + Math.random() * 3; // 2-5 speed
        this.isActive = true;
    }
    /**
     * Update obstacle position
     * @param deltaTime - Time since last update
     * @param canvasWidth - Width of the game canvas
     * @returns true if obstacle needs to be reset
     */
    update(deltaTime, canvasWidth) {
        if (!this.isActive)
            return false;
        // Move down
        this.y += this.speed;
        // Check if off screen (need reset)
        return this.y > 1000; // Reset when far off screen
    }
    /**
     * Check collision with player
     * @param player - Player object with x, y, width, height
     * @returns true if collision detected
     */
    checkCollision(player) {
        if (!this.isActive)
            return false;
        return (this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y);
    }
}
exports.ObstacleSchema = ObstacleSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], ObstacleSchema.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], ObstacleSchema.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], ObstacleSchema.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], ObstacleSchema.prototype, "type", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], ObstacleSchema.prototype, "speed", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], ObstacleSchema.prototype, "width", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], ObstacleSchema.prototype, "height", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], ObstacleSchema.prototype, "isActive", void 0);
//# sourceMappingURL=ObstacleSchema.js.map