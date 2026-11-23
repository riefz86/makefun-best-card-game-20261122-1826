// Ember Pact — boot, input and the turn flow. The player acts at once; the
// rival answers one card at a time, with a beat between cards, so its turn
// reads as a sequence of moves rather than a single jump.

import { isMuted, playSound, toggleMute } from './audio.js';
import { renderEnd, renderGame, renderTitle, floatText } from './render.js';
import { shotGame } from './shots.js';
import { chooseCard } from './ai.js';
import { createGame, endTurn, playCard, startGame } from './state.js';
import { randomSeed } from './random.js';

const root = document.getElementById('app');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '7') || 7;

let game = null;
let busy = false;
let best = 0;

try {
  best = Number(window.localStorage.getItem('ember-pact-best') || '0') || 0;
} catch {
  best = 0;
}

function saveBest(score) {
  if (score > best) {
    best = score;
    try {
      window.localStorage.setItem('ember-pact-best', String(score));
    } catch {
      // Storage may be refused; the score still shows this session.
    }
  }
}

function soundFor(events) {
  if (!events) return;
  for (const event of events) {
    if (event.type === 'damage') playSound('damage');
    else if (event.type === 'heal') playSound('heal');
    else if (event.type === 'block') playSound('block');
    else if (event.type === 'draw') playSound('draw');
    else if (event.type === 'play') playSound('play');
  }
}

function announce(events) {
  if (!events) return;
  for (const event of events) {
    if (event.type === 'damage' && event.through > 0) {
      floatText(root, `-${event.through}`, event.side === 'player' ? 'dmg-foe' : 'dmg-me');
    }
    if (event.type === 'heal' && event.amount > 0) {
      floatText(root, `+${event.amount}`, 'heal');
    }
    if (event.type === 'resonance') {
      floatText(root, 'Resonansi +2!', 'reso');
    }
  }
}

function showTable() {
  renderGame(game, root);
  wireTable();
}

function showEnd() {
  const score = renderEnd(root, game);
  saveBest(score);
  playSound(game.winner === 'player' ? 'win' : 'lose');
  const again = document.getElementById('again-btn');
  if (again) again.addEventListener('click', restart);
}

function restart() {
  playSound('click');
  game = createGame(randomSeed());
  startGame(game);
  busy = false;
  showTable();
}

function playPlayerCard(index) {
  if (busy || !game || game.phase !== 'play' || game.side !== 'player') return;
  const events = playCard(game, 'player', index);
  if (!events) return;
  soundFor(events);
  announce(events);
  if (game.phase === 'over') showEnd();
  else showTable();
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function rivalTurn() {
  busy = true;
  showTable();
  await sleep(500);
  while (game.phase === 'play' && game.side === 'rival') {
    const index = chooseCard(game, 'rival');
    if (index < 0) break;
    const events = playCard(game, 'rival', index);
    if (!events) break;
    soundFor(events);
    announce(events);
    showTable();
    if (game.phase === 'over') break;
    await sleep(650);
  }
  if (game.phase === 'play') {
    endTurn(game);
    playSound('draw');
  }
  busy = false;
  if (game.phase === 'over') showEnd();
  else showTable();
}

function endPlayerTurn() {
  if (busy || !game || game.phase !== 'play' || game.side !== 'player') return;
  playSound('click');
  endTurn(game);
  void rivalTurn();
}

function wireTable() {
  const hand = document.getElementById('hand');
  if (hand) {
    hand.addEventListener('click', (event) => {
      const button = event.target.closest('.card');
      if (button) playPlayerCard(Number(button.dataset.index));
    });
  }
  const end = document.getElementById('end-turn');
  if (end) end.addEventListener('click', endPlayerTurn);
  const mute = document.getElementById('mute-btn');
  if (mute) {
    mute.textContent = isMuted() ? 'Suara: mati' : 'Suara: nyala';
    mute.addEventListener('click', () => {
      const now = toggleMute();
      mute.textContent = now ? 'Suara: mati' : 'Suara: nyala';
    });
  }
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') {
    toggleMute();
    const mute = document.getElementById('mute-btn');
    if (mute) mute.textContent = isMuted() ? 'Suara: mati' : 'Suara: nyala';
    return;
  }
  if (!game) return;
  if (game.phase === 'over' && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
    restart();
    return;
  }
  if (game.phase !== 'play' || game.side !== 'player' || busy) return;
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    endPlayerTurn();
    return;
  }
  const n = Number(event.key);
  if (n >= 1 && n <= 7) playPlayerCard(n - 1);
});

if (shot) {
  // A screenshot scene: the table as a real game left it, no input needed.
  game = shotGame(shot, seed);
  if (game && game.phase === 'title') renderTitle(root, best);
  else if (game && game.phase === 'over') renderEnd(root, game);
  else if (game) renderGame(game, root);
} else {
  game = createGame(randomSeed());
  renderTitle(root, best);
  const start = document.getElementById('start-btn');
  if (start) {
    start.addEventListener('click', () => {
      playSound('click');
      startGame(game);
      showTable();
    });
  }
}

// A handle for headless play-tests: drive the real game from the console.
window.__emberPact = { game: () => game, playPlayerCard, endPlayerTurn, restart };
