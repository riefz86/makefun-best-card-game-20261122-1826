// Ember Pact — the screenshot scenes behind ?shot=title|play|win|loss.
// Each scene plays the real rules forward from a fresh game with a fixed
// seed, steered by the same autopilot the rival uses, so every frame is what
// a short real game looks like and the same seed always gives the same frame.

import { playTurnAuto, playTurnCareless } from './ai.js';
import { createGame, endTurn, startGame } from './state.js';

const MAX_TURNS = 60;

// Play whole turns, both sides on autopilot, until `stop` says enough.
// The stop is checked after every half-turn, so a scene can freeze the
// table at the start of a turn instead of only at the end of one.
function simulate(seed, stop, carelessPlayer) {
  const game = createGame(seed);
  startGame(game);
  let guard = 0;
  while (game.phase === 'play' && guard < MAX_TURNS * 2) {
    guard += 1;
    if (game.side === 'player') {
      if (carelessPlayer) playTurnCareless(game, 'player');
      else playTurnAuto(game, 'player');
    } else {
      playTurnAuto(game, 'rival');
    }
    if (game.phase !== 'play') break;
    if (stop(game)) break;
    endTurn(game);
    if (game.phase !== 'play') break;
    if (stop(game)) break;
  }
  return game;
}

function firstSeedFor(winner, carelessPlayer) {
  for (let seed = 1; seed <= 400; seed += 1) {
    const game = simulate(seed, () => false, carelessPlayer);
    if (game.phase === 'over' && game.winner === winner) return game;
  }
  return null;
}

// Build the game behind one screenshot scene. Returns the game to render.
export function shotGame(shot, seed) {
  if (shot === 'title') {
    const game = createGame(seed);
    game.phase = 'title';
    return game;
  }
  if (shot === 'play') {
    // Three full rounds in, at the start of the player's fourth turn: a
    // table with a full hand, mana to spend and both HP bars moved. The
    // first seed whose game is still going at that point wins the frame.
    for (let s = seed; s < seed + 400; s += 1) {
      const game = simulate(s, (g) => g.phase === 'play' && g.side === 'player' && g.turn >= 4, false);
      if (game.phase === 'play') return game;
    }
    return simulate(seed, (g) => g.phase === 'play' && g.side === 'player' && g.turn >= 4, false);
  }
  if (shot === 'win') {
    return firstSeedFor('player', false) ?? simulate(seed, () => false, false);
  }
  if (shot === 'loss') {
    return firstSeedFor('rival', true) ?? simulate(seed, () => false, true);
  }
  return null;
}
