import React, { useState, useEffect, useRef } from 'react';
import Pong from './client';

const GameLauncher: React.FC = () => {
  const [started, setStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflowX = 'hidden';
  }, []);

  const startGame = () => {
    if (!audioRef.current) {
      const audio = new Audio('/sounds/ironSong.mp3');
      audio.loop = true;
      audio.volume = 0.5;
      audioRef.current = audio;

      // ✅ Exposer globalement pour Pong
      (window as any).ironpongMusic = audio;
    }

    audioRef.current.play().catch((e) => console.warn("Autoplay bloqué :", e));
    setStarted(true);
  };

  return (
    <div
      style={{
        backgroundImage: 'url("/images/ironPage.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!started ? (
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1>Bienvenue dans IRONPONG !</h1>
          <button
            onClick={startGame}
            style={{ fontSize: '24px', padding: '10px 20px', marginRight: '10px' }}
          >
            Lancer le jeu
          </button>
        </div>
      ) : (
        <Pong />
      )}
    </div>
  );
};

export default GameLauncher;
