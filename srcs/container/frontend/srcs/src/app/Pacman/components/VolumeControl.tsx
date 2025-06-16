import React from 'react';
import { SoundManager } from '../utils/SoundManager';

export const VolumeControl: React.FC = () => {
    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const volume = parseFloat(event.target.value);
        SoundManager.getInstance().setVolume(volume);
    };

    return (
        <div className="flex items-center gap-2 p-2">
            <span className="text-white">🔈</span>
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="0.5"
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white">🔊</span>
        </div>
    );
};