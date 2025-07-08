import React, { useCallback, useEffect, useRef, useState } from 'react';
import ApiService from '../../api/ApiService';
import notification from '../components/Notifications';
import MinecraftCompressWorker from './minecraftCompressWorker.ts?worker';
import { useLanguage } from '../../contexts/LanguageContext';


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
				// Créer l'object store avec le même keyPath qu'Eaglercraft
				if (!db.objectStoreNames.contains('filesystem')) {
					db.createObjectStore('filesystem', { keyPath: ['path'] });
				}
			};

			request.onsuccess = () => {
				const db = request.result;

				// Vérifier qu'il y a au moins un object store
				if (db.objectStoreNames.length === 0) {
					// Forcer la création de l'object store si nécessaire
					db.close();
					const upgradeRequest = indexedDB.open('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_resourcePacks', db.version + 1);
					upgradeRequest.onupgradeneeded = () => {
						const upgradeDb = upgradeRequest.result;
						if (!upgradeDb.objectStoreNames.contains('filesystem')) {
							upgradeDb.createObjectStore('filesystem', { keyPath: ['path'] });
						}
					};
					upgradeRequest.onsuccess = () => {
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
					resolve();
					return;
				}

				const transaction = db.transaction(db.objectStoreNames, 'readwrite');
				const store = transaction.objectStore(db.objectStoreNames[0]);

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
				// Créer l'object store avec le même keyPath qu'Eaglercraft
				if (!db.objectStoreNames.contains('filesystem')) {
					db.createObjectStore('filesystem', { keyPath: ['path'] });
				}
			};

			request.onsuccess = () => {
				const db = request.result;

				// Vérifier qu'il y a au moins un object store
				if (db.objectStoreNames.length === 0) {
					// Forcer la création de l'object store si nécessaire
					db.close();
					const upgradeRequest = indexedDB.open('_net_lax1dude_eaglercraft_v1_8_internal_PlatformFilesystem_1_8_8_worlds', db.version + 1);
					upgradeRequest.onupgradeneeded = () => {
						const upgradeDb = upgradeRequest.result;
						if (!upgradeDb.objectStoreNames.contains('filesystem')) {
							upgradeDb.createObjectStore('filesystem', { keyPath: ['path'] });
						}
					};
					upgradeRequest.onsuccess = () => {
						upgradeRequest.result.close();
						// Relancer le processus
						setWorlds(data).then(resolve).catch(reject);
					};
					upgradeRequest.onerror = () => {
						resolve();
					};
					return;
				}

				// Ne rien faire si on n'a pas de données à insérer
				if (!data || !Array.isArray(data) || data.length === 0) {
					resolve();
					return;
				}

				const transaction = db.transaction(db.objectStoreNames, 'readwrite');
				const store = transaction.objectStore(db.objectStoreNames[0]);

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
function compressMinecraftData(obj: any): Promise<string> {
	return new Promise((resolve, reject) => {
		const worker = new MinecraftCompressWorker();
		worker.onmessage = (e: MessageEvent) => {
			if (e.data.error) reject(e.data.error);
			else resolve(e.data.result);
			worker.terminate();
		};
		worker.postMessage({ type: 'compress', data: obj });
	});
}

function decompressMinecraftData(base64: string): Promise<any> {
	return new Promise((resolve, reject) => {
		const worker = new MinecraftCompressWorker();
		worker.onmessage = (e: MessageEvent) => {
			if (e.data.error) reject(e.data.error);
			else resolve(e.data.result);
			worker.terminate();
		};
		worker.postMessage({ type: 'decompress', data: base64 });
	});
}

export async function getMinecraftInfo() {
	ApiService.get('/getMinecraftUser').then(async (data) => {
		if (data.ok) {
			if (data) {
				let decompressed: any = {};
				try {
					if (data.compressed) decompressed = await decompressMinecraftData(data.compressed);
				} catch (e) {
					console.error('Erreur de décompression Minecraft:', e);
					return;
				}
				if (decompressed._eaglercraftX_g) localStorage.setItem('_eaglercraftX.g', decompressed._eaglercraftX_g);
				if (decompressed._eaglercraftX_p) localStorage.setItem('_eaglercraftX.p', decompressed._eaglercraftX_p);
				if (decompressed._eaglercraftX_r) localStorage.setItem('_eaglercraftX.r', decompressed._eaglercraftX_r);
				if (decompressed.lastMinecraftAccess) localStorage.setItem('lastMinecraftAccess', decompressed.lastMinecraftAccess.toString());
				if (decompressed.saveResourcePacks) localStorage.setItem('saveResourcePacks', decompressed.saveResourcePacks.toString());
				if (decompressed.saveWorlds) localStorage.setItem('saveWorlds', decompressed.saveWorlds.toString());
				try {
					const restoredResourcePacks = restoreDataFromAPI(decompressed.resourcePacks || []);
					const restoredWorlds = restoreDataFromAPI(decompressed.worlds || []);
					await setIndexedDBData(restoredResourcePacks, restoredWorlds);
				} catch (error) {
					console.error('Erreur lors du chargement des données IndexedDB:', error);
				}
			}
		}
	}).catch((error) => {
		console.error('Erreur lors du chargement minecraft:', error);
	});
}
/**
 * Récupère la taille totale (en Mo) des données Minecraft stockées localement.
 * Retourne un objet { localStorageMB, resourcePacksMB, worldsMB, totalMB }
 */
export async function getMinecraftStorageSizeMB(worldIsSave: boolean = true, rsIsSave: boolean = true): Promise<{ resourcePacksMB: number, worldsMB: number, totalMB: number }> {
	let indexedDBData = { resourcePacks: [], worlds: [] };
	try {
		indexedDBData = await getIndexedDBData();
	} catch (error) {
		console.warn('Impossible de récupérer les données IndexedDB:', error);
	}

	let resourcePacks: string;
	let worlds: string;
	try {
		resourcePacks = await compressMinecraftData(prepareDataForAPI(indexedDBData.resourcePacks));
		worlds = await compressMinecraftData(prepareDataForAPI(indexedDBData.worlds));
	} catch (e) {
		console.warn('Erreur lors de la compression Minecraft:', e);
		return {
			resourcePacksMB: -1,
			worldsMB: -1,
			totalMB: -1
		};
	}

	const resourcePacksSize = new Blob([resourcePacks]).size;
	const worldsSize = new Blob([worlds]).size;
	const resourcePacksMB = resourcePacksSize / (1024 * 1024);
	const worldsMB = worldsSize / (1024 * 1024);
	const totalMB = (worldIsSave ? worldsMB : 0) + (rsIsSave ? resourcePacksMB : 0);
	return {
		resourcePacksMB,
		worldsMB,
		totalMB
	};
}

// Lance la sauvegarde Minecraft en arrière-plan (non bloquant)
export function setMinecraftInfo(t: (key: string, options?: Record<string, string | number>) => string) {
	(async () => {
		let lastAccess = localStorage.getItem('lastMinecraftAccess');
		if (!lastAccess) lastAccess = '0';
		let indexedDBData = { resourcePacks: [], worlds: [] };
		try {
			indexedDBData = await getIndexedDBData();
		} catch (error) {
			console.warn('Impossible de récupérer les données IndexedDB:', error);
		}

		// Appliquer les préférences utilisateur
		const { saveResourcePacks, saveWorlds } = getMinecraftSavePreferences();
		const resourcePacks = saveResourcePacks ? prepareDataForAPI(indexedDBData.resourcePacks) : [];
		const worlds = saveWorlds ? prepareDataForAPI(indexedDBData.worlds) : [];

		const minecraftInfo = {
			_eaglercraftX_g: localStorage.getItem('_eaglercraftX.g'),
			_eaglercraftX_p: localStorage.getItem('_eaglercraftX.p'),
			_eaglercraftX_r: localStorage.getItem('_eaglercraftX.r'),
			saveResourcePacks,
			saveWorlds,
			lastMinecraftAccess: parseInt(lastAccess, 10) || 0,
			resourcePacks,
			worlds
		};

		let compressed: string;
		try {
			compressed = await compressMinecraftData(minecraftInfo);
		} catch (e) {
			console.warn('Erreur lors de la compression Minecraft:', e);
			return;
		}

		// Vérification taille avant envoi (10 Mo max)
		const compressedSize = new Blob([compressed]).size;
		if (compressedSize > 10 * 1024 * 1024) {
			notification.warn(t('minecraft.sizeLimitExceeded'),
				{
					autoClose: false,
					position: 'top-center',
					closeButton: true,
					icon: false,
					toastId: 'minecraft-save-limit',
					style: {
						backgroundColor: '#f87171',
						color: 'white',
						fontWeight: 'bold',
						zIndex: 1000,
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
				const result = await ApiService.post('/setMinecraftUser', { compressed });
				console.log('Résultat de la sauvegarde Minecraft:', result);
				if (!result.ok) {
					notification.error(t('minecraft.saveError'),
						{
							autoClose: 1000,
							position: 'top-center',
							closeButton: false,
							icon: false,
							toastId: 'minecraft-save-limit',
							style: {
								backgroundColor: '#f87171',
								color: 'white',
								fontWeight: 'bold',
								zIndex: 1000,
							}
						}
					);
				}
			} catch (error) {
				console.error('Erreur lors de la sauvegarde minecraft:', error);
			}
		}
	})();
}

export function getMinecraftSavePreferences() {
	const saveResourcePacks = localStorage.getItem('saveResourcePacks');
	const saveWorlds = localStorage.getItem('saveWorlds');
	return {
		saveResourcePacks: saveResourcePacks === null ? false : saveResourcePacks === 'true',
		saveWorlds: saveWorlds === null ? true : saveWorlds === 'true',
	};
}

export default function FullscreenMinecraftHandler({ children }: FullscreenMinecraftHandlerProps) {
	const { t } = useLanguage();
	const [showSettings, setShowSettings] = useState(false);
	const [saveResourcePacks, setSaveResourcePacks] = useState<boolean>(() => {
		const val = localStorage.getItem('saveResourcePacks');
		return val === null ? false : val === 'true';
	});
	const [saveWorlds, setSaveWorlds] = useState<boolean>(() => {
		const val = localStorage.getItem('saveWorlds');
		return val === null ? true : val === 'true';
	});
	const [storageInfo, setStorageInfo] = useState<{ resourcePacksMB: number, worldsMB: number, totalMB: number } | null>(null);

	// Référence pour l'iframe
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const settingsMenuRef = useRef<HTMLDivElement>(null);
	const settingsButtonRef = useRef<HTMLDivElement>(null);

	// Fonction pour redonner le focus à l'iframe
	const refocusMinecraft = useCallback(() => {
		setTimeout(() => {
			if (iframeRef.current) {
				iframeRef.current.focus();
				// Essayer aussi de cliquer dans l'iframe pour s'assurer qu'elle reçoit le focus
				const iframeDocument = iframeRef.current.contentDocument;
				if (iframeDocument && iframeDocument.body) {
					iframeDocument.body.click();
				}
			}
		}, 50);
	}, []);

	// Fonction pour fermer les paramètres et redonner le focus
	const handleCloseSettings = useCallback(() => {
		setShowSettings(false);
		refocusMinecraft();
	}, [refocusMinecraft]);

	// Gérer les clics en dehors du menu pour le fermer et redonner le focus
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (showSettings && settingsMenuRef.current && settingsButtonRef.current) {
				const target = event.target as Element;
				const isInsideMenu = settingsMenuRef.current.contains(target);
				const isInsideButton = settingsButtonRef.current.contains(target);

				if (!isInsideMenu && !isInsideButton) {
					handleCloseSettings();
				}
			}
		};

		if (showSettings) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showSettings, handleCloseSettings]);

	// Gérer la touche Escape pour fermer le menu
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (showSettings && event.key === 'Escape') {
				event.preventDefault();
				handleCloseSettings();
			}
		};

		if (showSettings) {
			document.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [showSettings, handleCloseSettings]);

	// Redonner le focus après chaque changement de paramètres
	const handleResourcePacksChange = useCallback((checked: boolean) => {
		setSaveResourcePacks(checked);
		refocusMinecraft();
	}, [refocusMinecraft]);

	const handleWorldsChange = useCallback((checked: boolean) => {
		setSaveWorlds(checked);
		refocusMinecraft();
	}, [refocusMinecraft]);

	// Sauvegarde dans localStorage à chaque changement
	useEffect(() => {
		localStorage.setItem('saveResourcePacks', saveResourcePacks.toString());
	}, [saveResourcePacks]);

	useEffect(() => {
		localStorage.setItem('saveWorlds', saveWorlds.toString());
	}, [saveWorlds]);

	// Charger la taille du stockage à l'ouverture ou lors d'un changement de préférence
	useEffect(() => {
		getMinecraftStorageSizeMB(saveWorlds, saveResourcePacks).then(setStorageInfo);
	}, [saveResourcePacks, saveWorlds]);

	// Engrenage avec gestion du focus
	const settingsButton = (
		<div
			ref={settingsButtonRef}
			style={{
				position: 'fixed',
				top: 16,
				right: 16,
				zIndex: 2000,
				cursor: 'pointer',
				background: 'rgba(34,197,94,0.85)',
				borderRadius: '50%',
				width: 40,
				height: 40,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
			}}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setShowSettings(v => !v);
				if (!showSettings) {
					// Si on ouvre le menu, garder le focus sur l'iframe en arrière-plan
					refocusMinecraft();
				}
			}}
			onMouseDown={(e) => {
				// Empêcher la perte de focus lors du mousedown
				e.preventDefault();
			}}
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
				<path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.43-2.06l1.77-1.02a1 1 0 0 0 .37-1.36l-1.67-2.89a1 1 0 0 0-1.28-.45l-1.77 1.02a7.03 7.03 0 0 0-1.52-.88l-.27-2A1 1 0 0 0 13 4h-2a1 1 0 0 0-1 .86l-.27 2a7.03 7.03 0 0 0-1.52.88l-1.77-1.02a1 1 0 0 0-1.28.45l-1.67 2.89a1 1 0 0 0 .37 1.36l1.77 1.02c-.06.32-.1.65-.1.99s.04.67.1.99l-1.77 1.02a1 1 0 0 0-.37 1.36l1.67 2.89a1 1 0 0 0 1.28.45l1.77-1.02c.47.34.98.63 1.52.88l.27 2A1 1 0 0 0 11 20h2a1 1 0 0 0 1-.86l.27-2c.54-.25 1.05-.54 1.52-.88l1.77 1.02a1 1 0 0 0 1.28-.45l1.67-2.89a1 1 0 0 0-.37-1.36l-1.77-1.02c.06-.32.1-.65.1-.99s-.04-.67-.1-.99z" fill="#fff" />
			</svg>
		</div>
	);

	const settingsMenu = showSettings && (
		<div
			ref={settingsMenuRef}
			style={{
				position: 'fixed',
				top: 64,
				right: 16,
				zIndex: 2100,
				background: '#222',
				color: '#fff',
				padding: '20px 24px',
				borderRadius: 12,
				boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
				minWidth: 260
			}}
			onMouseDown={(e) => {
				// Empêcher la propagation pour éviter la perte de focus
				e.stopPropagation();
			}}
		>
			<div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>{t('minecraft.settings')}</div>
			<label style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
				<input
					type="checkbox"
					checked={saveWorlds}
					onChange={e => handleWorldsChange(e.target.checked)}
					style={{ marginRight: 8 }}
					onMouseDown={(e) => e.stopPropagation()}
				/>
				{t('minecraft.saveWorlds')}
			</label>
			<label style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
				<input
					type="checkbox"
					checked={saveResourcePacks}
					onChange={e => handleResourcePacksChange(e.target.checked)}
					style={{ marginRight: 8 }}
					onMouseDown={(e) => e.stopPropagation()}
				/>
				{t('minecraft.saveResourcePacks')}
			</label>
			{storageInfo && (
				<div style={{ marginTop: 12, fontSize: 14 }}>
					<div style={{ color: saveWorlds && storageInfo.worldsMB > 10 ? '#ef4444' : '#a3e635' }}>
						{t('minecraft.soloWorldsSize')}: {storageInfo.worldsMB.toFixed(2)} Mo
					</div>
					<div style={{ color: saveResourcePacks && storageInfo.resourcePacksMB > 10 ? '#ef4444' : '#a3e635' }}>
						{t('minecraft.resourcePacksSize')}: {storageInfo.resourcePacksMB.toFixed(2)} Mo
					</div>
					<div style={{ color: (saveWorlds && storageInfo.worldsMB > 10) || (saveResourcePacks && storageInfo.resourcePacksMB > 10) ? '#ef4444' : '#a3e635' }}>
						{t('minecraft.totalSize')}: {storageInfo.totalMB.toFixed(2)} Mo / 10 Mo
					</div>
				</div>
			)}
			<button
				onClick={handleCloseSettings}
				onMouseDown={(e) => e.stopPropagation()}
				style={{
					marginTop: 10,
					background: '#22c55e',
					color: '#fff',
					border: 'none',
					borderRadius: 6,
					padding: '6px 16px',
					fontWeight: 'bold',
					cursor: 'pointer'
				}}
			>
				{t('minecraft.closeSettings')}
			</button>
		</div>
	);

	// Modifier les children pour ajouter la ref à l'iframe
	const childrenWithRef = React.Children.map(children, child => {
		if (React.isValidElement(child) && child.type === 'iframe') {
			return React.cloneElement(child as React.ReactElement<any>, {
				ref: iframeRef,
				onLoad: () => {
					// S'assurer que l'iframe a le focus au chargement
					refocusMinecraft();
				}
			});
		}
		return child;
	});

	return <>
		{settingsButton}
		{settingsMenu}
		{childrenWithRef}
	</>;
}