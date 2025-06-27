// Use public directory paths instead of imports for better compatibility
export class SoundManager {
    private static instance: SoundManager;
    private volume: number = 0.5;
    private currentlyPlaying: { [key: string]: boolean } = {};
    private audioEnabled: boolean = false;
    private sounds: { [key: string]: HTMLAudioElement } = {};
    private audioContext: AudioContext | null = null;
    private backgroundSounds: { [key: string]: HTMLAudioElement } = {};

    private constructor() {
        this.initializeSounds();
    }

    private initializeSounds() {
        // Try to use ES6 imports for better compatibility, fall back to public paths
        const soundFiles = {
            // Core game sounds - using both import and public directory paths
            die: '/sounds/die.mp3',
            eating: '/sounds/eating.mp3',
            eatPill: '/sounds/eat-pill.mp3',
            eatGhost: '/sounds/eat-ghost.mp3',
            eatFruit: '/sounds/eat-fruit.mp3',
            ghostEaten: '/sounds/ghost-eaten.mp3',
            extraLife: '/sounds/extra-life.mp3',
            ready: '/sounds/ready.mp3',
            waza: '/sounds/waza.mp3',
            
            // Background/ambient sounds
          //  siren: '/sounds/siren.mp3'
        };

        Object.entries(soundFiles).forEach(([name, src]) => {
            
			const audio = new Audio();
			audio.preload = 'metadata';
			audio.volume = this.volume;
			audio.crossOrigin = 'anonymous'; // Add CORS support
			
			// Special handling for background sounds
			if (name === 'siren') {
				audio.loop = true;
				this.backgroundSounds[name] = audio;
			} else {
				audio.loop = false;
			}
			
			// Add event listeners
			audio.addEventListener('ended', () => {
				this.currentlyPlaying[name] = false;
			});
			
			// Set source after event listeners
			audio.src = src;
			
			this.sounds[name] = audio;
			this.currentlyPlaying[name] = false;
			
        });
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    public setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
        Object.values(this.backgroundSounds).forEach(sound => {
            sound.volume = this.volume * 0.3; // Background sounds quieter
        });
    }

    public getVolume(): number {
        return this.volume;
    }

    public async preloadSounds(): Promise<void> {
        const loadPromises = Object.entries(this.sounds).map(([name, audio]) => {
            return new Promise<void>((resolve) => {
                if (audio.readyState >= 2) {
                    resolve();
                    return;
                }
                
                const onLoad = () => {
                    audio.removeEventListener('canplaythrough', onLoad);
                    audio.removeEventListener('error', onError);
                    resolve();
                };
                
                const onError = (e: Event) => {
                    console.warn(`⚠️ Failed to preload sound ${name}:`, e);
                    audio.removeEventListener('canplaythrough', onLoad);
                    audio.removeEventListener('error', onError);
                    resolve(); // Don't fail the whole process
                };
                
                audio.addEventListener('canplaythrough', onLoad);
                audio.addEventListener('error', onError);
                audio.load();
            });
        });

        try {
            await Promise.allSettled(loadPromises);
            console.log('✅ Sound preloading completed');
        } catch (error) {
            console.warn('⚠️ Some sounds failed to preload:', error);
        }
    }

    public async enableAudio(): Promise<boolean> {
        try {
            console.log('🔊 Attempting to enable audio...');
            
            // Debug sound file accessibility first
            await this.debugSoundPaths();
            
            // Try to create AudioContext
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            // Resume AudioContext if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Preload all sounds
            await this.preloadSounds();

            // Test with a very short, quiet sound to verify audio works
            const testSound = this.sounds.eating;
            if (testSound && testSound.readyState >= 2) {
                const originalVolume = testSound.volume;
                testSound.volume = 0.01;
                try {
                    await testSound.play();
                    testSound.pause();
                    testSound.currentTime = 0;
                    testSound.volume = originalVolume;
                    console.log('🎵 Audio test successful');
                } catch (testError) {
                    console.warn('⚠️ Audio test failed but continuing:', testError);
                }
            }

            this.audioEnabled = true;
            console.log('✅ Audio enabled successfully');
            return true;
        } catch (error) {
            console.warn('⚠️ Could not enable audio:', error);
            this.audioEnabled = false;
            return false;
        }
    }

    // Play pellet eating sound
    public playEating(): void {
        if (!this.audioEnabled) return;
        this.play('eating');
    }

    // Play power pill sound
    public playPowerPill(): void {
        if (!this.audioEnabled) return;
        this.play('eatPill');
    }

    // Play ghost eaten sound
    public playGhostEaten(): void {
        if (!this.audioEnabled) return;
        this.forcePlay('eatGhost');
    }

    // Play death sound
    public playDeath(): void {
        if (!this.audioEnabled) return;
        this.stopBackgroundSounds();
        this.forcePlay('die');
    }

    // Play game start sound
    public playGameStart(): void {
        if (!this.audioEnabled) return;
        this.forcePlay('ready');
    }

    // Play fruit eating sound
    public playFruit(): void {
        if (!this.audioEnabled) return;
        this.play('eatFruit');
    }

    // Play extra life sound
    public playExtraLife(): void {
        if (!this.audioEnabled) return;
        this.forcePlay('extraLife');
    }

    // Play waza sound (power mode activation)
    public playWaza(): void {
        if (!this.audioEnabled) return;
        this.forcePlay('waza');
    }

    // Background siren sound
    public startSiren(): void {
        if (!this.audioEnabled) return;
        const siren = this.backgroundSounds.siren;
        if (siren && !this.currentlyPlaying.siren) {
            siren.volume = this.volume * 0.3;
            siren.currentTime = 0;
            this.currentlyPlaying.siren = true;
            siren.play().catch(error => {
                console.error('Error playing siren:', error);
                this.currentlyPlaying.siren = false;
            });
        }
    }

    public stopSiren(): void {
        const siren = this.backgroundSounds.siren;
        if (siren && this.currentlyPlaying.siren) {
            siren.pause();
            siren.currentTime = 0;
            this.currentlyPlaying.siren = false;
        }
    }

    private stopBackgroundSounds(): void {
        Object.keys(this.backgroundSounds).forEach(soundName => {
            this.stop(soundName as keyof typeof this.sounds);
        });
    }

    private play(soundName: keyof typeof this.sounds): void {
        if (!this.audioEnabled) {
            console.warn(`🔇 Audio not enabled, cannot play ${soundName}`);
            return;
        }

        const sound = this.sounds[soundName];
        if (!sound) {
            console.error(`❌ Sound ${soundName} not found`);
            return;
        }

        // Check if sound is loaded
        if (sound.readyState < 2) {
            console.warn(`⏳ Sound ${soundName} not ready (readyState: ${sound.readyState}), trying to load...`);
            sound.load();
            return;
        }

        // Allow multiple eating sounds to overlap but limit them
        if (soundName === 'eating') {
            if (this.currentlyPlaying[soundName]) {
                return; // Skip if already playing
            }
        }

        this.currentlyPlaying[soundName] = true;
        sound.currentTime = 0;
        sound.volume = this.volume;
        
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`🎵 Playing: ${soundName}`);
                })
                .catch(error => {
                    console.error(`❌ Error playing ${soundName}:`, error);
                    this.currentlyPlaying[soundName] = false;
                    
                    if (error.name === 'NotAllowedError') {
                        this.audioEnabled = false;
                        console.warn('🔇 Audio blocked by browser policy - user interaction required');
                    } else if (error.name === 'NotSupportedError') {
                        console.error(`🚫 Audio format not supported for ${soundName}`);
                    }
                });
        }
    }

    private forcePlay(soundName: keyof typeof this.sounds): void {
        if (!this.audioEnabled) {
            console.warn(`🔇 Audio not enabled, cannot force play ${soundName}`);
            return;
        }

        const sound = this.sounds[soundName];
        if (!sound) {
            console.error(`❌ Sound ${soundName} not found`);
            return;
        }

        // Check if sound is loaded
        if (sound.readyState < 2) {
            console.warn(`⏳ Sound ${soundName} not ready for force play (readyState: ${sound.readyState}), trying to load...`);
            sound.load();
            return;
        }

        // Stop current playback if any
        if (this.currentlyPlaying[soundName]) {
            sound.pause();
            sound.currentTime = 0;
        }
        
        this.currentlyPlaying[soundName] = true;
        sound.volume = this.volume;
        
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`🎵 Force playing: ${soundName}`);
                })
                .catch(error => {
                    console.error(`❌ Error force playing ${soundName}:`, error);
                    this.currentlyPlaying[soundName] = false;
                    
                    if (error.name === 'NotAllowedError') {
                        this.audioEnabled = false;
                        console.warn('🔇 Audio blocked by browser policy - user interaction required');
                    } else if (error.name === 'NotSupportedError') {
                        console.error(`🚫 Audio format not supported for ${soundName}`);
                    }
                });
        }
    }

    public stop(soundName: keyof typeof this.sounds): void {
        const sound = this.sounds[soundName];
        if (sound && this.currentlyPlaying[soundName]) {
            sound.pause();
            sound.currentTime = 0;
            this.currentlyPlaying[soundName] = false;
            console.log(`⏹️ Stopped: ${soundName}`);
        }
    }

    public stopAll(): void {
        Object.keys(this.sounds).forEach(soundName => {
            this.stop(soundName as keyof typeof this.sounds);
        });
        this.stopBackgroundSounds();
    }

    public isPlaying(soundName: keyof typeof this.sounds): boolean {
        return this.currentlyPlaying[soundName] || false;
    }

    public isAudioEnabled(): boolean {
        return this.audioEnabled;
    }

    public getAudioContext(): AudioContext | null {
        return this.audioContext;
    }

    public async debugSoundPaths(): Promise<void> {
        console.log('🔍 Debugging sound file accessibility...');
        const soundFiles = [
            '/sounds/die.mp3',
            '/sounds/eating.mp3',
            '/sounds/waza.mp3',
            '/sounds/siren.mp3'
        ];

        for (const soundPath of soundFiles) {
            try {
                const response = await fetch(soundPath, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`✅ Sound file accessible: ${soundPath}`);
                } else {
                    console.error(`❌ Sound file not accessible: ${soundPath} (Status: ${response.status})`);
                }
            } catch (error) {
                console.error(`❌ Error accessing sound file ${soundPath}:`, error);
            }
        }
    }
}