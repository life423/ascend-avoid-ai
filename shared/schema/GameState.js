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
exports.GameState = void 0;
const schema_1 = require("@colyseus/schema");
const PlayerSchema_1 = require("./PlayerSchema");
const ObstacleSchema_1 = require("./ObstacleSchema");
class GameState extends schema_1.Schema {
    constructor() {
        super();
        // Game state properties
        this.gameState = "waiting";
        this.elapsedTime = 0;
        this.startTime = 0;
        this.countdownTime = 5;
        // Arena settings
        this.arenaWidth = 1200;
        this.arenaHeight = 800;
        this.areaPercentage = 100;
        this.nextShrinkTime = 0;
        // Collections for players and obstacles
        this.players = new schema_1.MapSchema();
        this.obstacles = new schema_1.ArraySchema();
        // Game statistics
        this.aliveCount = 0;
        this.totalPlayers = 0;
        this.winnerName = "";
        // Last update time for delta calculations
        this.lastUpdateTime = Date.now();
        this.lastUpdateTime = Date.now();
    }
}
exports.GameState = GameState;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], GameState.prototype, "gameState", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "elapsedTime", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "startTime", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "countdownTime", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "arenaWidth", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "arenaHeight", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "areaPercentage", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "nextShrinkTime", void 0);
__decorate([
    (0, schema_1.type)({ map: PlayerSchema_1.PlayerSchema }),
    __metadata("design:type", Object)
], GameState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)([ObstacleSchema_1.ObstacleSchema]),
    __metadata("design:type", Object)
], GameState.prototype, "obstacles", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "aliveCount", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "totalPlayers", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], GameState.prototype, "winnerName", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "lastUpdateTime", void 0);
//# sourceMappingURL=GameState.js.map