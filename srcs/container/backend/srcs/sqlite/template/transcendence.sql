-- SQLite Database Schema
-- Converted from MariaDB/MySQL
-- Database: transcendence

PRAGMA foreign_keys = ON;

--
-- Structure de la table `friends`
--

CREATE TABLE `friends` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_one_id` INTEGER NOT NULL,
  `user_two_id` INTEGER NOT NULL,
  `target` INTEGER DEFAULT NULL,
  `status` TEXT NOT NULL CHECK(length(status) <= 7),
  `groupe_priv_msg_id` INTEGER DEFAULT NULL,
  UNIQUE(`user_one_id`, `user_two_id`),
  UNIQUE(`groupe_priv_msg_id`),
  FOREIGN KEY (`user_one_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_two_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`target`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`groupe_priv_msg_id`) REFERENCES `groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

--
-- Structure de la table `groups`
--

CREATE TABLE `groups` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT CHECK(length(name) <= 25),
  `private` INTEGER NOT NULL DEFAULT 0 CHECK(private IN (0, 1))
);

--
-- Structure de la table `group_messages`
--

CREATE TABLE `group_messages` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `group_id` INTEGER NOT NULL,
  `sender_id` INTEGER DEFAULT NULL,
  `message` TEXT NOT NULL CHECK(length(message) <= 250),
  `sent_at` INTEGER NOT NULL,
  FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `group_users` (`user_id`) ON DELETE SET NULL
);

--
-- Structure de la table `group_users`
--

CREATE TABLE `group_users` (
  `group_id` INTEGER NOT NULL,
  `user_id` INTEGER NOT NULL,
  `owner` INTEGER NOT NULL DEFAULT 0 CHECK(owner IN (0, 1)),
  PRIMARY KEY (`group_id`, `user_id`),
  FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

--
-- Structure de la table `pacman_map`
--

CREATE TABLE `pacman_map` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` INTEGER NOT NULL,
  `name` TEXT NOT NULL CHECK(length(name) <= 20),
  `map` TEXT NOT NULL,
  `is_public` INTEGER NOT NULL,
  `is_valid` INTEGER NOT NULL,
  `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `email` TEXT NOT NULL UNIQUE CHECK(length(email) <= 50),
  `username` TEXT NOT NULL UNIQUE CHECK(length(username) <= 15),
  `password` TEXT CHECK(length(password) <= 100),
  `google_token` TEXT UNIQUE,
  `avatar` TEXT NOT NULL DEFAULT 'avatar1.png' CHECK(length(avatar) <= 100),
  `lang` TEXT NOT NULL DEFAULT 'fr' CHECK(length(lang) <= 2)
);

-- Index pour améliorer les performances
CREATE INDEX idx_friends_user_one ON friends(user_one_id);
CREATE INDEX idx_friends_user_two ON friends(user_two_id);
CREATE INDEX idx_friends_target ON friends(target);
CREATE INDEX idx_group_messages_group ON group_messages(group_id);
CREATE INDEX idx_group_messages_sender ON group_messages(sender_id);
CREATE INDEX idx_group_users_user ON group_users(user_id);
CREATE INDEX idx_pacman_map_user ON pacman_map(user_id);
