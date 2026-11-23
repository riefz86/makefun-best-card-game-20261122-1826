// Ember Pact — the deck: build it, shuffle it, draw from it, and reshuffle
// the discard pile when it runs dry. A deck is a plain array of card ids;
// a hand is an array of card objects made from the definitions.

import { CARD_DEFS, DECK_COPIES } from './config.js';
import { shuffleInPlace } from './random.js';

export function cardById(id) {
  const def = CARD_DEFS.find((c) => c.id === id);
  return { ...def };
}

export function buildDeck(rng) {
  const deck = [];
  for (const def of CARD_DEFS) {
    for (let i = 0; i < DECK_COPIES; i += 1) deck.push(def.id);
  }
  return shuffleInPlace(rng, deck);
}

// Draw `count` cards from `pile.deck` into `pile.hand`, reshuffling the
// discard pile when the deck runs out. Returns the drawn card objects.
export function drawCards(pile, count, rng) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (pile.deck.length === 0) {
      if (pile.discard.length === 0) break;
      pile.deck = shuffleInPlace(rng, pile.discard);
      pile.discard = [];
    }
    drawn.push(cardById(pile.deck.pop()));
  }
  pile.hand.push(...drawn);
  return drawn;
}

export function countByElement(hand) {
  const counts = {};
  for (const card of hand) counts[card.element] = (counts[card.element] || 0) + 1;
  return counts;
}
