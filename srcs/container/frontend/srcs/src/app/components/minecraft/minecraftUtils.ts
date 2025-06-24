// Utilitaires pour la gestion de l'accès temporel à Minecraft

// Constante pour la durée d'attente en millisecondes (1 minute)
export const MINECRAFT_COOLDOWN = 60 * 1000;
export const LAST_MINECRAFT_ACCESS_KEY = 'lastMinecraftAccess';

export interface MinecraftAccessInfo {
	canAccess: boolean;
	remainingTime: number;
	remainingTimeFormatted: string;
}

/**
 * Vérifie si l'accès à Minecraft est autorisé
 */
export const canAccessMinecraft = (): boolean => {
	const lastAccess = localStorage.getItem(LAST_MINECRAFT_ACCESS_KEY);
	if (!lastAccess) return true;

	const lastAccessTime = parseInt(lastAccess, 10);
	const now = Date.now();
	return (now - lastAccessTime) >= MINECRAFT_COOLDOWN;
};

/**
 * Enregistre l'accès à Minecraft
 */
export const recordMinecraftAccess = (): void => {
	localStorage.setItem(LAST_MINECRAFT_ACCESS_KEY, Date.now().toString());
};

/**
 * Vérifie si l'accès permet d'accéder à la route
 */
export const hasRecentAccess = (): boolean => {
	const lastAccess = localStorage.getItem(LAST_MINECRAFT_ACCESS_KEY);
	if (!lastAccess) return false;

	const now = Date.now();
	return (now - parseInt(lastAccess, 10)) <= 5000;
};
