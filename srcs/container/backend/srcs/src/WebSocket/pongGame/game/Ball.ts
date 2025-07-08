export class Ball {
	constructor (
		public pos_x: number,
		public pos_y: number,
		public d_x: number,
		public d_y: number,
		public speed: number = 9, //7 readonly
		public readonly radius: number = 8
	) {}
	move(): void{
		this.pos_x += this.d_x * this.speed;
		this.pos_y += this.d_y * this.speed;
		// console.log(`ball : X = ${this.pos_x}`);
		// console.log(`ball : Y = ${this.pos_y}`);
	}
}