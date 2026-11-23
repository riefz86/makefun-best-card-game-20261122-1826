// Ember Pact — the duel itself, as pure state transitions with no DOM in
// them, so the same rules can run in the browser, in a screenshot scene and
// in a headless balance check. A game is one object; every move returns the
// events it caused, and the renderer and the sounds read those events.

import {
  CARD_DEFS, DRAW_PER_TURN, HAND_LIMIT, HAND_START, MANA_MAX, MANA_START,
  RESONANCE_BONUS, RIVAL_HP, START_HP,
} from './config.js';
import { buildDeck, drawCards } from './deck.js';
import { makeRng } from './random.js';

export function newSide(rng, hp) {
  return {
    hp,
    maxHp: hp,
    block: 0,
    mana: MANA_START,
    maxMana: MANA_START,
    turnsTaken: 0,
    deck: buildDeck(rng),
    discard: [],
    hand: [],
    playedElements: {},
  };
}

export function createGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    phase: 'title',
    turn: 1,
    side: 'player',
    player: newSide(rng, START_HP),
    rival: newSide(rng, RIVAL_HP),
    log: [],
    stats: { damageDealt: 0, cardsPlayed: 0, turnsPlayed: 0 },
    winner: null,
    resonanceThisTurn: {},
  };
  return game;
}

export function otherSide(side) {
  return side === 'player' ? 'rival' : 'player';
}

function sideOf(game, side) {
  return side === 'player' ? game.player : game.rival;
}

function manaCapFor(turnsTaken) {
  return Math.min(MANA_START + turnsTaken, MANA_MAX);
}

// Begin `side`'s turn: fresh block, fresh mana, two cards drawn.
export function startTurn(game, side) {
  const me = sideOf(game, side);
  me.turnsTaken += 1;
  me.maxMana = manaCapFor(me.turnsTaken - 1);
  me.mana = me.maxMana;
  me.block = 0;
  me.playedElements = {};
  game.resonanceThisTurn = {};
  game.side = side;
  const drawn = drawCards(me, DRAW_PER_TURN, game.rng);
  // A hand holds at most HAND_LIMIT cards; extras burn to the discard pile.
  while (me.hand.length > HAND_LIMIT) {
    me.discard.push(me.hand.pop().id);
  }
  game.log.push({ side, kind: 'turn', text: side === 'player' ? `Giliranmu — ${drawn.length} kartu ditarik.` : 'Giliran Sang Rival.' });
  return drawn;
}

export function startGame(game) {
  game.phase = 'play';
  drawCards(game.player, HAND_START, game.rng);
  drawCards(game.rival, HAND_START, game.rng);
  startTurn(game, 'player');
  return game;
}

function dealDamage(game, target, amount, source) {
  const absorbed = Math.min(target.block, amount);
  target.block -= absorbed;
  const through = amount - absorbed;
  target.hp = Math.max(0, target.hp - through);
  if (source === 'player') game.stats.damageDealt += through;
  return { absorbed, through };
}

// Play the card at `handIndex` for `side`. Returns the events it caused, or
// null when the card cannot be played (not enough mana, wrong turn, over).
export function playCard(game, side, handIndex) {
  if (game.phase !== 'play' || game.side !== side) return null;
  const me = sideOf(game, side);
  const foe = sideOf(game, otherSide(side));
  const card = me.hand[handIndex];
  if (!card || me.mana < card.cost) return null;
  me.mana -= card.cost;
  me.hand.splice(handIndex, 1);
  me.discard.push(card.id);
  game.stats.cardsPlayed += 1;

  const resonance = (me.playedElements[card.element] || 0) > 0;
  me.playedElements[card.element] = (me.playedElements[card.element] || 0) + 1;
  const bonus = resonance ? RESONANCE_BONUS : 0;
  const events = [{ type: 'play', side, card, resonance }];
  if (resonance) events.push({ type: 'resonance', side, element: card.element });

  if (card.damage) {
    const amount = card.damage + bonus;
    const hit = dealDamage(game, foe, amount, side);
    events.push({ type: 'damage', side, amount, absorbed: hit.absorbed, through: hit.through });
  }
  if (card.block) {
    me.block += card.block + bonus;
    events.push({ type: 'block', side, amount: card.block + bonus });
  }
  if (card.heal) {
    const healed = Math.min(me.maxHp - me.hp, card.heal + bonus);
    me.hp += healed;
    events.push({ type: 'heal', side, amount: healed });
  }
  if (card.draw) {
    const drawn = drawCards(me, card.draw, game.rng);
    while (me.hand.length > HAND_LIMIT) me.discard.push(me.hand.pop().id);
    events.push({ type: 'draw', side, count: drawn.length });
  }

  game.log.push({
    side,
    kind: 'card',
    text: `${side === 'player' ? 'Kamu' : 'Sang Rival'} memainkan ${card.name}${resonance ? ' — Resonansi +2!' : ''}.`,
  });

  if (foe.hp <= 0) {
    game.phase = 'over';
    game.winner = side;
    game.stats.turnsPlayed = game.turn;
    game.log.push({ side, kind: 'end', text: side === 'player' ? 'Kemenangan! Sang Rival tumbang.' : 'Kekalahan… Sang Rival menang.' });
  }
  return events;
}

// End the current side's turn and begin the other's.
export function endTurn(game) {
  if (game.phase !== 'play') return null;
  const next = otherSide(game.side);
  if (next === 'player') game.turn += 1;
  return startTurn(game, next);
}

export function affordableCards(game, side) {
  const me = sideOf(game, side);
  return me.hand.map((card, index) => ({ card, index })).filter(({ card }) => card.cost <= me.mana);
}

export function describeCard(card, resonance) {
  const bonus = resonance ? RESONANCE_BONUS : 0;
  const parts = [];
  if (card.damage) parts.push(`${card.damage + bonus} damage`);
  if (card.block) parts.push(`${card.block + bonus} blok`);
  if (card.heal) parts.push(`pulih ${card.heal + bonus}`);
  if (card.draw) parts.push(`ambil ${card.draw}`);
  return parts.join(' · ');
}

export function cardCount() {
  return CARD_DEFS.length * 2;
}
