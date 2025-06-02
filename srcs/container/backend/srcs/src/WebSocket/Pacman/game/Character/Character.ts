// Engine.ts
import { player, room, GameState, vector2, CharacterType } from "@Pacman/TypesPacman";
import { WebSocket } from 'ws';

export const TILE_SIZE = 50;

export default class Character {

	public nameChar: CharacterType;
	public player: player;
	public position: vector2;
	public direction: vector2;
	public nextDirection: vector2;
	public score: number;
	public teleport: boolean;
	public spawnTarget: vector2 | null = null;

	constructor(player: player, position: vector2, spawnTarget: vector2, nameChar: CharacterType) {
		this.player = player;
		this.direction = { x: 0, y: 0 };
		this.nextDirection = { x: 0, y: 0 };
		this.position = position;
		this.nameChar = nameChar;
		this.score = 0;
		this.teleport = false;
		this.spawnTarget = spawnTarget;
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
			if (directionVector) this.nextDirection = directionVector;
		}
	}

	public reverseDirection(): void {
		this.direction.x = -this.direction.x;
		this.direction.y = -this.direction.y;
	}

	public directionToString(): string {
		if (this.direction.x === 0 && this.direction.y === -1) return 'UP';
		if (this.direction.x === 0 && this.direction.y === 1) return 'DOWN';
		if (this.direction.x === -1 && this.direction.y === 0) return 'LEFT';
		if (this.direction.x === 1 && this.direction.y === 0) return 'RIGHT';
		return '';
	}

	/** Convertit une position pixel (centre du sprite) en coordonnées grille. */
	public pixelToGrid(pixelPos: vector2): vector2 {
		return {
			x: Math.round(Math.floor(pixelPos.x / TILE_SIZE)),
			y: Math.round(Math.floor(pixelPos.y / TILE_SIZE)),
		};
	}
}