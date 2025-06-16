import path from 'path';
import fs from 'fs';
import mysql, { Connection } from 'mysql2';
import sqlite3 from 'sqlite3';
require('dotenv').config();

let db: sqlite3.Database = null;

async function createDbFile(): Promise<sqlite3.Database> {
	const templateDataseFile = path.join(__dirname, '..', '..', 'sqlite', 'template', 'transcendence.sql');
	const dbFilePath = path.join(__dirname, '..', '..', 'sqlite', 'transcendence.sqlite');

	// Vérifier si le fichier de base de données existe
	const dbExists = fs.existsSync(dbFilePath);

	return new Promise<sqlite3.Database>((resolve, reject) => {
		if (!dbExists) {
			console.log("Le fichier de base de données n'existe pas, création à partir du template...");
		}

		// Créer ou ouvrir la base de données
		db = new sqlite3.Database(dbFilePath, (err: Error | null) => {
			if (err) {
				console.error("Erreur lors de l'ouverture/création de la base de données SQLite:", err);
				console.log("Tentative de recréation à partir du template...");

				// Supprimer le fichier corrompu s'il existe
				if (fs.existsSync(dbFilePath)) {
					try {
						fs.unlinkSync(dbFilePath);
					} catch (unlinkErr) {
						console.error("Erreur lors de la suppression du fichier corrompu:", unlinkErr);
					}
				}

				// Créer une nouvelle base de données
				db = new sqlite3.Database(dbFilePath, (createErr: Error | null) => {
					if (createErr) {
						console.error("Erreur lors de la création de la nouvelle base de données:", createErr);
						reject(createErr);
						return;
					}
					initializeDatabase(templateDataseFile, resolve, reject);
				});
			} else {
				if (!dbExists) {
					// Base créée avec succès, initialiser avec le template
					initializeDatabase(templateDataseFile, resolve, reject);
				} else {
					console.log("Base de données SQLite ouverte avec succès.");
					resolve(db);
				}
			}
		});
	});

	function initializeDatabase(templateFile: string, resolve: Function, reject: Function) {
		// Lire le fichier template
		fs.readFile(templateFile, 'utf8', (readErr: Error | null, sqlData: string) => {
			if (readErr) {
				console.error("Erreur lors de la lecture du fichier template:", readErr);
				reject(readErr);
				return;
			}

			// Exécuter les commandes SQL du template
			db.exec(sqlData, (execErr: Error | null) => {
				if (execErr) {
					console.error("Erreur lors de l'exécution du script SQL template:", execErr);
					fs.unlink(dbFilePath, (unlinkErr: Error | null) => {
						if (unlinkErr) {
							console.error("Erreur lors de la suppression du fichier de base de données corrompu:", unlinkErr);
						}
					});
					reject(execErr);
				} else {
					console.log("Base de données SQLite initialisée avec succès à partir du template.");
					resolve(db);
				}
			});
		});
	}
}

/**
 * Exécute une requête SQL sur la base de données.
 *
 * @param req - La requête SQL à exécuter sous forme de chaîne de caractères.
 * @param data - Un tableau de chaînes de caractères représentant les données à injecter dans la requête SQL (par défaut vide).
 * @returns Une promesse qui se résout avec les résultats de la requête ou se rejette avec un message d'erreur SQL.
 *
 * @throws Une erreur si la connexion à la base de données échoue ou si la requête SQL échoue.
 *
 * @remarks
 * Cette fonction établit une connexion à la base de données, exécute la requête SQL, puis ferme la connexion, même en cas d'erreur.
 */
async function executeReq(req: string, data: Array<string | number> = []) {
	if (!db) {
		try {
			db = await createDbFile();
		} catch (error) {
			console.error('Erreur lors de la création de la base de données:', error);
			throw error;
		}
	}
	return new Promise(async (resolve, reject) => {
		try {
			if (req.startsWith('SELECT')) {
				db.all(req, data, (err: Error | null, results: unknown) => {
					if (err) {
						reject(err.message);
					} else {
						resolve(results);
					}
				});
			} else {
				db.run(req, data, function(err: Error | null) {
					if (err) {
						reject(err.message);
					} else {
						console.log(`this lastID: ${JSON.stringify(this)}`);
						const result = {
							affectedRows: this.changes,
							insertId: this.lastID
						};
						resolve(result);
					}
				});
			}
		} catch (error) {
			console.error('Database connection error:', error);
			reject(error);
		}
	});
}

export { executeReq };
export default executeReq;