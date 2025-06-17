import chompSound from '../../assets/sounds/munch.wav';
import deathSound from '../../assets/sounds/death.wav';
import ghostEatSound from '../../assets/sounds/eatghost.wav';
import powerUpSound from '../../assets/sounds/powerpellet.wav';
import startSound from '../../assets/sounds/beginning.wav';

export class SoundManager {
    private static instance: SoundManager;
    private volume: number = 0.5;
    private currentlyPlaying: { [key: string]: boolean } = {};
    private audioEnabled: boolean = false;
    private sounds: { [key: string]: HTMLAudioElement } = {
        chomp: new Audio(chompSound),
        death: new Audio(deathSound),
        ghostEat: new Audio(ghostEatSound),
        powerUp: new Audio(powerUpSound ),
        start: new Audio(startSound)
    };

    private constructor() {
        Object.entries(this.sounds).forEach(([name, sound]) => {
            sound.volume = this.volume;
            this.currentlyPlaying[name] = false;
            
            sound.addEventListener('ended', () => {
                this.currentlyPlaying[name] = false;
            });
        });
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    public setVolume(volume: number): void {
        this.volume = volume;
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
    }

    public play(soundName: keyof typeof this.sounds): void {
        const sound = this.sounds[soundName];
        if (sound && !this.currentlyPlaying[soundName]) {
            this.currentlyPlaying[soundName] = true;
            sound.currentTime = 0;
            sound.volume = this.volume * 0.8;
            
            sound.play()
                .catch(error => {
                    if (error.name === 'NotAllowedError') {
                        console.warn('Audio playback blocked by browser. User interaction required.');
                        this.audioEnabled = false;
                    } else {
                        console.error('Error playing sound:', error);
                    }
                    this.currentlyPlaying[soundName] = false;
                });
        }
    }

    public forcePlay(soundName: keyof typeof this.sounds): void {
        const sound = this.sounds[soundName];
        if (sound) {
            // Arrêter le son s'il est en cours de lecture
            if (this.currentlyPlaying[soundName]) {
                sound.pause();
                sound.currentTime = 0;
            }
            
            this.currentlyPlaying[soundName] = true;
            sound.volume = this.volume * 0.8;
            
            sound.play()
                .catch(error => {
                    console.error('Error force playing sound:', error);
                    this.currentlyPlaying[soundName] = false;
                });
        }
    }

    public async enableAudio(): Promise<void> {
        try {
            const silentSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2b4Oy3dywGGGq39e6KMgkZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2b4Oy3dywGGGq39e6KMgkZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2b4Oy3dywGGGq39e6KMgkZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz2b4Oy3dywGGGq39e6KMgk=');
            silentSound.volume = 0;
            await silentSound.play();
            this.audioEnabled = true;
            console.log('Audio enabled successfully');
        } catch (error) {
            console.warn('Could not enable audio:', error);
            this.audioEnabled = false;
        }
    }

    public isAudioEnabled(): boolean {
        return this.audioEnabled;
    }
}