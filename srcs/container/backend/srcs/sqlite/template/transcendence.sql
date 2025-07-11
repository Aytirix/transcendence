PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;
-- Table friends
CREATE TABLE IF NOT EXISTS friends (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_one_id INTEGER NOT NULL,
	user_two_id INTEGER NOT NULL,
	target INTEGER,
	status TEXT NOT NULL,
	groupe_priv_msg_id INTEGER,
	UNIQUE(user_one_id, user_two_id),
	UNIQUE(groupe_priv_msg_id),
	FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (target) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (groupe_priv_msg_id) REFERENCES groups(id) ON DELETE
	SET NULL ON UPDATE CASCADE
);
-- Table groups
CREATE TABLE IF NOT EXISTS groups (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT,
	private INTEGER NOT NULL DEFAULT 0
);
-- Table group_messages
CREATE TABLE IF NOT EXISTS group_messages (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	group_id INTEGER NOT NULL,
	sender_id INTEGER,
	message TEXT NOT NULL,
	sent_at INTEGER NOT NULL,
	FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (sender_id) REFERENCES group_users(user_id) ON DELETE
	SET NULL
);
-- Table group_users
CREATE TABLE IF NOT EXISTS group_users (
	group_id INTEGER NOT NULL,
	user_id INTEGER NOT NULL,
	owner INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (group_id, user_id),
	FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
-- Table users
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL UNIQUE,
	username TEXT NOT NULL UNIQUE,
	password TEXT,
	google_token TEXT UNIQUE,
	avatar TEXT NOT NULL DEFAULT 'avatar1.png',
	lang TEXT NOT NULL DEFAULT 'fr',
	twofa INTEGER NOT NULL DEFAULT 0
);
-- Table pacman_map (avec contrainte UNIQUE et CHECK JSON)
CREATE TABLE IF NOT EXISTS pacman_map (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	name TEXT NOT NULL,
	map TEXT NOT NULL CHECK(json_valid(map)),
	is_public INTEGER NOT NULL,
	is_valid INTEGER NOT NULL,
	updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	UNIQUE(user_id, name),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
-- Table pacman_stat
CREATE TABLE IF NOT EXISTS pacman_stat (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	type TEXT NOT NULL,
	score INTEGER NOT NULL,
	death_count INTEGER NOT NULL,
	win INTEGER NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
-- Table pong_stat
-- is_tournament: 0 = multiplayer, 1 = tournament
-- status: 0 = loose, 1 = win, 2 = abandon
CREATE TABLE IF NOT EXISTS pong_stat (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	is_tournament INTEGER NOT NULL DEFAULT 0,       -- 0 = multijoueur, 1 = tournoi
	status INTEGER NOT NULL,                        -- 0 = défaite, 1 = victoire, 2 = abandon
	match_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- date et heure du match
	game_mode TEXT NOT NULL,                        -- 'solo', 'same_keyboard', 'online', 'tournament'
	opponent_id INTEGER NOT NULL,                   -- id de l'adversaire

	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table verification_codes
CREATE TABLE IF NOT EXISTS verification_codes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL UNIQUE,
	username TEXT,
	code TEXT NOT NULL UNIQUE,
	user_json TEXT,
	type TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
-- Table verification_codes
CREATE TABLE IF NOT EXISTS pong_invite (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	friend_id INTEGER NOT NULL,
	token TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	UNIQUE(user_id, friend_id)
);

CREATE TABLE queens_settings (
    user_id INTEGER PRIMARY KEY,
    board_size INTEGER NOT NULL DEFAULT 9,
    difficultyLevel INTEGER NOT NULL DEFAULT 5,
    autoCross INTEGER NOT NULL DEFAULT 0,
    view_tutorial INTEGER NOT NULL DEFAULT 0,
    game_state TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS queens_map_valid (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_size INTEGER NOT NULL,
    difficultyLevel INTEGER NOT NULL,
    regionAssignment TEXT NOT NULL CHECK (json_valid(regionAssignment)),
    solutionMapping TEXT NOT NULL CHECK (json_valid(solutionMapping)),
    UNIQUE(regionAssignment, solutionMapping)
);

CREATE INDEX IF NOT EXISTS idx_map_valid_difficultyLevel ON map_valid(difficultyLevel);

COMMIT;