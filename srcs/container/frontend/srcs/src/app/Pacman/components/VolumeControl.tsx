import React, { useState, useEffect } from 'react';
import { SoundManager } from '../utils/SoundManager';
import '../../assets/styles/pacman/CreatePacmanMap.scss';
import '../../assets/styles/pacman/VolumeControl.scss';


export const VolumeControl: React.FC = () => {
    const [volume, setVolume] = useState(0.5);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const soundManager = SoundManager.getInstance();

    useEffect(() => {
        setAudioEnabled(soundManager.isAudioEnabled());
        setVolume(soundManager.getVolume());
    }, [soundManager]);

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);
        soundManager.setVolume(newVolume);
    };

    const handleTestSound = async () => {
        if (!audioEnabled) {
            const success = await soundManager.enableAudio();
            setAudioEnabled(success);
        }
        if (audioEnabled || soundManager.isAudioEnabled()) {
            soundManager.playEating();
        }
    };

    return (
        <div className="volume-control" style={{'--volume-progress': `${volume * 100}%`} as React.CSSProperties}>
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-control__slider"
                title={`Volume: ${Math.round(volume * 100)}%`}
            />
            
            <span className="volume-control__volume-text">
                {Math.round(volume * 100)}%
            </span>
        </div>
    );
};