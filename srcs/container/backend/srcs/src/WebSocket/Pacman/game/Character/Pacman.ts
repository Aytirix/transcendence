import { player, room, GameState, vector2, CharacterType } from "@Pacman/TypesPacman";
import { WebSocket } from 'ws';
import Character from "./Character";


/**
 * Classe principale du moteur de jeu Pac-Man
 */
export default class Pacman extends Character {
	private static _speed = 3;

	constructor(player: player, position: vector2, nameChar: CharacterType) {
		super(player, position, nameChar);
	}

	public static get speed(): number { return this._speed; }
	public static set speed(value: number) { this._speed = value; }
}
