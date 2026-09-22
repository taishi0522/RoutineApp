'use strict';

/* ============================== DATA ============================== */

const RARITY_META = {
  N:  { label: 'ノーマル',     prob: 0.58, monsterChance: 0.18, fragRange: [2, 3], color: '#8A9A8E' },
  R:  { label: 'レア',         prob: 0.28, monsterChance: 0.10, fragRange: [1, 2], color: '#3E7CB1' },
  SR: { label: 'スーパーレア', prob: 0.11, monsterChance: 0.05, fragRange: [1, 2], color: '#8A4FBF' },
  UR: { label: 'ウルトラレア', prob: 0.03, monsterChance: 0.02, fragRange: [1, 1], color: '#C9962E' },
};
const RARITY_ORDER = ['N', 'R', 'SR', 'UR'];

const MONSTERS = [
  { id: 'shizukun', name: 'しずくん', rarity: 'N', needed: 5, color: '#4F8FBF', accessory: 'droplet',
    theme: '水を飲む', desc: '毎朝コップ一杯の水から生まれた、ぷるぷるモンスター。水分をたっぷり含むと機嫌がいい。' },
  { id: 'hokorin', name: 'ほこりん', rarity: 'N', needed: 5, color: '#B79A6B', accessory: 'sparkle',
    theme: '掃除', desc: '掃除のあとに舞い上がるホコリが集まってできた、きれい好きな相棒。' },
  { id: 'nobinyan', name: 'のびにゃん', rarity: 'N', needed: 5, color: '#7FB88A', accessory: 'spiral',
    theme: 'ストレッチ', desc: 'ストレッチのたびに体がどこまでも伸びる、しなやかな猫型モンスター。' },
  { id: 'asahidori', name: 'あさひどり', rarity: 'R', needed: 10, color: '#E0A63E', accessory: 'sun',
    theme: '早起き', desc: '早起きした朝にだけ姿を見せる、朝日を運ぶ鳥。夜更かしすると会えない。' },
  { id: 'tekumogu', name: 'てくもぐ', rarity: 'R', needed: 10, color: '#8A6A4F', accessory: 'footprint',
    theme: '散歩', desc: '歩いた歩数だけ土の中でパワーを蓄える、几帳面なモグラ。' },
  { id: 'notefuku', name: 'ノートふくろう', rarity: 'R', needed: 10, color: '#6E5AA6', accessory: 'book',
    theme: '勉強', desc: '勉強した時間だけ賢くなる、静かな夜のふくろう。' },
  { id: 'rhythmwolf', name: 'リズムオオカミ', rarity: 'SR', needed: 15, color: '#C15C4A', accessory: 'bolt',
    theme: '連続達成', desc: '連続達成の鼓動から生まれた、リズムを操るオオカミ。' },
  { id: 'kiraboshiguma', name: 'きらぼしグマ', rarity: 'SR', needed: 15, color: '#3E5C9A', accessory: 'star',
    theme: '週間達成', desc: '一週間やり切った夜空にだけ現れる、星屑をまとったクマ。' },
  { id: 'tokoshieryu', name: 'とこしえりゅう', rarity: 'UR', needed: 20, color: '#2F7A5A', accessory: 'flame',
    theme: '継続の証', desc: '長く続けた習慣だけが呼び覚ませる、永遠を司る竜。' },
  { id: 'hajimarinoseirei', name: 'はじまりのせいれい', rarity: 'UR', needed: 25, color: '#B9A23E', accessory: 'sparkleburst',
    theme: '挑戦の証', desc: 'なにかを始めようとした、その一歩の勇気から生まれる精霊。' },
];

const WEIGHT_LABEL = { 1: 'かるい', 2: 'ふつう', 3: 'しっかり' };
const WEIGHT_POINT = { 1: 10, 2: 20, 3: 30 };

/* ============================ DATE HELPERS ============================ */

const pad = (n) => (n < 10 ? '0' : '') + n;
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toDateStr(new Date());
const addDays = (dateStr, delta) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
};
const dayHasCompletion = (completions, dateStr) => {
  const day = completions[dateStr];
  if (!day) return false;
  return Object.keys(day).some((k) => k !== '_bonus');
};
const computeStreak = (completions) => {
  let cursor = todayStr();
  if (!dayHasCompletion(completions, cursor)) cursor = addDays(cursor, -1);
  let count = 0;
  while (dayHasCompletion(completions, cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
};
const getWeekStart = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
};
const getWeekKey = (dateStr) => 'W-' + getWeekStart(dateStr);
const getMonthStart = (dateStr) => dateStr.slice(0, 8) + '01';
const rangeProgress = (routinesLen, completions, startStr, daysElapsed) => {
  let done = 0;
  for (let i = 0; i < daysElapsed; i++) {
    const d = addDays(startStr, i);
    const day = completions[d];
    if (day) done += Object.keys(day).filter((k) => k !== '_bonus').length;
  }
  const total = routinesLen * daysElapsed;
  return { done, total, rate: total > 0 ? done / total : 0 };
};
const weekProgress = (routines, completions) => {
  const today = todayStr();
  const ws = getWeekStart(today);
  const daysElapsed = Math.floor((new Date(today + 'T00:00:00') - new Date(ws + 'T00:00:00')) / 86400000) + 1;
  return { ...rangeProgress(routines.length, completions, ws, daysElapsed), daysElapsed };
};
const monthProgress = (routines, completions) => {
  const today = todayStr();
  const ms = getMonthStart(today);
  const dayOfMonth = parseInt(today.slice(8, 10), 10);
  return { ...rangeProgress(routines.length, completions, ms, dayOfMonth), daysElapsed: dayOfMonth };
};
const fmtDate = (ts) => {
  if (!ts) return '―';
  const d = new Date(ts);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
};

/* ============================ DEFAULT STATE ============================ */

const defaultProgress = () => ({
  routines: [
    { id: 'r1', name: '水を飲む', weight: 1, createdAt: Date.now() },
    { id: 'r2', name: '10分掃除', weight: 2, createdAt: Date.now() },
    { id: 'r3', name: 'ストレッチ', weight: 1, createdAt: Date.now() },
    { id: 'r4', name: '早起き', weight: 2, createdAt: Date.now() },
  ],
  completions: {},
  profile: { points: 0, history: [], claimedWeeks: [] },
});
const defaultCollection = () => ({ owned: {}, pulls: [] });

/* ============================ STORAGE (localStorage) ============================ */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 読み込み失敗時はデフォルト値を使う */ }
  return fallback;
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 保存失敗は無視 */ }
}

/* ============================ アプリの状態 ============================ */

const state = {
  loaded: false,
  progress: defaultProgress(),
  collection: defaultCollection(),
  activeTab: 'home',
  addingRoutine: false,
  editingId: null,
  editWeight: 1,
  newWeight: 1,
  gachaState: 'idle', // idle | rolling | result
  gachaResult: null,
  selectedSpecies: null,
  synthesizingId: null,
  synthResult: null,
};

function persistProgress() { saveJSON('rm_progress_v1', state.progress); }
function persistCollection() { saveJSON('rm_collection_v1', state.collection); }

/* ============================ モンスターアイコン(SVG) ============================ */

function accessoryPath(type, color) {
  switch (type) {
    case 'droplet':
      return `<path d="M12 2 C12 2 18 10 18 15 A6 6 0 0 1 6 15 C6 10 12 2 12 2 Z" fill="${color}" />`;
    case 'sparkle':
      return `<g fill="${color}"><circle cx="12" cy="12" r="2" /><circle cx="6" cy="7" r="1.3" /><circle cx="18" cy="8" r="1" /></g>`;
    case 'spiral':
      return `<path d="M12 3 a7 7 0 1 0 0.1 0" stroke="${color}" stroke-width="2.2" fill="none" stroke-linecap="round" />`;
    case 'sun':
      return `<g stroke="${color}" stroke-width="1.6" stroke-linecap="round">
        <circle cx="12" cy="12" r="4" fill="${color}" stroke="none" />
        <line x1="12" y1="1" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="23" />
        <line x1="1" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="23" y2="12" />
        <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" /><line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
        <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" /><line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
      </g>`;
    case 'footprint':
      return `<g fill="${color}"><ellipse cx="10" cy="16" rx="4" ry="6" /><circle cx="7" cy="7" r="1.6" />
        <circle cx="10" cy="5.5" r="1.6" /><circle cx="13" cy="6" r="1.6" /><circle cx="15.5" cy="8" r="1.4" /></g>`;
    case 'book':
      return `<g><rect x="4" y="5" width="16" height="14" rx="1.5" fill="${color}" />
        <line x1="12" y1="5" x2="12" y2="19" stroke="#F7F2E4" stroke-width="1" /></g>`;
    case 'bolt':
      return `<path d="M13 2 L5 14 H11 L9 22 L19 9 H13 L13 2 Z" fill="${color}" />`;
    case 'star':
      return `<path d="M12 2 L14.7 9 L22 9.6 L16.5 14.6 L18.2 22 L12 18 L5.8 22 L7.5 14.6 L2 9.6 L9.3 9 Z" fill="${color}" />`;
    case 'flame':
      return `<path d="M12 2 C12 2 6 9 6 14 a6 6 0 0 0 12 0 C18 9 12 2 12 2 Z" fill="${color}" />`;
    case 'sparkleburst':
      return `<path d="M12 2 L13.5 9 L21 10.5 L13.5 12 L12 19 L10.5 12 L3 10.5 L10.5 9 Z" fill="${color}" />`;
    default:
      return '';
  }
}

function monsterBodySVG(rarity, color) {
  const eyes = `<g fill="#22261F"><circle cx="9.2" cy="12.5" r="1.3" /><circle cx="14.8" cy="12.5" r="1.3" /></g>`;
  let body;
  if (rarity === 'N') body = `<circle cx="12" cy="13" r="8" fill="${color}" />`;
  else if (rarity === 'R') body = `<ellipse cx="12" cy="13" rx="8.6" ry="8" fill="${color}" />`;
  else if (rarity === 'SR')
    body = `<g><path d="M4 10 L1 5.5 L6.5 8 Z" fill="${color}" /><path d="M20 10 L23 5.5 L17.5 8 Z" fill="${color}" />
      <ellipse cx="12" cy="13" rx="8.6" ry="8" fill="${color}" /></g>`;
  else
    body = `<g><path d="M3 12 C-1 9 -0.5 17 3.5 16.5 Z" fill="${color}" /><path d="M21 12 C25 9 24.5 17 20.5 16.5 Z" fill="${color}" />
      <ellipse cx="12" cy="13" rx="9" ry="8.5" fill="${color}" /></g>`;
  return `<g>${body}${eyes}</g>`;
}

// 未発見・発見済み・入手済みの状態に応じたモンスターアイコンのHTMLを生成する
function monsterIconHTML(species, discovered, owned, size) {
  size = size || 56;
  if (!discovered) {
    return `<div class="m-icon" style="width:${size}px;height:${size}px;">
      <svg viewBox="0 0 24 24" width="${size}" height="${size}"><circle cx="12" cy="13" r="8" fill="#C9C2AC" /></svg>
      <span class="m-icon-q">?</span>
    </div>`;
  }
  const cls = owned ? `is-owned rarity-glow-${species.rarity}` : 'is-shard';
  const accSize = size * 0.4;
  return `<div class="m-icon ${cls}" style="width:${size}px;height:${size}px;">
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" style="opacity:${owned ? 1 : 0.5}">${monsterBodySVG(species.rarity, species.color)}</svg>
    <svg viewBox="0 0 24 24" width="${accSize}" height="${accSize}" class="m-icon-accessory">${accessoryPath(species.accessory, species.color)}</svg>
  </div>`;
}

/* ============================ フローター(＋ptの演出) ============================ */

function spawnFloater(text) {
  const layer = document.getElementById('floater-layer');
  const el = document.createElement('div');
  el.className = 'rm-floater';
  el.textContent = text;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

/* ============================ ルーティン操作 ============================ */

function toggleRoutine(routineId) {
  const date = todayStr();
  const routine = state.progress.routines.find((r) => r.id === routineId);
  if (!routine) return;
  const completions = { ...state.progress.completions };
  const day = { ...(completions[date] || {}) };
  let pointsDelta = 0;
  const historyEntries = [];
  let floaterText = null;

  if (day[routineId] != null) {
    pointsDelta -= day[routineId];
    historyEntries.push({ delta: -day[routineId], reason: `${routine.name}を取り消し` });
    delete day[routineId];
    const hasOthers = Object.keys(day).some((k) => k !== '_bonus');
    if (!hasOthers) {
      if (day._bonus) {
        pointsDelta -= day._bonus;
        historyEntries.push({ delta: -day._bonus, reason: '連続ボーナス取り消し' });
      }
      delete completions[date];
    } else {
      completions[date] = day;
    }
  } else {
    const base = WEIGHT_POINT[routine.weight] || routine.weight * 10;
    const wasEmpty = !Object.keys(state.progress.completions[date] || {}).some((k) => k !== '_bonus');
    day[routineId] = base;
    pointsDelta += base;
    historyEntries.push({ delta: base, reason: `${routine.name}達成` });
    floaterText = `+${base}pt`;
    if (wasEmpty) {
      const streak = computeStreak({ ...completions, [date]: day });
      const bonus = Math.min(streak, 10);
      if (bonus > 0) {
        day._bonus = bonus;
        pointsDelta += bonus;
        historyEntries.push({ delta: bonus, reason: `${streak}日連続ボーナス` });
        floaterText = `+${base}pt（連続+${bonus}）`;
      }
    }
    completions[date] = day;
  }

  const ts = Date.now();
  state.progress.completions = completions;
  state.progress.profile.points += pointsDelta;
  state.progress.profile.history = [
    ...historyEntries.map((h) => ({ ...h, ts })),
    ...state.progress.profile.history,
  ].slice(0, 50);

  persistProgress();
  if (floaterText) spawnFloater(floaterText);
  render();
}

function addRoutine(name, weight) {
  name = name.trim();
  if (!name) return;
  state.progress.routines.push({
    id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name, weight, createdAt: Date.now(),
  });
  state.addingRoutine = false;
  state.newWeight = 1;
  persistProgress();
  render();
}
function startEdit(routine) {
  state.editingId = routine.id;
  state.editWeight = routine.weight;
  render();
}
function saveEdit(name, weight) {
  const routine = state.progress.routines.find((r) => r.id === state.editingId);
  state.progress.routines = state.progress.routines.map((r) =>
    r.id === state.editingId ? { ...r, name: name.trim() || r.name, weight } : r
  );
  state.editingId = null;
  persistProgress();
  render();
}
function deleteRoutine(id) {
  state.progress.routines = state.progress.routines.filter((r) => r.id !== id);
  persistProgress();
  render();
}

/* ============================ ガチャロジック ============================ */

function rollGacha() {
  const r = Math.random();
  let acc = 0;
  let rarity = 'N';
  for (const key of RARITY_ORDER) {
    acc += RARITY_META[key].prob;
    rarity = key;
    if (r <= acc) break;
  }
  const pool = MONSTERS.filter((m) => m.rarity === rarity);
  const species = pool[Math.floor(Math.random() * pool.length)];
  const meta = RARITY_META[rarity];
  const alreadyOwned = !!(state.collection.owned[species.id] && state.collection.owned[species.id].owned);
  const rollMonster = Math.random() < meta.monsterChance;
  if (rollMonster && !alreadyOwned) {
    return { type: 'monster', species, label: `${species.name}が仲間になった！` };
  }
  const [lo, hi] = meta.fragRange;
  const amount = lo + Math.floor(Math.random() * (hi - lo + 1));
  const label = rollMonster && alreadyOwned ? `${species.name}のかけら +${amount}（ダブり）` : `${species.name}のかけら +${amount}`;
  return { type: 'fragment', species, amount, label };
}

function pullGacha() {
  if (state.progress.profile.points < 10 || state.gachaState === 'rolling') return;
  state.gachaState = 'rolling';
  render();
  setTimeout(() => {
    const result = rollGacha();
    state.progress.profile.points -= 10;
    state.progress.profile.history = [
      { ts: Date.now(), delta: -10, reason: `ガチャ：${result.label}` },
      ...state.progress.profile.history,
    ].slice(0, 50);

    const owned = { ...state.collection.owned };
    const cur = owned[result.species.id] || { fragments: 0, owned: false, obtainedAt: null, timesObtained: 0 };
    let next;
    if (result.type === 'monster') {
      next = { ...cur, owned: true, fragments: Math.max(cur.fragments, result.species.needed), obtainedAt: cur.obtainedAt || Date.now(), timesObtained: cur.timesObtained + 1 };
    } else {
      next = { ...cur, fragments: cur.fragments + result.amount };
    }
    owned[result.species.id] = next;
    const pulls = [
      { id: 'p_' + Date.now(), ts: Date.now(), speciesId: result.species.id, type: result.type, amount: result.amount || 0 },
      ...state.collection.pulls,
    ].slice(0, 30);
    state.collection.owned = owned;
    state.collection.pulls = pulls;

    persistProgress();
    persistCollection();

    state.gachaResult = result;
    state.gachaState = 'result';
    render();
  }, 1300);
}

function closeGachaResult() {
  state.gachaState = 'idle';
  state.gachaResult = null;
  render();
}

function synthesize(speciesId) {
  const species = MONSTERS.find((m) => m.id === speciesId);
  const cur = state.collection.owned[speciesId];
  if (!species || !cur || cur.owned || cur.fragments < species.needed) return;
  state.synthesizingId = speciesId;
  render();
  setTimeout(() => {
    const c = state.collection.owned[speciesId];
    if (c && !c.owned) {
      state.collection.owned = {
        ...state.collection.owned,
        [speciesId]: { ...c, owned: true, fragments: c.fragments - species.needed, obtainedAt: Date.now(), timesObtained: c.timesObtained + 1 },
      };
      state.progress.profile.history = [
        { ts: Date.now(), delta: 0, reason: `${species.name}が誕生した！` },
        ...state.progress.profile.history,
      ].slice(0, 50);
      persistProgress();
      persistCollection();
    }
    state.synthesizingId = null;
    state.synthResult = species;
    state.selectedSpecies = null;
    render();
  }, 1100);
}

function claimWeekly(wk) {
  if (state.progress.profile.claimedWeeks.includes(wk)) return;
  state.progress.profile.points += 50;
  state.progress.profile.claimedWeeks = [...state.progress.profile.claimedWeeks, wk];
  state.progress.profile.history = [
    { ts: Date.now(), delta: 50, reason: '週間ボーナス達成！' },
    ...state.progress.profile.history,
  ].slice(0, 50);
  persistProgress();
  render();
}

/* ============================ 描画: タブ共通 ============================ */

function switchTab(tab) {
  state.activeTab = tab;
  render();
}

function renderTabBar() {
  document.querySelectorAll('.rm-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
  });
  ['home', 'gacha', 'collection', 'log'].forEach((t) => {
    document.getElementById('tab-' + t).hidden = t !== state.activeTab;
  });
}

/* ============================ 描画: ホームタブ ============================ */

function renderHome() {
  const today = todayStr();
  const todayEntries = state.progress.completions[today] || {};
  const doneToday = Object.keys(todayEntries).filter((k) => k !== '_bonus').length;
  const totalToday = state.progress.routines.length;
  const streak = computeStreak(state.progress.completions);
  const wp = weekProgress(state.progress.routines, state.progress.completions);
  const currentWeekKey = getWeekKey(today);
  const weeklyClaimed = state.progress.profile.claimedWeeks.includes(currentWeekKey);
  const weeklyEligible = wp.rate >= 0.8 && wp.daysElapsed >= 3 && !weeklyClaimed && state.progress.routines.length > 0;

  document.getElementById('home-date-summary').textContent = `${today} ・ ${doneToday}/${totalToday} 達成`;
  document.getElementById('streak-num').textContent = streak;
  document.getElementById('today-bar-fill').style.width = `${totalToday ? (doneToday / totalToday) * 100 : 0}%`;
  document.getElementById('points-value').textContent = state.progress.profile.points;

  const banner = document.getElementById('weekly-banner');
  banner.hidden = !weeklyEligible;
  if (weeklyEligible) {
    document.getElementById('weekly-banner-text').textContent = `今週の達成率 ${Math.round(wp.rate * 100)}%！ウィークリーボーナス+50pt`;
  }

  const list = document.getElementById('routine-list');
  list.innerHTML = '';
  if (state.progress.routines.length === 0) {
    const p = document.createElement('p');
    p.className = 'rm-empty';
    p.textContent = 'ルーティンがまだありません。下から追加しましょう。';
    list.appendChild(p);
  }
  state.progress.routines.forEach((r) => {
    if (state.editingId === r.id) {
      list.appendChild(buildRoutineForm({ mode: 'edit', routine: r }));
    } else {
      list.appendChild(buildRoutineRow(r, todayEntries));
    }
  });

  const trigger = document.getElementById('add-routine-trigger');
  const existingForm = document.getElementById('add-routine-form-instance');
  if (existingForm) existingForm.remove();
  if (state.addingRoutine) {
    trigger.hidden = true;
    const form = buildRoutineForm({ mode: 'add' });
    form.id = 'add-routine-form-instance';
    trigger.insertAdjacentElement('beforebegin', form);
  } else {
    trigger.hidden = false;
  }
}

function buildRoutineRow(routine, todayEntries) {
  const tpl = document.getElementById('tpl-routine-row');
  const node = tpl.content.firstElementChild.cloneNode(true);
  const done = todayEntries[routine.id] != null;
  node.dataset.id = routine.id;
  node.querySelector('[data-field="name"]').textContent = routine.name;
  node.querySelector('[data-field="name"]').classList.toggle('done-text', done);
  node.querySelector('[data-field="weight"]').textContent = `${WEIGHT_LABEL[routine.weight]}・${WEIGHT_POINT[routine.weight]}pt`;
  const checkBtn = node.querySelector('.rm-check');
  checkBtn.classList.toggle('done', done);
  checkBtn.querySelector('.check-icon').hidden = !done;
  checkBtn.addEventListener('click', () => toggleRoutine(routine.id));
  node.querySelector('[data-action="edit"]').addEventListener('click', () => startEdit(routine));
  node.querySelector('[data-action="delete"]').addEventListener('click', () => deleteRoutine(routine.id));
  return node;
}

function buildRoutineForm(opts) {
  const tpl = document.getElementById('tpl-routine-form');
  const node = tpl.content.firstElementChild.cloneNode(true);
  const input = node.querySelector('[data-field="name-input"]');
  const saveBtn = node.querySelector('[data-action="save"]');
  const cancelBtn = node.querySelector('[data-action="cancel"]');
  const weightOpts = node.querySelectorAll('.rm-weight-opt');

  let currentWeight = opts.mode === 'edit' ? state.editWeight : state.newWeight;
  if (opts.mode === 'edit') input.value = opts.routine.name;
  saveBtn.textContent = opts.mode === 'edit' ? '保存' : '追加する';

  function refreshWeightUI() {
    weightOpts.forEach((el) => el.classList.toggle('sel', Number(el.dataset.weight) === currentWeight));
  }
  refreshWeightUI();
  weightOpts.forEach((el) => {
    el.addEventListener('click', () => {
      currentWeight = Number(el.dataset.weight);
      if (opts.mode === 'edit') state.editWeight = currentWeight; else state.newWeight = currentWeight;
      refreshWeightUI();
    });
  });

  cancelBtn.addEventListener('click', () => {
    if (opts.mode === 'edit') { state.editingId = null; } else { state.addingRoutine = false; }
    render();
  });
  saveBtn.addEventListener('click', () => {
    if (opts.mode === 'edit') saveEdit(input.value, currentWeight);
    else addRoutine(input.value, currentWeight);
  });

  if (opts.mode === 'add') {
    setTimeout(() => input.focus(), 0);
  }
  return node;
}

/* ============================ 描画: ガチャタブ ============================ */

function renderGacha() {
  document.getElementById('gacha-cost-text').textContent = `1回 10pt（所持: ${state.progress.profile.points}pt）`;
  const eggBtn = document.getElementById('gacha-egg-btn');
  eggBtn.classList.toggle('rolling', state.gachaState === 'rolling');
  eggBtn.disabled = state.progress.profile.points < 10 || state.gachaState === 'rolling';

  const list = document.getElementById('pulls-list');
  list.innerHTML = '';
  if (state.collection.pulls.length === 0) {
    const p = document.createElement('p');
    p.className = 'rm-empty';
    p.textContent = 'まだガチャを回していません。';
    list.appendChild(p);
  }
  state.collection.pulls.slice(0, 8).forEach((pull) => {
    const species = MONSTERS.find((m) => m.id === pull.speciesId);
    const tpl = document.getElementById('tpl-pull-item');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.pull-icon').innerHTML = monsterIconHTML(species, true, pull.type === 'monster', 34);
    node.querySelector('[data-field="text"]').textContent = `${species.name} ${pull.type === 'monster' ? '本体を獲得！' : `のかけら +${pull.amount}`}`;
    node.querySelector('[data-field="time"]').textContent = fmtDate(pull.ts);
    list.appendChild(node);
  });

  renderGachaResultModal();
}

function renderGachaResultModal() {
  const modal = document.getElementById('modal-gacha-result');
  modal.hidden = !(state.gachaState === 'result' && state.gachaResult);
  if (modal.hidden) return;
  const result = state.gachaResult;
  document.getElementById('gacha-result-icon').innerHTML = monsterIconHTML(result.species, true, result.type === 'monster', 84);
  document.getElementById('gacha-result-title').textContent =
    result.type === 'monster' ? `${result.species.name} 登場！` : `${result.species.name}のかけら +${result.amount}`;
  document.getElementById('gacha-result-sub').textContent = RARITY_META[result.species.rarity].label;
}

/* ============================ 描画: 図鑑タブ ============================ */

function renderCollection() {
  const ownedCount = MONSTERS.filter((m) => state.collection.owned[m.id] && state.collection.owned[m.id].owned).length;
  const completionPct = Math.round((ownedCount / MONSTERS.length) * 100);
  document.getElementById('collection-count').textContent = `${ownedCount} / ${MONSTERS.length} 体を発見`;
  document.getElementById('collection-pct').textContent = `${completionPct}%`;

  const grid = document.getElementById('monster-grid');
  grid.innerHTML = '';
  MONSTERS.forEach((m) => {
    const entry = state.collection.owned[m.id];
    const fragments = entry ? entry.fragments : 0;
    const owned = !!(entry && entry.owned);
    const discovered = fragments > 0 || owned;
    const tpl = document.getElementById('tpl-monster-cell');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = m.id;
    node.querySelector('.cell-icon').innerHTML = monsterIconHTML(m, discovered, owned, 52);
    node.querySelector('[data-field="name"]').textContent = discovered ? m.name : '？？？';
    node.querySelector('[data-field="frag"]').textContent = owned
      ? RARITY_META[m.rarity].label
      : discovered ? `かけら ${fragments}/${m.needed}` : RARITY_META[m.rarity].label;
    node.addEventListener('click', () => { state.selectedSpecies = m.id; render(); });
    grid.appendChild(node);
  });

  renderSynthResultModal();
  renderDetailModal();
}

function renderSynthResultModal() {
  const modal = document.getElementById('modal-synth-result');
  modal.hidden = !state.synthResult;
  if (modal.hidden) return;
  const species = state.synthResult;
  document.getElementById('synth-result-icon').innerHTML = monsterIconHTML(species, true, true, 84);
  document.getElementById('synth-result-title').textContent = `${species.name}が誕生した！`;
  document.getElementById('synth-result-sub').textContent = RARITY_META[species.rarity].label;
}

function renderDetailModal() {
  const modal = document.getElementById('modal-detail');
  modal.hidden = !state.selectedSpecies;
  if (modal.hidden) return;

  const m = MONSTERS.find((x) => x.id === state.selectedSpecies);
  const entry = state.collection.owned[m.id];
  const fragments = entry ? entry.fragments : 0;
  const owned = !!(entry && entry.owned);
  const discovered = fragments > 0 || owned;
  const canSynth = discovered && !owned && fragments >= m.needed;
  const synthing = state.synthesizingId === m.id;

  document.getElementById('detail-icon').innerHTML = monsterIconHTML(m, discovered, owned, 90);
  document.getElementById('detail-title').textContent = discovered ? m.name : '？？？';
  document.getElementById('detail-sub').textContent = `${RARITY_META[m.rarity].label}${discovered ? ` ・ ${m.theme}` : ''}`;

  document.getElementById('detail-discovered-area').hidden = !discovered;
  document.getElementById('detail-locked-area').hidden = discovered;

  if (discovered) {
    document.getElementById('detail-desc').textContent = m.desc;
    document.getElementById('detail-frag-count').textContent = `${Math.min(fragments, m.needed)}/${m.needed}`;
    const fill = document.getElementById('detail-frag-fill');
    fill.style.width = `${Math.min((fragments / m.needed) * 100, 100)}%`;
    fill.style.background = owned ? 'var(--amber)' : 'var(--moss)';
    document.getElementById('detail-obtained-text').textContent = owned ? `入手日：${fmtDate(entry.obtainedAt)}` : '合成に必要なかけらを集めよう';
    const synthBtn = document.getElementById('detail-synth-btn');
    synthBtn.hidden = !canSynth;
    synthBtn.disabled = synthing;
    synthBtn.textContent = synthing ? '合成中…' : 'かけらを合成する';
    synthBtn.onclick = () => synthesize(m.id);
  } else {
    document.getElementById('detail-needed-text').textContent = `かけら必要数：${m.needed}`;
  }
}

/* ============================ 描画: ログタブ ============================ */

function renderLog() {
  const today = todayStr();
  const streak = computeStreak(state.progress.completions);
  const wp = weekProgress(state.progress.routines, state.progress.completions);
  const mp = monthProgress(state.progress.routines, state.progress.completions);

  document.getElementById('stat-streak').textContent = streak;
  document.getElementById('stat-week-pct').textContent = `${Math.round(wp.rate * 100)}%`;
  document.getElementById('stat-month-pct').textContent = `${Math.round(mp.rate * 100)}%`;

  const heatmap = document.getElementById('heatmap');
  heatmap.innerHTML = '';
  const total = state.progress.routines.length || 1;
  for (let i = 0; i < 28; i++) {
    const d = addDays(today, -(27 - i));
    const day = state.progress.completions[d];
    const count = day ? Object.keys(day).filter((k) => k !== '_bonus').length : 0;
    const ratio = Math.min(count / total, 1);
    const bg = ratio === 0 ? 'var(--panel-alt)' : ratio < 0.5 ? '#CBE0D2' : ratio < 1 ? '#8FBFA0' : 'var(--moss)';
    const cell = document.createElement('div');
    cell.className = 'rm-heatmap-cell';
    cell.style.background = bg;
    cell.title = d;
    heatmap.appendChild(cell);
  }

  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  if (state.progress.profile.history.length === 0) {
    const p = document.createElement('p');
    p.className = 'rm-empty';
    p.textContent = 'まだ記録がありません。';
    historyList.appendChild(p);
  }
  state.progress.profile.history.slice(0, 20).forEach((h) => {
    const tpl = document.getElementById('tpl-history-item');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-field="reason"]').textContent = h.reason;
    const deltaEl = node.querySelector('[data-field="delta"]');
    if (h.delta !== 0) {
      deltaEl.textContent = `${h.delta > 0 ? '+' : ''}${h.delta}pt`;
      deltaEl.style.color = h.delta > 0 ? 'var(--moss)' : 'var(--clay)';
    } else {
      deltaEl.remove();
    }
    node.querySelector('[data-field="time"]').textContent = fmtDate(h.ts);
    historyList.appendChild(node);
  });
}

/* ============================ 全体描画 ============================ */

function render() {
  document.getElementById('points-value').textContent = state.progress.profile.points;
  renderTabBar();
  renderHome();
  renderGacha();
  renderCollection();
  renderLog();
}

/* ============================ イベント初期化 ============================ */

function initStaticEvents() {
  document.querySelectorAll('.rm-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('add-routine-trigger').addEventListener('click', () => {
    state.addingRoutine = true;
    render();
  });

  document.getElementById('gacha-egg-btn').addEventListener('click', pullGacha);
  document.getElementById('gacha-result-close').addEventListener('click', closeGachaResult);
  document.getElementById('synth-result-close').addEventListener('click', () => { state.synthResult = null; render(); });
  document.getElementById('detail-close').addEventListener('click', () => { state.selectedSpecies = null; render(); });

  // モーダル背景クリックで閉じる
  document.getElementById('modal-gacha-result').addEventListener('click', (e) => { if (e.target.id === 'modal-gacha-result') closeGachaResult(); });
  document.getElementById('modal-synth-result').addEventListener('click', (e) => { if (e.target.id === 'modal-synth-result') { state.synthResult = null; render(); } });
  document.getElementById('modal-detail').addEventListener('click', (e) => { if (e.target.id === 'modal-detail') { state.selectedSpecies = null; render(); } });

  document.getElementById('claim-weekly-btn').addEventListener('click', () => claimWeekly(getWeekKey(todayStr())));
}

function init() {
  state.progress = loadJSON('rm_progress_v1', defaultProgress());
  state.collection = loadJSON('rm_collection_v1', defaultCollection());
  state.loaded = true;

  document.getElementById('loading').hidden = true;
  document.getElementById('app-content').hidden = false;

  initStaticEvents();
  render();
}

document.addEventListener('DOMContentLoaded', init);
