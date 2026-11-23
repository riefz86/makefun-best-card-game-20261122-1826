// Ember Pact — everything the player sees: the table, the hands, the bars
// and the overlays. Rendering rebuilds the table from the game state, so a
// screenshot scene and a live game show exactly the same table.

import { ELEMENTS } from './config.js';
import { describeCard } from './state.js';

const ICONS = {
  flame: '<svg viewBox="0 0 24 24"><path d="M12 2C12 2 5 8.5 5 13.5a7 7 0 0 0 14 0C19 8.5 12 2 12 2Z"/><circle cx="12" cy="15.5" r="2.6" fill="#fff" opacity="0.85"/></svg>',
  drop: '<svg viewBox="0 0 24 24"><path d="M12 3C12 3 6 10.5 6 14.5a6 6 0 0 0 12 0C18 10.5 12 3 12 3Z"/><circle cx="9.5" cy="14.5" r="1.6" fill="#fff" opacity="0.8"/></svg>',
  leaf: '<svg viewBox="0 0 24 24"><path d="M20 4C10 4 4 10 4 20c10 0 16-6 16-16Z"/><path d="M6 18C9 13 13 9 18 6" stroke="#fff" stroke-width="1.4" fill="none" opacity="0.7"/></svg>',
  peak: '<svg viewBox="0 0 24 24"><path d="M2.5 20 9.5 6l4 7 3-4.5L21.5 20Z"/><path d="M9.5 6 12 10.5 13.5 8 15 10" stroke="#fff" stroke-width="1.2" fill="none" opacity="0.7"/></svg>',
};

export function elementIcon(elementId) {
  const el = ELEMENTS[elementId];
  return `<span class="el-icon" style="--el:${el.color}">${ICONS[el.glyph]}</span>`;
}

function hpBar(side, label) {
  const pct = Math.max(0, Math.round((side.hp / side.maxHp) * 100));
  const block = side.block > 0 ? `<span class="block-badge">Blok ${side.block}</span>` : '';
  return `<div class="fighter">
    <div class="fighter-name">${label} ${block}</div>
    <div class="hpbar"><div class="hpfill" style="width:${pct}%"></div><span class="hptext">${side.hp} / ${side.maxHp} HP</span></div>
  </div>`;
}

function manaGems(side, max) {
  let gems = '';
  for (let i = 0; i < max; i += 1) {
    gems += `<span class="mana-gem${i < side.mana ? ' on' : ''}">◆</span>`;
  }
  return `<div class="mana">${gems}<span class="mana-text">${side.mana} mana</span></div>`;
}

function cardHtml(card, index, playable, resonance) {
  const el = ELEMENTS[card.element];
  const stats = describeCard(card, resonance);
  return `<button class="card el-${card.element}${playable ? ' playable' : ''}${resonance ? ' resonance' : ''}" data-index="${index}" ${playable ? '' : 'disabled'}>
    <span class="card-cost">${card.cost}</span>
    <span class="card-el">${elementIcon(card.element)}<span class="card-el-name">${el.name}</span></span>
    <span class="card-name">${card.name}</span>
    <span class="card-stats">${stats}</span>
    <span class="card-text">${card.text}</span>
    ${resonance ? '<span class="card-res">Resonansi +2</span>' : ''}
  </button>`;
}

function rivalHandHtml(count) {
  let backs = '';
  for (let i = 0; i < count; i += 1) backs += '<span class="card-back"></span>';
  return `<div class="rival-hand">${backs}</div>`;
}

export function renderGame(game, root) {
  const player = game.player;
  const rival = game.rival;
  const resonanceNote = Object.keys(player.playedElements).length > 0
    ? `<div class="resonance-note">Resonansi aktif: ${Object.keys(player.playedElements).map((e) => ELEMENTS[e].name).join(', ')}</div>`
    : '';
  const logLines = game.log.slice(-5).map((entry) => `<div class="log-line">${entry.text}</div>`).join('');
  const playable = game.phase === 'play' && game.side === 'player';
  const hand = player.hand.map((card, index) => {
    const resonance = (player.playedElements[card.element] || 0) > 0;
    return cardHtml(card, index, playable && card.cost <= player.mana, resonance);
  }).join('');

  root.innerHTML = `
  <div class="table">
    <header class="table-head">
      <div class="game-title">${elementIcon('ember')} Ember Pact <span class="subtitle">Duel Kartu Elemen</span></div>
      <div class="table-meta">Giliran ${game.turn} · Dek ${player.deck.length} · Buangan ${player.discard.length} <button id="mute-btn" class="mute-btn">Suara: nyala</button></div>
    </header>
    <section class="rival-row">
      <div class="portrait rival-portrait">${elementIcon('ember')}<span>Sang Rival</span></div>
      <div class="side-info">${hpBar(rival, 'Sang Rival')}${manaGems(rival, rival.maxMana)}</div>
      ${rivalHandHtml(rival.hand.length)}
    </section>
    <section class="mid-row">
      <div class="deck-pile"><span class="pile-label">Dek Rival</span><span class="pile-count">${rival.deck.length}</span></div>
      <div class="log">${logLines}</div>
      <div class="deck-pile"><span class="pile-label">Dekmu</span><span class="pile-count">${player.deck.length}</span></div>
    </section>
    <section class="player-row">
      <div class="portrait player-portrait">${elementIcon('leaf')}<span>Kamu</span></div>
      <div class="side-info">${hpBar(player, 'Kamu')}${manaGems(player, player.maxMana)}</div>
      <button id="end-turn" class="end-turn" ${playable ? '' : 'disabled'}>Akhiri Giliran</button>
    </section>
    ${resonanceNote}
    <section class="hand" id="hand">${hand}</section>
    <footer class="table-foot">Klik kartu untuk memainkannya · 1–7 pilih kartu · Spasi akhiri giliran · M suara</footer>
  </div>`;
}

export function renderTitle(root, best) {
  root.innerHTML = `
  <div class="screen title-screen">
    <div class="title-emblem">${elementIcon('ember')}${elementIcon('tide')}${elementIcon('leaf')}${elementIcon('stone')}</div>
    <h1>Ember Pact</h1>
    <p class="tagline">Duel kartu elemen. Kalahkan Sang Rival sebelum ia mengalahkanmu.</p>
    <div class="title-cards">
      <span class="mini-card el-ember">${elementIcon('ember')} Bara</span>
      <span class="mini-card el-tide">${elementIcon('tide')} Ombak</span>
      <span class="mini-card el-leaf">${elementIcon('leaf')} Daun</span>
      <span class="mini-card el-stone">${elementIcon('stone')} Batu</span>
    </div>
    <button id="start-btn" class="big-btn">Mulai Duel</button>
    ${best > 0 ? `<p class="best">Skor terbaikmu: ${best}</p>` : ''}
    <details class="howto"><summary>Cara bermain</summary>
      <ul>
        <li>Setiap giliran kamu menarik 2 kartu dan mendapat mana (naik 1 tiap giliran, maks 6).</li>
        <li>Klik kartu untuk memainkannya. Kartu butuh mana sesuai angka di sudutnya.</li>
        <li>Mainkan 2 kartu elemen sama dalam satu giliran untuk <b>Resonansi +2</b>.</li>
        <li>Blok menyerap damage, lalu hilang di awal giliranmu berikutnya.</li>
        <li>Kalahkan Sang Rival (34 HP) sebelum HP-mu (30 HP) habis. Dek habis? Buangan dikocok ulang.</li>
      </ul>
    </details>
  </div>`;
}

export function renderEnd(root, game) {
  const won = game.winner === 'player';
  const score = game.stats.damageDealt * 10 - game.stats.turnsPlayed * 5 + (won ? 100 : 0);
  root.innerHTML = `
  <div class="screen ${won ? 'win-screen' : 'loss-screen'}">
    <div class="end-emblem">${won ? '★' : '✖'}</div>
    <h1>${won ? 'Kemenangan!' : 'Kekalahan…'}</h1>
    <p class="tagline">${won ? 'Sang Rival tumbang. Pakta bara menjadi milikmu.' : 'Sang Rival menang kali ini. Kocok ulang dan coba lagi.'}</p>
    <div class="stats">
      <div><span>Skor</span><b>${Math.max(0, score)}</b></div>
      <div><span>Damage diberikan</span><b>${game.stats.damageDealt}</b></div>
      <div><span>Kartu dimainkan</span><b>${game.stats.cardsPlayed}</b></div>
      <div><span>Giliran</span><b>${game.stats.turnsPlayed}</b></div>
    </div>
    <button id="again-btn" class="big-btn">Main Lagi (R)</button>
    <p class="best">Skor: ${Math.max(0, score)} · ${game.stats.damageDealt} damage · ${game.stats.turnsPlayed} giliran</p>
  </div>`;
  return Math.max(0, score);
}

export function floatText(root, text, kind) {
  const el = document.createElement('div');
  el.className = `float-text ${kind}`;
  el.textContent = text;
  el.style.left = `${38 + Math.random() * 24}%`;
  el.style.top = `${30 + Math.random() * 20}%`;
  root.appendChild(el);
  window.setTimeout(() => el.remove(), 1200);
}
