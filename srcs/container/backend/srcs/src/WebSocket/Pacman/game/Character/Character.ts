// Engine.ts
import { player, room, GameState, vector2, CharacterType } from "@Pacman/TypesPacman";
import { WebSocket } from 'ws';

export default class Character {

	public nameChar: string;
	public player: player;
	public position: vector2;
	public direction: vector2;
	public nextDirection: vector2;
	public score: number;

	constructor(player: player, position: vector2, nameChar: CharacterType) {
		this.player = player;
		this.direction = { x: 0, y: 0 };
		this.nextDirection = { x: 0, y: 0 };
		this.position = position;
		this.nameChar = nameChar;
		this.score = 0;
	}

	public changeDirection(direction: string): void {
		if (this.player) {
			let directionVector: vector2 | null = null;
			switch (direction) {
				case 'UP':
					directionVector = { x: 0, y: -1 };
					break;
				case 'DOWN':
					directionVector = { x: 0, y: 1 };
					break;
				case 'LEFT':
					directionVector = { x: -1, y: 0 };
					break;
				case 'RIGHT':
					directionVector = { x: 1, y: 0 };
					break;
			}
			if (directionVector) {
				this.nextDirection = directionVector;
				
				// const currentGridPos = this.pixelToGrid(player.position);

				// const nextGridPos = {
				// 	x: currentGridPos.x + directionVector.x,
				// 	y: currentGridPos.y + directionVector.y
				// };

				// // Vérifier si la case suivante est marchable
				// const isWalkable = this.map.isWalkable(nextGridPos);

				// if (isWalkable) {
				// 	player.direction = directionVector;
			}
		}
	}
}