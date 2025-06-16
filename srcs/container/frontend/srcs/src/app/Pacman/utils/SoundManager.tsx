import chompSound from '../../assets/sounds/munch.wav';
import deathSound from '../../assets/sounds/death.wav';
import ghostEatSound from '../../assets/sounds/eatghost.wav';
import powerUpSound from '../../assets/sounds/powerpellet.wav';
import startSound from '../../assets/sounds/beginning.wav';

export class SoundManager {
    private static instance: SoundManager;
    private volume: number = 0.5;
    private currentlyPlaying: { [key: string]: boolean } = {};
    private sounds: { [key: string]: HTMLAudioElement } = {
        chomp: new Audio(chompSound),
        death: new Audio(deathSound),
        ghostEat: new Audio(ghostEatSound),
        powerUp: new Audio(powerUpSound),
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
            sound.play()
                .catch(error => {
                    console.error('Error playing sound:', error);
                    this.currentlyPlaying[soundName] = false;
                });
        }
    }
}
