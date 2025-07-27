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
exports.PlayerSchema = void 0;
const schema_1 = require("@colyseus/schema");
class PlayerSchema extends schema_1.Schema {
    constructor(sessionId = "", playerIndex = 0) {
        super();
        this.sessionId = "";
        this.playerIndex = 0;
        this.name = "";
        this.x = 0;
        this.y = 0;
        this.width = 30;
        this.height = 30;
        this.state = "alive";
        this.score = 0;
        this.upKey = false;
        this.downKey = false;
        this.leftKey = false;
        this.rightKey = false;
        this.lastUpdateTime = 0;
        this.sessionId = sessionId;
        this.playerIndex = playerIndex;
        this.name = `Player ${playerIndex + 1}`;
        this.lastUpdateTime = Date.now();
    }
    /**
     * Reset player position for a new game
     * @param canvasWidth - Width of the game canvas
     * @param canvasHeight - Height of the game canvas
     * @param playerIndex - Optional: player index for spawn distribution
     * @param totalPlayers - Optional: total players for spawn distribution
     */
    resetPosition(canvasWidth, canvasHeight, playerIndex, totalPlayers) {
        // If we have player index info, distribute players evenly across the bottom
        if (playerIndex !== undefined && totalPlayers !== undefined && totalPlayers > 0) {
            // Divide the width into sections based on number of players
            const sectionWidth = canvasWidth / (totalPlayers + 1);
            this.x = sectionWidth * (playerIndex + 1) - (this.width / 2);
            // Ensure x is within bounds
            this.x = Math.max(10, Math.min(this.x, canvasWidth - this.width - 10));
            // Add slight randomness to prevent exact overlap if players have same index
            this.x += (Math.random() - 0.5) * 20;
        }
        else {
            // Fallback to random position
            this.x = 10 + Math.random() * (canvasWidth - this.width - 20);
        }
        // Keep Y at bottom but add slight variation to make overlaps visible
        this.y = canvasHeight - this.height - 10 - (Math.random() * 30);
        this.state = "alive";
    }
    /**
     * Update player movement based on input
     * @param deltaTime - Time since last update in seconds
     * @param canvasWidth - Width of the game canvas
     * @param canvasHeight - Height of the game canvas
     */
    updateMovement(_deltaTime, canvasWidth, canvasHeight) {
        if (this.state !== "alive")
            return;
        // Calculate movement step
        const moveX = 5; // BASE_SPEED
        const moveY = 5; // BASE_SPEED
        // Apply movement based on keys
        if (this.upKey && this.y > 40) { // WINNING_LINE
            this.y -= moveY;
        }
        if (this.downKey && this.y + this.height < canvasHeight - 10) {
            this.y += moveY;
        }
        if (this.leftKey && this.x > 5) {
            this.x -= moveX;
        }
        if (this.rightKey && this.x + this.width < canvasWidth - 5) {
            this.x += moveX;
        }
    }
    /**
     * Mark player as dead
     */
    markAsDead() {
        this.state = "dead";
    }
    /**
     * Convert to spectator
     */
    becomeSpectator() {
        this.state = "spectating";
    }
}
exports.PlayerSchema = PlayerSchema;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], PlayerSchema.prototype, "sessionId", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PlayerSchema.prototype, "playerIndex", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], PlayerSchema.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PlayerSchema.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PlayerSchema.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PlayerSchema.prototype, "width", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PlayerSchema.prototype, "height", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], PlayerSchema.prototype, "state", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PlayerSchema.prototype, "score", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], PlayerSchema.prototype, "upKey", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], PlayerSchema.prototype, "downKey", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], PlayerSchema.prototype, "leftKey", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], PlayerSchema.prototype, "rightKey", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PlayerSchema.prototype, "lastUpdateTime", void 0);
//# sourceMappingURL=PlayerSchema.js.map