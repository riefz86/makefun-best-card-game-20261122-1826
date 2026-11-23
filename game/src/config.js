// Ember Pact — card definitions and tuning constants.
// A duel of elemental cards: four elements, twelve card designs, two copies
// of each in a 24-card deck. Every card names its element, its cost and what
// it does in plain words, so the table reads at a glance.

export const ELEMENTS = {
  ember: { id: 'ember', name: 'Bara', color: '#e2483d', dark: '#8f1d16', glyph: 'flame' },
  tide: { id: 'tide', name: 'Ombak', color: '#2f7fd0', dark: '#144a7d', glyph: 'drop' },
  leaf: { id: 'leaf', name: 'Daun', color: '#3d9b4f', dark: '#1d5c2a', glyph: 'leaf' },
  stone: { id: 'stone', name: 'Batu', color: '#8a7a5c', dark: '#4d4130', glyph: 'peak' },
};

export const ELEMENT_ORDER = ['ember', 'tide', 'leaf', 'stone'];

// A card's numbers are the base values; Resonance adds +2 to every number
// of the second and later card of the same element played in one turn.
export const CARD_DEFS = [
  { id: 'tebasan-bara', name: 'Tebasan Bara', element: 'ember', cost: 1, damage: 4, text: 'Berikan 4 damage.' },
  { id: 'ledakan-bara', name: 'Ledakan Bara', element: 'ember', cost: 2, damage: 7, text: 'Berikan 7 damage.' },
  { id: 'api-menjalar', name: 'Api Menjalar', element: 'ember', cost: 2, damage: 6, text: 'Berikan 6 damage.' },
  { id: 'cambuk-ombak', name: 'Cambuk Ombak', element: 'tide', cost: 1, damage: 3, draw: 1, text: 'Berikan 3 damage. Ambil 1 kartu.' },
  { id: 'gelombang-pasang', name: 'Gelombang Pasang', element: 'tide', cost: 2, damage: 5, heal: 2, text: 'Berikan 5 damage. Pulihkan 2 HP.' },
  { id: 'hisap-ombak', name: 'Hisap Ombak', element: 'tide', cost: 2, damage: 4, heal: 4, text: 'Berikan 4 damage. Pulihkan 4 HP.' },
  { id: 'pulih-daun', name: 'Pulih Daun', element: 'leaf', cost: 1, heal: 5, text: 'Pulihkan 5 HP.' },
  { id: 'duri-beracun', name: 'Duri Beracun', element: 'leaf', cost: 2, damage: 4, block: 4, text: 'Berikan 4 damage. Raih 4 blok.' },
  { id: 'mekar-daun', name: 'Mekar Daun', element: 'leaf', cost: 2, heal: 4, draw: 1, text: 'Pulihkan 4 HP. Ambil 1 kartu.' },
  { id: 'perisai-batu', name: 'Perisai Batu', element: 'stone', cost: 1, block: 7, text: 'Raih 7 blok.' },
  { id: 'hantaman-batu', name: 'Hantaman Batu', element: 'stone', cost: 3, damage: 9, text: 'Berikan 9 damage.' },
  { id: 'gempa-batu', name: 'Gempa Batu', element: 'stone', cost: 3, damage: 6, block: 5, text: 'Berikan 6 damage. Raih 5 blok.' },
];

export const DECK_COPIES = 2;
export const START_HP = 30;
export const RIVAL_HP = 34;
export const HAND_START = 5;
export const HAND_LIMIT = 7;
export const DRAW_PER_TURN = 2;
export const MANA_START = 3;
export const MANA_MAX = 6;
export const RESONANCE_BONUS = 2;
export const RIVAL_NAME = 'Sang Rival';
export const PLAYER_NAME = 'Kamu';
