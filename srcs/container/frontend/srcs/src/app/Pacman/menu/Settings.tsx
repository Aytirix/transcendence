import React, { useState } from 'react';
import VolumeSlider from './VolumeSlider';

const Settings: React.FC = () => {
  const [volume, setVolume] = useState(50); // valeur par défaut

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // éventuellement : sauvegarder dans localStorage ou le contexte
  };

  return (
    <div>
      <h2>Paramètres de l'user</h2>
      <VolumeSlider volume={volume} onVolumeChange={handleVolumeChange} />

	  	<div className="settings-option">
			<label htmlFor='changeKeyboard'>Changer les touches</label>
			<input type='text' id='changeKeyboard' placeholder='Touche' />
		</div>
    </div>
  );
};

export default Settings;
