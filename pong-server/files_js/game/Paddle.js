"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paddle = void 0;
class Paddle {
    constructor(pos_x, //20
    pos_y, // 250
    userName, height = 100, width = 10, margin = 10, speed = 10, score = 0) {
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.userName = userName;
        this.height = height;
        this.width = width;
        this.margin = margin;
        this.speed = speed;
        this.score = score;
    }
    move() {
    }
    isCollidingWithBall(ball) {
        const ball_x = ball.pos_x + (ball.pos_x > 400 ? ball.radius : -ball.radius);
        const ball_y_top = ball.pos_y + ball.radius;
        const ball_y_bottom = ball.pos_y - ball.radius;
        const xCollision = this.pos_x < 400 ? ball_x <= this.pos_x : ball_x >= this.pos_x;
        return xCollision
            && ball_y_top >= this.pos_y
            && ball_y_bottom <= this.pos_y + this.height;
    }
    zoneEffect(ball) {
        const y = ball.pos_y - this.pos_y;
        console.log(`POSITION POUR EFFECT BALL ${ball.pos_y}`);
        if (y < 0)
            ball.d_y = -1.5;
        else if (y == 0)
            ball.d_y = -1.25;
        else if (y <= 20)
            ball.d_y = -1;
        else if (y <= 40)
            ball.d_y = -0.5;
        else if (y <= 60)
            ball.d_y = 0;
        else if (y <= 80)
            ball.d_y = 0.5;
        else if (y < 100)
            ball.d_y = 1;
        else if (y == 100)
            ball.d_y = 1.25;
        else
            ball.d_y = 1.5;
        console.log(`EFFECT SUR BALL ------ ${ball.d_y}`);
    }
    setScore() {
        this.score += 1;
    }
    setUsername() { return (this.userName); }
    getScore() { return (this.score); }
}
exports.Paddle = Paddle;
