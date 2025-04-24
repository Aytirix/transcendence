"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ball = void 0;
class Ball {
    constructor(pos_x, pos_y, d_x, d_y, speed = 7, radius = 4) {
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.d_x = d_x;
        this.d_y = d_y;
        this.speed = speed;
        this.radius = radius;
    }
    move() {
        this.pos_x += this.d_x * this.speed;
        this.pos_y += this.d_y * this.speed;
        console.log(`ball : X = ${this.pos_x}`);
        console.log(`ball : Y = ${this.pos_y}`);
    }
}
exports.Ball = Ball;
