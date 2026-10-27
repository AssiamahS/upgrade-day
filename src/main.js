// Game loop: first-person movement, customer spawning, the shift clock, saves and the end-of-day report.
import * as THREE from 'three';
import { buildStore } from './store.js';
import { Customer } from './customers.js';
import { Sale } from './sale.js';
import { Tablet } from './tablet.js';
import { UPGRADES, makeProfile, money } from './data.js';

const OPEN = 9 * 60, CLOSE = 21 * 60, MIN_PER_SEC = 2; // 12-hour shift ≈ 6 real minutes
const SAVE_KEY = 'upgrade-day-save-v1';
const $ = (id) => document.getElementById(id);

function loadSave() {
  try { return { day: 1, bank: 0, upgrades: {}, ratings: [], name: 'Sly', ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { return { day: 1, bank: 0, upgrades: {}, ratings: [], name: 'Sly' }; }
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.save)); } catch { /* private mode */ } }

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#b8dcf5', 30, 70);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 200);
camera.rotation.order = 'YXZ';

scene.add(new THREE.HemisphereLight('#ffffff', '#c8b8a0', 1.6));
const sun = new THREE.DirectionalLight('#fff6e8', 1.6);
sun.position.set(6, 14, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12, near: 1, far: 40 });
scene.add(sun);
for (const x of [-7, 0, 7]) for (const z of [-5, 3]) {
  const l = new THREE.PointLight('#fff1dc', 18, 14, 2);
  l.position.set(x, 3.7, z);
  scene.add(l);
}

const store = buildStore(scene);

// ---------- game state ----------
const game = {
  save: loadSave(),
  playerName: 'Sly',
  stats: null,
  customers: [],
  sale: null,
  clock: OPEN,
  running: false,
  closing: false,
  spawnT: 3,
  sfx,
  onWalkout(c) {
    this.stats.walkouts++;
    this.stats.csat.push(1);
    toast(`${c.profile.name} walked out — nobody helped them`, 'bad');
    sfx('bad');
  },
  onAbandoned(c) {
    this.stats.lost++;
    this.stats.csat.push(1);
    if (this.sale?.c === c) { this.sale = null; tablet.hide(); }
    toast(`${c.profile.name} left mid-sale. You stepped away too long.`, 'bad');
    sfx('bad');
  },
  stepAway() {
    if (!this.sale) return;
    this.sale.away = true;
    tablet.hide();
    this.sale.c.say('Okay... I\'ll wait.');
    lockPointer();
  },
  endSale(sale) {
    const r = sale.result;
    tablet.hide();
    this.sale = null;
    this.stats.csat.push(r.csat);
    if (r.sold) {
      this.stats.sold++;
      this.stats.commission += r.commission;
      this.stats.attach += r.addons.length;
      this.save.bank += r.commission;
      giveBag(sale.c);
      sale.c.leave(r.csat >= 4 ? 'Thank you!' : 'Thanks.');
      toast(`+${money(r.commission)} — ${sale.c.profile.name} bought the ${r.device.name}`, 'good');
    } else {
      this.stats.lost++;
      sale.c.leave(r.line && r.line.length < 34 ? r.line : 'Maybe next time.');
      toast(`${sale.c.profile.name} left without buying`, 'bad');
    }
    persist();
    lockPointer();
  },
};
const tablet = new Tablet(game);

// ---------- audio ----------
let actx;
function sfx(kind) {
  try {
    actx ||= new AudioContext();
    const t = actx.currentTime;
    const tone = (f, start, dur, type = 'sine', vol = 0.12) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t + start);
      g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      o.connect(g).connect(actx.destination);
      o.start(t + start); o.stop(t + start + dur);
    };
    if (kind === 'door') { tone(988, 0, 0.5); tone(784, 0.18, 0.7); }
    else if (kind === 'tap') tone(1400, 0, 0.05, 'square', 0.03);
    else if (kind === 'cash') { tone(1318, 0, 0.12, 'triangle'); tone(1760, 0.1, 0.4, 'triangle'); }
    else if (kind === 'bad') { tone(220, 0, 0.25, 'sawtooth', 0.06); tone(180, 0.2, 0.35, 'sawtooth', 0.06); }
  } catch { /* audio unavailable */ }
}

// ---------- HUD ----------
function toast(text, cls = '') {
  const el = document.createElement('div');
  el.className = `toast ${cls}`;
  el.textContent = text;
  $('toasts').prepend(el);
  setTimeout(() => el.remove(), 5000);
}
const fmtClock = (m) => {
  const h = Math.floor(m / 60), mm = String(Math.floor(m % 60)).padStart(2, '0');
  return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
};
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
function hud() {
  $('clock').textContent = `Day ${game.save.day} · ${fmtClock(Math.min(game.clock, CLOSE))}${game.closing ? ' · CLOSED' : ''}`;
  $('money').textContent = `${money(game.stats.commission)} today`;
  const r = avg(game.stats.csat);
  $('rating').textContent = game.stats.csat.length ? `★ ${r.toFixed(1)}` : '★ —';
  const waiting = game.customers.filter((c) => c.state === 'waiting').length;
  $('queue').textContent = `${waiting} waiting`;
  $('queue').classList.toggle('hot', waiting >= 3);
}

function giveBag(c) {
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.1), new THREE.MeshStandardMaterial({ color: '#d52b1e' }));
  bag.position.set(0, -0.62, 0.05);
  c.person.armR.add(bag);
}

// ---------- player controls ----------
const player = { pos: new THREE.Vector3(0, 1.65, -5.2), yaw: 0, pitch: 0 };
const keys = {};
const touchMove = { x: 0, y: 0 };
const isTouch = matchMedia('(pointer: coarse)').matches;

function lockPointer() {
  if (!isTouch && game.running && !tablet.isOpen) renderer.domElement.requestPointerLock?.();
}
renderer.domElement.addEventListener('click', lockPointer);
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== renderer.domElement) return;
  player.yaw -= e.movementX * 0.0022;
  player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch - e.movementY * 0.0022));
});
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!game.running) return;
  if (e.code === 'KeyE') interact();
  if (e.code === 'KeyF') acknowledge();
  if ((e.code === 'Escape' || e.code === 'Tab') && tablet.isOpen && game.sale && !['checkout', 'done'].includes(game.sale.stage)) { e.preventDefault(); game.stepAway(); }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// touch: left joystick moves, drag anywhere else looks
if (isTouch) {
  document.body.classList.add('touch');
  const stick = $('stick'), knob = $('knob');
  let stickId = null, lookId = null, lx = 0, ly = 0, cx = 0, cy = 0;
  renderer.domElement.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      if (t.clientX < innerWidth * 0.4 && stickId === null) {
        stickId = t.identifier; cx = t.clientX; cy = t.clientY;
        stick.style.left = `${cx - 60}px`; stick.style.top = `${cy - 60}px`; stick.classList.add('on');
      } else if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
    }
  }, { passive: true });
  renderer.domElement.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        let dx = t.clientX - cx, dy = t.clientY - cy;
        const d = Math.hypot(dx, dy), max = 50;
        if (d > max) { dx *= max / d; dy *= max / d; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        touchMove.x = dx / max; touchMove.y = dy / max;
      } else if (t.identifier === lookId) {
        player.yaw -= (t.clientX - lx) * 0.005;
        player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - (t.clientY - ly) * 0.005));
        lx = t.clientX; ly = t.clientY;
      }
    }
  }, { passive: true });
  const end = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) { stickId = null; touchMove.x = touchMove.y = 0; knob.style.transform = ''; stick.classList.remove('on'); }
      if (t.identifier === lookId) lookId = null;
    }
  };
  renderer.domElement.addEventListener('touchend', end);
  renderer.domElement.addEventListener('touchcancel', end);
  $('btnHelp').addEventListener('click', interact);
  $('btnAck').addEventListener('click', acknowledge);
}

function movePlayer(dt) {
  if (tablet.isOpen) return;
  let fx = 0, fz = 0;
  if (keys.KeyW || keys.ArrowUp) fz -= 1;
  if (keys.KeyS || keys.ArrowDown) fz += 1;
  if (keys.KeyA || keys.ArrowLeft) fx -= 1;
  if (keys.KeyD || keys.ArrowRight) fx += 1;
  fx += touchMove.x; fz += touchMove.y;
  const len = Math.hypot(fx, fz);
  if (len > 0.01) {
    const speed = (keys.ShiftLeft ? 5 : 3.2) * Math.min(1, len) / len;
    const s = Math.sin(player.yaw), c = Math.cos(player.yaw);
    const nx = player.pos.x + (fx * c + fz * s) * speed * dt;
    const nz = player.pos.z + (-fx * s + fz * c) * speed * dt;
    const r = 0.3;
    const blocked = (x, z) => x < -11.7 || x > 11.7 || z < -8.7 || z > 8.6 ||
      store.colliders.some((b) => x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r);
    if (!blocked(nx, player.pos.z)) player.pos.x = nx;
    if (!blocked(player.pos.x, nz)) player.pos.z = nz;
  }
  camera.position.copy(player.pos);
  camera.rotation.set(player.pitch, player.yaw, 0);
}

// ---------- interaction ----------
const fwd = new THREE.Vector3();
function target() {
  camera.getWorldDirection(fwd);
  let best = null, bestScore = Infinity;
  for (const c of game.customers) {
    if (!['browsing', 'waiting', 'helping'].includes(c.state)) continue;
    const dx = c.obj.position.x - player.pos.x, dz = c.obj.position.z - player.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 2.8) continue;
    const ang = Math.acos(Math.max(-1, Math.min(1, (dx * fwd.x + dz * fwd.z) / (d * Math.hypot(fwd.x, fwd.z) || 1))));
    if (ang > 0.7) continue;
    const score = d + ang * 2;
    if (score < bestScore) { bestScore = score; best = c; }
  }
  return best;
}

function interact() {
  if (!game.running || tablet.isOpen) return;
  const c = target();
  if (!c) return;
  if (game.sale) {
    if (game.sale.c === c) { document.exitPointerLock?.(); tablet.open(game.sale); }
    else toast(`Finish with ${game.sale.c.profile.name} first — or press F to acknowledge`, '');
    return;
  }
  c.state = 'helping';
  game.sale = new Sale(c, game);
  c.sale = game.sale;
  document.exitPointerLock?.();
  tablet.open(game.sale);
}

function acknowledge() {
  if (!game.running || tablet.isOpen) return;
  const c = target();
  if (c && c.state !== 'helping' && c.acknowledge()) {
    toast(`"Hey ${c.profile.name}, I'll be right with you!"`);
    if (game.sale) game.sale.adjust(-2, 0); // the person you're helping notices
  }
}

function updatePrompt() {
  const el = $('prompt');
  if (tablet.isOpen || !game.running) { el.textContent = ''; return; }
  const c = target();
  if (!c) { el.textContent = game.sale ? `${game.sale.c.profile.name} is waiting on you — go back and press E` : ''; return; }
  if (game.sale && game.sale.c === c) el.innerHTML = `<b>E</b> Back to ${c.profile.name}`;
  else if (game.sale) el.innerHTML = c.acknowledged ? `${c.profile.name} is waiting` : `<b>F</b> "I'll be right with you, ${c.profile.name}"`;
  else el.innerHTML = `<b>E</b> Help ${c.profile.name}${c.acknowledged ? '' : ' &nbsp; <b>F</b> Acknowledge'}`;
}

// ---------- spawning ----------
function spawn() {
  const allSpots = store.spots.filter((s) => !s.taken);
  if (!allSpots.length) return;
  const spot = allSpots[Math.floor(Math.random() * allSpots.length)];
  const used = new Set(game.customers.map((c) => c.profile.name));
  const c = new Customer(scene, store, makeProfile(used), spot, game);
  game.customers.push(c);
  sfx('door');
}
function nextSpawnDelay() {
  const h = game.clock / 60;
  const rush = (h >= 12 && h < 14) || (h >= 17 && h < 19) ? 0.6 : h < 11 ? 1.3 : 1;
  const base = Math.max(10, 28 - game.save.day * 2.5);
  return base * rush * (0.6 + Math.random() * 0.8);
}

// ---------- day flow ----------
function startDay() {
  game.playerName = ($('name').value || 'Sly').trim().slice(0, 16);
  game.save.name = game.playerName;
  for (const c of game.customers) scene.remove(c.obj);
  for (const s of store.spots) s.taken = null;
  game.customers = [];
  game.sale = null;
  game.clock = OPEN;
  game.closing = false;
  game.spawnT = 2;
  game.stats = { sold: 0, lost: 0, walkouts: 0, commission: 0, attach: 0, offered: 0, csat: [] };
  for (const [k, g] of Object.entries(store.upgrades)) g.visible = !!game.save.upgrades[k];
  player.pos.set(0, 1.65, -5.2); player.yaw = Math.PI; player.pitch = 0;
  $('menu').classList.add('hidden');
  $('report').classList.add('hidden');
  $('hud').classList.remove('hidden');
  game.running = true;
  toast('Doors are open. Greet people fast — they will not wait forever.');
  lockPointer();
}

function endDay() {
  game.running = false;
  document.exitPointerLock?.();
  const s = game.stats;
  const rating = s.csat.length ? avg(s.csat) : 0;
  game.save.ratings = [...game.save.ratings, rating].slice(-30);
  const total = s.sold + s.lost + s.walkouts;
  const dayNum = game.save.day;
  game.save.day++;
  persist();
  $('hud').classList.add('hidden');
  const rows = [
    ['Customers', total], ['Sales', s.sold], ['Closing rate', total ? `${Math.round((s.sold / total) * 100)}%` : '—'],
    ['Walked out unhelped', s.walkouts], ['Add-ons sold', s.attach], ['Commission', money(s.commission)],
    ['Customer rating', rating ? `★ ${rating.toFixed(1)}` : '—'],
  ];
  $('report').innerHTML = `<div class="panel"><h1>Day ${dayNum} report</h1>
    <table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
    <p class="verdict">${verdict(s, rating)}</p>
    <h2>Store upgrades <span class="bank">Bank: ${money(game.save.bank)}</span></h2>
    <div class="ups">${UPGRADES.map((u) => `<button class="up" data-up="${u.id}" ${game.save.upgrades[u.id] ? 'disabled' : ''}>
      <b>${u.name}</b><span>${u.desc}</span><em>${game.save.upgrades[u.id] ? 'Owned' : money(u.cost)}</em></button>`).join('')}</div>
    <button class="primary wide" id="nextDay">Start day ${game.save.day}</button></div>`;
  $('report').classList.remove('hidden');
  $('report').querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => {
    const u = UPGRADES.find((x) => x.id === b.dataset.up);
    if (game.save.bank < u.cost) { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); return; }
    game.save.bank -= u.cost;
    game.save.upgrades[u.id] = true;
    persist();
    sfx('cash');
    b.disabled = true;
    b.querySelector('em').textContent = 'Owned';
    $('report').querySelector('.bank').textContent = `Bank: ${money(game.save.bank)}`;
  }));
  $('nextDay').addEventListener('click', startDay);
}

function verdict(s, rating) {
  if (s.walkouts >= 4) return 'Too many people walked out without anyone saying hi. Acknowledge everyone who walks in (F) — even if you are busy.';
  if (s.sold === 0) return 'No sales today. Ask discovery questions before you pitch — then recommend a phone that matches what they told you.';
  if (rating && rating < 3) return 'You closed some deals, but customers were not happy. Stop pushing add-ons they never asked for.';
  if (s.attach === 0) return 'Solid closes, but zero add-ons. Listen for needs: cracked screens, bad home internet, a kid who wants a phone.';
  return 'Great shift. Tomorrow gets busier.';
}

// ---------- menu ----------
$('name').value = game.save.name || 'Sly';
$('startBtn').textContent = game.save.day > 1 ? `Continue — Day ${game.save.day}` : 'Open the store';
$('menuStats').textContent = game.save.day > 1 ? `Bank ${money(game.save.bank)} · ${Object.keys(game.save.upgrades).length} upgrades` : '';
$('startBtn').addEventListener('click', startDay);
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Erase your save and start over at Day 1?')) return;
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  location.reload();
});

// ---------- loop ----------
const clock = new THREE.Clock();
player.yaw = Math.PI;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (game.running) {
    game.clock += dt * MIN_PER_SEC;
    if (game.clock >= CLOSE && !game.closing) { game.closing = true; toast('9:00 PM — doors locked. Finish up with whoever is still here.'); }
    if (!game.closing) {
      game.spawnT -= dt;
      if (game.spawnT <= 0) { spawn(); game.spawnT = nextSpawnDelay(); }
    }
    movePlayer(dt);
    for (const c of game.customers) c.update(dt, player.pos);
    game.customers = game.customers.filter((c) => c.state !== 'gone');
    if (game.closing && !game.customers.length && !game.sale) endDay();
    updatePrompt();
    hud();
  } else {
    // idle camera drift on the menu
    const t = performance.now() / 9000;
    camera.position.set(Math.sin(t) * 6, 2.4, 5 + Math.cos(t) * 2);
    camera.lookAt(0, 1.2, -5);
  }
  store.tick(dt, Math.min(1, (game.clock - OPEN) / (CLOSE - OPEN)));
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
window.__ud = { game, player, tablet }; // console handle for debugging
frame();
