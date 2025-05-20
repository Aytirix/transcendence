import { playerStat } from './types/playerStat';
import { Game } from './game/Game';
import { Ball } from './game/Ball';
import { Ai } from './game/pongAi/qLearning';
import { Paddle } from './game/Paddle';
import { join } from 'path';
import { writeFile } from 'fs';

//Pour compiler "npx tsc" // pour lancer l entrainement "node /dist/trainAi.js"

// Hyper-paramètres 
const INITIAL_ALPHA    = 0.2;     // learning rate de départ
const MIN_ALPHA        = 0.05;    // learning rate minimal
const INITIAL_EPSILON  = 0.5;     // exploration maximale au départ
const MIN_EPSILON      = 0.01;    // exploration minimale en fin d’apprentissage
const GAMMA            = 0.9;     // facteur de discount

const N_GAMES   = 5_000_000;     // 5 millions de parties d’entraînement
const WIN_SCORE = 23;             // score nécessaire pour gagner une partie

// Chemins vers les Q-tables
const pathQ1 = join(__dirname, '..', 'game', 'pongAi', 'fileJson', 'qLearning.json');
const pathQ2 = join(__dirname, '..', 'game', 'pongAi', 'fileJson', 'qLearning2.json');

// Initialisation des deux IA
let ai1 = new Ai(INITIAL_ALPHA, INITIAL_EPSILON, GAMMA, false);
let ai2 = new Ai(INITIAL_ALPHA, INITIAL_EPSILON, GAMMA, true);

// Compteurs de victoires par IA
let winsAi1 = 0;
let winsAi2 = 0;

// Infos joueurs (constantes)
const playerInfos1: playerStat = { mode: "Solo", inGame: false };
const playerInfos2: playerStat = { mode: "Solo", inGame: false };

let epsilon = INITIAL_EPSILON;

for (let i = 0; i < N_GAMES; i++) {
  // 1) Décroissance linéaire de α et ε sur les épisodes
  const alpha = Math.max(MIN_ALPHA, INITIAL_ALPHA * (1 - i / N_GAMES));
  ai1.alpha = alpha;
  ai2.alpha = alpha;

  const ratio = i / N_GAMES;
  epsilon = Math.max(MIN_EPSILON, INITIAL_EPSILON - (INITIAL_EPSILON - MIN_EPSILON) * ratio);
  ai1.epsilon = epsilon;
  ai2.epsilon = epsilon;

  // 2) Lancer une nouvelle partie, alternance des côtés
  const ball = new Ball(20, 271, Math.random() < 0.5 ? 1 : -1, 0);
  const leftAi  =  ai2;
  const rightAi =  ai1;

  const playerLeft  = new Paddle(20, 250, playerInfos1, leftAi);
  const playerRight = new Paddle(780, 250, playerInfos2, rightAi);
  const game = new Game(ball, playerRight, playerLeft);
  playerLeft.getPlayerInfos().game = game;
  playerRight.getPlayerInfos().game = game;

  // 3) Jouer la partie
  game.start();
  // 4) Comptabiliser la victoire
  if (playerRight.getScore() === WIN_SCORE) {
    if (rightAi === ai1) winsAi1++;
    else                winsAi2++;
  } else {
    if (leftAi === ai1) winsAi1++;
    else                winsAi2++;
  }

  // 5) Logging tout les milles parties
  if ((i + 1) % 1000 === 0) {
    console.log(
      `Parties jouées : ${i + 1} / ${N_GAMES} — ε=${epsilon.toFixed(4)}, α=${alpha.toFixed(3)}`
    );
  }
}

// Bilan final
console.log(`\n Bilan final sur ${N_GAMES} parties :`);
console.log(`  • Victoires IA1 : ${winsAi1}`);
console.log(`  • Victoires IA2 : ${winsAi2}\n`);

// Sauvegarde des Q-tables mises à jour
writeFile(pathQ1, JSON.stringify(ai2.getQtable(), null, 2), err => {
  if (err) console.error(" Erreur écriture Q-table IA2 :", err);
  else      console.log(" Q-table IA2 sauvegardée dans", pathQ1);
});
writeFile(pathQ2, JSON.stringify(ai1.getQtable(), null, 2), err => {
  if (err) console.error(" Erreur écriture Q-table IA1 :", err);
  else      console.log(" Q-table IA1 sauvegardée dans", pathQ2);
});
