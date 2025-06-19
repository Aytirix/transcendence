import React, { useState, useEffect } from 'react';
import { SoundManager } from '../utils/SoundManager';

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

    const toggleMute = () => {
        if (volume > 0) {
            soundManager.setVolume(0);
            setVolume(0);
        } else {
            soundManager.setVolume(0.5);
            setVolume(0.5);
        }
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-black/50 rounded-lg backdrop-blur-sm">
            <button 
                onClick={toggleMute}
                className="text-white hover:text-yellow-400 transition-colors"
                title={volume === 0 ? 'Unmute' : 'Mute'}
            >
                {volume === 0 ? '🔇' : volume < 0.5 ? '🔈' : '🔊'}
            </button>
            
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                title={`Volume: ${Math.round(volume * 100)}%`}
            />
            
            <span className="text-white text-sm min-w-[3rem]">
                {Math.round(volume * 100)}%
            </span>
            
            <button
                onClick={handleTestSound}
                className="text-white hover:text-yellow-400 transition-colors text-sm px-2 py-1 border border-gray-600 rounded"
                title="Test sound"
            >
                Test
            </button>
            
            {!audioEnabled && (
                <span className="text-red-400 text-xs">
                    Click to enable audio
                </span>
            )}
        </div>
    );
};