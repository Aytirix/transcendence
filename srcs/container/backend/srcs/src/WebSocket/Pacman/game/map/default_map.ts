import { map, TileType } from "@Pacman/TypesPacman";
import Pacman from "../Character/Pacman";
import { TILE_SIZE } from "../Engine";

export const defaultMap: map = {
	id: -1,
	user_id: -1,
	name: "Default map",
	map: [
		"##############T##############".split('') as unknown as TileType[],
		"#............# #............#".split('') as unknown as TileType[],
		"#.####.#####.# #.#####.####.#".split('') as unknown as TileType[],
		"#o####.#####.# #.#####.####o#".split('') as unknown as TileType[],
		"#.####.#####.# #.#####.####.#".split('') as unknown as TileType[],
		"#...........................#".split('') as unknown as TileType[],
		"#.####.##.#########.##.####.#".split('') as unknown as TileType[],
		"#.####.##.#########.##.####.#".split('') as unknown as TileType[],
		"#......##....###....##......#".split('') as unknown as TileType[],
		"######.##### ### #####.######".split('') as unknown as TileType[],
		"     #.##### ### #####.#     ".split('') as unknown as TileType[],
		"     #.##     B     ##.#     ".split('') as unknown as TileType[],
		"     #.## ###---### ##.#     ".split('') as unknown as TileType[],
		"######.## # I C Y # ##.######".split('') as unknown as TileType[],
		"T     .   #       #   .     T".split('') as unknown as TileType[],
		"######.## #       # ##.######".split('') as unknown as TileType[],
		"     #.## ######### ##.#     ".split('') as unknown as TileType[],
		"     #.##           ##.#     ".split('') as unknown as TileType[],
		"     #.## ######### ##.#     ".split('') as unknown as TileType[],
		"######.## ######### ##.######".split('') as unknown as TileType[],
		"#o...........###...........o#".split('') as unknown as TileType[],
		"#.####.#####.###.#####.####.#".split('') as unknown as TileType[],
		"#.####.#####.###.#####.####.#".split('') as unknown as TileType[],
		"#...##........P........##...#".split('') as unknown as TileType[],
		"###.##.##.#########.##.##.###".split('') as unknown as TileType[],
		"###.##.##.#########.##.##.###".split('') as unknown as TileType[],
		"#......##....###....##......#".split('') as unknown as TileType[],
		"#.##########.###.##########.#".split('') as unknown as TileType[],
		"#.##########.###.##########.#".split('') as unknown as TileType[],
		"#o.........................o#".split('') as unknown as TileType[],
		"##############T##############".split('') as unknown as TileType[],
	],
	is_public: true,
	is_valid: true,
	updated_at: new Date(2025, 0, 6, 0, 0, 0),
	created_at: new Date(2025, 0, 6, 0, 0, 0)
};

export default defaultMap;