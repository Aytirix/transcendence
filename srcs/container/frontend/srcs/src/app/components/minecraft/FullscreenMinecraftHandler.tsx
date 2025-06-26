import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { recordMinecraftAccess, canAccessMinecraft } from './minecraftUtils';
import ApiService from '../../../api/ApiService';
import pako from 'pako';
import notification from '../Notifications';

interface FullscreenMinecraftHandlerProps {
	children: React.ReactNode;
}

export const hashMinecraftData = (data: any): string => {
	const jsonString = JSON.stringify(data);
	return btoa(jsonString);
}

// Fonction pour convertir un ArrayBuffer en base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

// Fonction pour convertir une string base64 en ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

// Fonction pour préparer les données pour l'API (convertir ArrayBuffer en base64)
function prepareDataForAPI(data: any[]): any[] {
	return data.map(item => {
		if (item.value && item.value.data instanceof ArrayBuffer) {
			return {
				...item,
				value: {
					...item.value,
					data: arrayBufferToBase64(item.value.data)
				}
			};
		}
		return item;
	});
}

// Fonction pour restaurer les données depuis l'API (convertir base64 en ArrayBuffer)
function restoreDataFromAPI(data: any[]): any[] {
	if (!Array.isArray(data)) return [];

	return data.map(item => {
		if (item.value && item.value.data && typeof item.value.data === 'string') {
			try {
				console.log('Décodage base64 → ArrayBuffer pour:', {
					key: item.key,
					dataLength: item.value.data.length,
					hasOtherProps: Object.keys(item.value).filter(k => k !== 'data').length > 0
				});
				return {
					...item,
					value: {
						...item.value,
						data: base64ToArrayBuffer(item.value.data)
					}
				};
			} catch (error) {
				console.warn('Erreur lors de la conversion base64 vers ArrayBuffer:', error);
				return item;
			}
		}
		return item;
	});
}

// Fonction pour attendre que les bases de données Eaglercraft soient créées
async function waitForEaglercraftDBs(maxRetries = 10, delay = 2000): Promise<boolean> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			const [resourcePacksExists, worldsExists] = await Promise.all([
				checkDBExists('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_resourcePacks'),
				checkDBExists('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_worlds')
			]);

			if (resourcePacksExists && worldsExists) {
				console.log('Bases de données Eaglercraft détectées !');
				return true;
			}

			console.log(`Tentative ${i + 1}/${maxRetries}: Bases de données Eaglercraft pas encore créées, attente...`);
			await new Promise(resolve => setTimeout(resolve, delay));
		} catch (error) {
			console.log(`Erreur lors de la vérification DB (tentative ${i + 1}):`, error);
		}
	}

	console.warn('Timeout: Bases de données Eaglercraft non détectées après', maxRetries, 'tentatives');
	return false;
}

// Fonction pour vérifier si une base de données IndexedDB existe et a des object stores
function checkDBExists(dbName: string): Promise<boolean> {
	return new Promise((resolve) => {
		const request = indexedDB.open(dbName);

		request.onerror = () => resolve(false);

		request.onsuccess = () => {
			const db = request.result;
			const hasStores = db.objectStoreNames.length > 0;
			db.close();
			resolve(hasStores);
		};

		request.onupgradeneeded = () => {
			// Si on arrive ici, la DB n'existe pas encore
			request.result.close();
			resolve(false);
		};
	});
}
export async function getIndexedDBData(): Promise<{ resourcePacks: any, worlds: any }> {
	const getResourcePacks = (): Promise<any> => {
		return new Promise((resolve) => {
			const request = indexedDB.open('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_resourcePacks');

			request.onerror = () => resolve([]); // Si la DB n'existe pas, retourner un tableau vide

			request.onsuccess = () => {
				const db = request.result;
				try {
					const transaction = db.transaction(db.objectStoreNames, 'readonly');
					const store = transaction.objectStore(db.objectStoreNames[0]);

					// Utiliser un curseur pour récupérer clés et valeurs
					const results: any[] = [];
					const cursorRequest = store.openCursor();

					cursorRequest.onsuccess = () => {
						const cursor = cursorRequest.result;
						if (cursor) {
							results.push({
								key: cursor.key,
								value: cursor.value
							});
							cursor.continue();
						} else {
							resolve(results);
						}
					};

					cursorRequest.onerror = () => resolve([]);
				} catch (error) {
					resolve([]);
				}
			};
		});
	};

	const getWorlds = (): Promise<any> => {
		return new Promise((resolve) => {
			const request = indexedDB.open('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_worlds');

			request.onerror = () => resolve([]); // Si la DB n'existe pas, retourner un tableau vide

			request.onsuccess = () => {
				const db = request.result;
				try {
					const transaction = db.transaction(db.objectStoreNames, 'readonly');
					const store = transaction.objectStore(db.objectStoreNames[0]);

					// Utiliser un curseur pour récupérer clés et valeurs
					const results: any[] = [];
					const cursorRequest = store.openCursor();

					cursorRequest.onsuccess = () => {
						const cursor = cursorRequest.result;
						if (cursor) {
							results.push({
								key: cursor.key,
								value: cursor.value
							});
							cursor.continue();
						} else {
							// Fin du curseur
							resolve(results);
						}
					};

					cursorRequest.onerror = () => resolve([]);
				} catch (error) {
					resolve([]);
				}
			};
		});
	};

	try {
		const [resourcePacks, worlds] = await Promise.all([getResourcePacks(), getWorlds()]);
		return { resourcePacks, worlds };
	} catch (error) {
		return { resourcePacks: [], worlds: [] };
	}
}

// Fonction pour charger les données dans IndexedDB d'Eaglercraft
export async function setIndexedDBData(resourcePacks: any, worlds: any): Promise<void> {
	const setResourcePacks = (data: any): Promise<void> => {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_resourcePacks');

			request.onerror = () => reject(request.error);

			request.onupgradeneeded = () => {
				const db = request.result;
				console.log('Upgrading resourcePacks DB, existing stores:', Array.from(db.objectStoreNames));
				// Créer l'object store avec le même keyPath qu'Eaglercraft
				if (!db.objectStoreNames.contains('filesystem')) {
					console.log('Création de l\'object store filesystem avec keyPath');
					db.createObjectStore('filesystem', { keyPath: ['path'] });
				}
			};

			request.onsuccess = () => {
				const db = request.result;
				console.log('ResourcePacks DB opened, available stores:', Array.from(db.objectStoreNames));

				// Vérifier qu'il y a au moins un object store
				if (db.objectStoreNames.length === 0) {
					console.log('Aucun object store trouvé dans la DB resourcePacks, création manuelle');
					// Forcer la création de l'object store si nécessaire
					db.close();
					const upgradeRequest = indexedDB.open('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_resourcePacks', db.version + 1);
					upgradeRequest.onupgradeneeded = () => {
						const upgradeDb = upgradeRequest.result;
						if (!upgradeDb.objectStoreNames.contains('filesystem')) {
							upgradeDb.createObjectStore('filesystem', { keyPath: ['path'] });
							console.log('Object store filesystem créé manuellement avec keyPath');
						}
					};
					upgradeRequest.onsuccess = () => {
						console.log('Base de données resourcePacks mise à niveau, nouvelle tentative...');
						upgradeRequest.result.close();
						// Relancer le processus
						setResourcePacks(data).then(resolve).catch(reject);
					};
					upgradeRequest.onerror = () => {
						console.error('Erreur lors de la mise à niveau forcée');
						resolve();
					};
					return;
				}

				// Ne rien faire si on n'a pas de données à insérer
				if (!data || !Array.isArray(data) || data.length === 0) {
					console.log('Aucune donnée ResourcePacks à restaurer, laisser Eaglercraft gérer');
					resolve();
					return;
				}

				const transaction = db.transaction(db.objectStoreNames, 'readwrite');
				const store = transaction.objectStore(db.objectStoreNames[0]);

				console.log('Utilisation de l\'object store:', db.objectStoreNames[0]);

				// Vider le store existant SEULEMENT si on a des données à insérer
				store.clear();

				// Ajouter les nouvelles données avec clés et valeurs
				if (data && Array.isArray(data)) {
					// Détecter le type de clés de l'object store
					const usesOutOfLineKeys = store.keyPath === null;

					data.forEach((pack: any) => {
						try {
							if (pack.key !== undefined && pack.value !== undefined) {
								if (usesOutOfLineKeys) {
									// Object store avec clés out-of-line : fournir la clé comme paramètre
									store.put(pack.value, Array.isArray(pack.key) ? pack.key : [pack.key]);
								} else {
									// Object store avec clés in-line (keyPath: ['path'])
									// S'assurer que l'objet a la propriété 'path' définie par le keyPath
									const keyArr = Array.isArray(pack.key) ? pack.key : [pack.key];
									const objectWithPath = {
										...pack.value,
										path: keyArr[0] // path doit être une string
									};
									store.put(objectWithPath);
								}
							} else {
								// Fallback pour compatibilité
								if (usesOutOfLineKeys) {
									store.put(pack, data.indexOf(pack));
								} else {
									store.put(pack);
								}
							}
						} catch (error) {
							console.error('Erreur lors de l\'insertion du pack:', error, pack);
							console.error('Clé type:', typeof pack.key, 'Clé value:', pack.key);
							// Essayer sans la clé si ça échoue
							try {
								store.put(pack.value || pack);
							} catch (secondError) {
								console.error('Erreur même sans clé:', secondError);
							}
						}
					});
				}

				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			};
		});
	};

	const setWorlds = (data: any): Promise<void> => {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_worlds');

			request.onerror = () => reject(request.error);

			request.onupgradeneeded = () => {
				const db = request.result;
				console.log('Upgrading worlds DB, existing stores:', Array.from(db.objectStoreNames));
				// Créer l'object store avec le même keyPath qu'Eaglercraft
				if (!db.objectStoreNames.contains('filesystem')) {
					console.log('Création de l\'object store filesystem avec keyPath');
					db.createObjectStore('filesystem', { keyPath: ['path'] });
				}
			};

			request.onsuccess = () => {
				const db = request.result;
				console.log('Worlds DB opened, available stores:', Array.from(db.objectStoreNames));

				// Vérifier qu'il y a au moins un object store
				if (db.objectStoreNames.length === 0) {
					console.log('Aucun object store trouvé dans la DB worlds, création manuelle');
					// Forcer la création de l'object store si nécessaire
					db.close();
					const upgradeRequest = indexedDB.open('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_worlds', db.version + 1);
					upgradeRequest.onupgradeneeded = () => {
						const upgradeDb = upgradeRequest.result;
						if (!upgradeDb.objectStoreNames.contains('filesystem')) {
							upgradeDb.createObjectStore('filesystem', { keyPath: ['path'] });
							console.log('Object store filesystem créé manuellement avec keyPath');
						}
					};
					upgradeRequest.onsuccess = () => {
						console.log('Base de données worlds mise à niveau, nouvelle tentative...');
						upgradeRequest.result.close();
						// Relancer le processus
						setWorlds(data).then(resolve).catch(reject);
					};
					upgradeRequest.onerror = () => {
						console.error('Erreur lors de la mise à niveau forcée');
						resolve();
					};
					return;
				}

				// Ne rien faire si on n'a pas de données à insérer
				if (!data || !Array.isArray(data) || data.length === 0) {
					console.log('Aucune donnée Worlds à restaurer, laisser Eaglercraft gérer');
					resolve();
					return;
				}

				const transaction = db.transaction(db.objectStoreNames, 'readwrite');
				const store = transaction.objectStore(db.objectStoreNames[0]);

				console.log('Utilisation de l\'object store:', db.objectStoreNames[0]);

				// Vider le store existant SEULEMENT si on a des données à insérer
				store.clear();

				// Ajouter les nouvelles données
				if (data && Array.isArray(data)) {
					// Détecter le type de clés de l'object store
					const usesOutOfLineKeys = store.keyPath === null;

					data.forEach((world: any) => {
						try {
							if (world.key !== undefined && world.value !== undefined) {
								if (usesOutOfLineKeys) {
									// Object store avec clés out-of-line : fournir la clé comme paramètre
									store.put(world.value, Array.isArray(world.key) ? world.key : [world.key]);
								} else {
									const keyArr = Array.isArray(world.key) ? world.key : [world.key];
									const objectWithPath = {
										...world.value,
										path: keyArr[0]
									};
									store.put(objectWithPath);
								}
							} else {
								// Fallback pour compatibilité
								if (usesOutOfLineKeys) {
									store.put(world, data.indexOf(world));
								} else {
									store.put(world);
								}
							}
						} catch (error) {
							console.error('Erreur lors de l\'insertion du world:', error, world);
							console.error('Clé type:', typeof world.key, 'Clé value:', world.key);
							// Essayer sans la clé si ça échoue
							try {
								if (usesOutOfLineKeys) {
									// Pour out-of-line, essayer avec un index généré
									store.put(world.value || world, Date.now() + Math.random());
								} else {
									store.put(world.value || world);
								}
							} catch (secondError) {
								console.error('Erreur même sans clé:', secondError);
							}
						}
					});
				}

				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			};
		});
	};

	try {
		await Promise.all([setResourcePacks(resourcePacks), setWorlds(worlds)]);
	} catch (error) {
		throw error;
	}
}

// Helpers compression/décompression deflate (pako)
function compressMinecraftData(obj: any): string {
	const json = JSON.stringify(obj);
	const compressed = pako.deflate(json);
	// Conversion chunkée pour éviter stack overflow
	let binary = '';
	const chunkSize = 0x8000; // 32k
	for (let i = 0; i < compressed.length; i += chunkSize) {
		binary += String.fromCharCode.apply(null, compressed.subarray(i, i + chunkSize) as any);
	}
	return btoa(binary);
}

function decompressMinecraftData(base64: string): any {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	const decompressed = pako.inflate(bytes, { to: 'string' });
	return JSON.parse(decompressed);
}

export async function getMinecraftInfo() {
	ApiService.get('/getMinecraftUser').then(async (data) => {
		if (data.ok) {
			if (data && data.compressed) {
				let decompressed;
				try {
					decompressed = decompressMinecraftData(data.compressed);
				} catch (e) {
					console.error('Erreur décompression Minecraft:', e);
					return;
				}
				localStorage.setItem('_eaglercraftX.g', decompressed._eaglercraftX_g);
				localStorage.setItem('_eaglercraftX.p', decompressed._eaglercraftX_p);
				localStorage.setItem('_eaglercraftX.r', decompressed._eaglercraftX_r);
				localStorage.setItem('lastMinecraftAccess', decompressed.lastMinecraftAccess.toString());
				try {
					const restoredResourcePacks = restoreDataFromAPI(decompressed.resourcePacks || []);
					const restoredWorlds = restoreDataFromAPI(decompressed.worlds || []);
					await setIndexedDBData(restoredResourcePacks, restoredWorlds);
					console.log('Données IndexedDB chargées avec succès');
				} catch (error) {
					console.error('Erreur lors du chargement des données IndexedDB:', error);
				}
			}
		}
	}).catch((error) => {
		console.error('Erreur lors du chargement minecraft:', error);
	});
}

export async function setMinecraftInfo() {
	let lastAccess = localStorage.getItem('lastMinecraftAccess');
	if (!lastAccess) lastAccess = '0';
	let indexedDBData = { resourcePacks: [], worlds: [] };
	try {
		indexedDBData = await getIndexedDBData();
	} catch (error) {
		console.warn('Impossible de récupérer les données IndexedDB:', error);
	}
	const minecraftInfo = {
		_eaglercraftX_g: localStorage.getItem('_eaglercraftX.g'),
		_eaglercraftX_p: localStorage.getItem('_eaglercraftX.p'),
		_eaglercraftX_r: localStorage.getItem('_eaglercraftX.r'),
		lastMinecraftAccess: parseInt(lastAccess, 10) || 0,
		resourcePacks: prepareDataForAPI(indexedDBData.resourcePacks),
		worlds: prepareDataForAPI(indexedDBData.worlds)
	};

	let compressed: string;
	try {
		compressed = compressMinecraftData(minecraftInfo);
	} catch (e) {
		console.warn('Erreur lors de la compression Minecraft:', e);
		return;
	}

	// Vérification taille avant envoi (10 Mo max)
	const compressedSize = new Blob([compressed]).size;
	if (compressedSize > 10 * 1024 * 1024 || 1 == 1) {
		notification.warn("⚠️ LIMITE DEPASSER ⚠️\nLa sauvegarde Minecraft dépasse la limite de 10 Mo.\nVeuillez réduire la taille des packs de ressources ou des mondes en solo.",
			{
				autoClose: false,
				position: 'top-center',
				closeButton: true,
				icon: false,
				toastId: 'minecraft-save-limit',
				style: {
					backgroundColor: '#f87171', // Rouge moins agressif
					color: 'white',
					fontWeight: 'bold',
				}
			}
		);
		console.error('La sauvegarde Minecraft dépasse la limite de 10 Mo (', (compressedSize / (1024 * 1024)).toFixed(2), 'Mo )');
		return;
	}

	if (
		minecraftInfo._eaglercraftX_g &&
		minecraftInfo._eaglercraftX_p &&
		minecraftInfo._eaglercraftX_r &&
		minecraftInfo.lastMinecraftAccess
	) {
		try {
			await ApiService.post('/setMinecraftUser', { compressed });
		} catch (error) {
			console.error('Erreur lors de la sauvegarde minecraft:', error);
		}
	}
}

export default function FullscreenMinecraftHandler({ children }: FullscreenMinecraftHandlerProps) {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.key === 'F4') {
				// Vérifier si on est sur la page d'accueil ou minecraft
				const currentPath = location.pathname;
				if (currentPath === '/') {
					e.preventDefault();

					// Vérifier la limitation temporelle
					const canAccess = canAccessMinecraft();
					if (!canAccess) {
						return;
					}
					// Enregistrer l'accès
					recordMinecraftAccess();

					// if (!document.fullscreenElement) {
					// 	document.documentElement.requestFullscreen().catch((err) => {
					// 		console.warn('Impossible de passer en plein écran:', err);
					// 	});
					// }
					navigate('/minecraft');
				} else if (currentPath === '/minecraft') {
					e.preventDefault();
					// if (document.fullscreenElement) {
					// 	document.exitFullscreen().catch((err) => {
					// 		console.warn('Impossible de sortir du plein écran:', err);
					// 	});
					// }
					navigate('/');
				}
			}
		};

		// Ajouter l'écouteur d'événement sur window ET sur document
		// pour capturer les événements même depuis les iframes
		window.addEventListener('keydown', handleKeyDown, true); // capture phase
		document.addEventListener('keydown', handleKeyDown, true);

		// Écouter également les messages depuis l'iframe minecraft
		const handleMessage = (event: MessageEvent) => {
			if (!event.data) return;
			if (event.data.type === 'minecraft-f4') {
				// enlever le plein écran et aller à l'accueil
				const syntheticEvent = new KeyboardEvent('keydown', { key: 'F4' });
				handleKeyDown(syntheticEvent);
			}
		};


		window.addEventListener('message', handleMessage);

		// Nettoyer les écouteurs lors du démontage
		return () => {
			window.removeEventListener('keydown', handleKeyDown, true);
			document.removeEventListener('keydown', handleKeyDown, true);
			window.removeEventListener('message', handleMessage);
		};
	}, [navigate, location]);

	return <>{children}</>;
}
