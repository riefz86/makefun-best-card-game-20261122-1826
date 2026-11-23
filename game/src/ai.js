// Ember Pact — how the rival thinks, and the autopilot that plays both
// sides in the screenshot scenes. The rival reads the table: it takes a
// killing blow when it sees one, mends itself when it is hurt, guards when
// the player's hand threatens, and otherwise spends its mana on damage.
// Its choices are meant to be readable, so a player can play around them.

import { affordableCards, otherSide, playCard } from './state.js';

function scorePlay(game, side, card) {
  const me = side === 'player' ? game.player : game.rival;
  const foe = side === 'player' ? game.rival : game.player;
  let score = 0;
  const resonance = (me.playedElements[card.element] || 0) > 0;
  const bonus = resonance ? 2 : 0;
  if (card.damage) {
    const amount = card.damage + bonus;
    const lethal = amount >= foe.hp + foe.block;
    score += lethal ? 100 : amount * 1.0;
    // Chipping a guarded foe is worth less than an open hit.
    if (foe.block > 0 && !lethal) score -= Math.min(foe.block, amount) * 0.3;
  }
  if (card.heal) {
    const missing = me.maxHp - me.hp;
    const healed = Math.min(missing, card.heal + bonus);
    score += me.hp <= 12 ? healed * 1.6 : healed * 0.5;
  }
  if (card.block) {
    const threat = foe.hand.length * 2;
    score += (card.block + bonus) * (me.hp <= 10 || threat >= 8 ? 1.1 : 0.6);
  }
  if (card.draw) score += 1.5;
  // Prefer the most value per mana, and break ties toward damage.
  return score / card.cost + (card.damage ? 0.15 : 0);
}

// The best card the side can afford right now, or -1 when nothing is worth
// playing (a full hand of heals at full health, for instance).
export function chooseCard(game, side) {
  const options = affordableCards(game, side);
  let best = -1;
  let bestScore = 0.9;
  for (const { card, index } of options) {
    const score = scorePlay(game, side, card);
    if (score > bestScore) {
      bestScore = score;
      best = index;
    }
  }
  return best;
}

// Play one whole turn for `side` with the heuristic above, until the mana
// runs out or nothing is worth playing. Returns every event, in order.
export function playTurnAuto(game, side) {
  const events = [];
  let guard = 0;
  while (game.phase === 'play' && game.side === side && guard < 12) {
    guard += 1;
    const index = chooseCard(game, side);
    if (index < 0) break;
    const ev = playCard(game, side, index);
    if (!ev) break;
    events.push(...ev);
  }
  return events;
}

// A careless player for the loss scene: it plays only its cheapest card and
// ends the turn, so the rival wins a real game, not a staged one.
export function playTurnCareless(game, side) {
  const events = [];
  const options = affordableCards(game, side);
  if (options.length > 0) {
    let cheapest = options[0];
    for (const option of options) {
      if (option.card.cost < cheapest.card.cost) cheapest = option;
    }
    const ev = playCard(game, side, cheapest.index);
    if (ev) events.push(...ev);
  }
  return events;
}

export { otherSide };
