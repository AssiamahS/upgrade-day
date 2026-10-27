// Customers: a low-poly person, a walk cycle, a patience meter, and a state machine.
import * as THREE from 'three';
import { PERSONALITIES, pick } from './data.js';

const SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e', '#ffdbac'];
const SHIRT = ['#d52b1e', '#2b6cff', '#2e7d32', '#f2c14e', '#6d4c41', '#37474f', '#ad1457', '#ffffff', '#111111', '#00897b'];
const PANTS = ['#263238', '#1a237e', '#3e2723', '#424242', '#5d4037', '#90a4ae'];
const HAIR = ['#111', '#3b2414', '#6b4423', '#c9a15b', '#888', '#b33a1b'];

function makePerson() {
  const m = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 });
  const skin = m(pick(SKIN)), shirt = m(pick(SHIRT)), pants = m(pick(PANTS)), hair = m(pick(HAIR));
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const limb = (r, len, mat, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), mat);
    mesh.position.y = -len / 2 - r * 0.5;
    mesh.castShadow = true;
    pivot.add(mesh);
    body.add(pivot);
    return pivot;
  };
  const legL = limb(0.085, 0.72, pants, -0.1, 0.92);
  const legR = limb(0.085, 0.72, pants, 0.1, 0.92);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 10), shirt);
  torso.position.y = 1.22; torso.scale.set(1, 1, 0.7); torso.castShadow = true; body.add(torso);
  const armL = limb(0.055, 0.52, shirt, -0.27, 1.47);
  const armR = limb(0.055, 0.52, shirt, 0.27, 1.47);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), skin);
  head.position.y = 1.7; head.castShadow = true; body.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.138, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  hairCap.position.set(0, 1.71, -0.01); hairCap.rotation.x = -0.25; body.add(hairCap);
  const eyeM = new THREE.MeshBasicMaterial({ color: '#111' });
  for (const x of [-0.045, 0.045]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), eyeM);
    e.position.set(x, 1.72, 0.12); body.add(e);
  }
  const s = 0.92 + Math.random() * 0.16;
  body.scale.setScalar(s);
  return { root, legL, legR, armL, armR, height: 1.8 * s };
}

function makeLabel() {
  const c = document.createElement('canvas');
  c.width = 320; c.height = 128;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(1.1, 0.44, 1);
  return { c, tex, sprite };
}

export class Customer {
  constructor(scene, store, profile, spot, game) {
    this.scene = scene;
    this.store = store;
    this.profile = profile;
    this.spot = spot;
    this.game = game;
    spot.taken = this;
    const per = PERSONALITIES[profile.personality];
    this.maxPatience = (55 + Math.random() * 35) * per.patience;
    this.patience = this.maxPatience;
    this.acknowledged = false;
    this.state = 'entering';
    this.browse = 6 + Math.random() * 10;
    this.speed = 1.1 + Math.random() * 0.4;
    this.bubble = null;
    this.bubbleT = 0;
    this.walkT = 0;
    this.sale = null;

    this.person = makePerson();
    this.obj = this.person.root;
    const side = Math.random() < 0.5 ? -1 : 1;
    this.obj.position.set(side * 14, 0, 11.5);
    scene.add(this.obj);
    this.label = makeLabel();
    this.label.sprite.position.y = this.person.height + 0.35;
    this.obj.add(this.label.sprite);

    const [ex, ez] = store.entry, [dx, dz] = store.door;
    this.path = [[dx, 11.5], [dx, dz], [ex, ez], ...spot.via, spot.pos];
    this.drawLabel();
    if (game.save.upgrades.kiosk) this.acknowledge(true);
  }

  waitRatio() { return 1 - this.patience / this.maxPatience; }

  say(text, secs = 3) { this.bubble = text; this.bubbleT = secs; this.drawLabel(); }

  acknowledge(silent = false) {
    if (this.acknowledged) return false;
    this.acknowledged = true;
    this.patience = Math.min(this.maxPatience, this.patience + this.maxPatience * 0.35);
    if (!silent) this.say('Okay, thanks!');
    this.drawLabel();
    return true;
  }

  leave(text) {
    if (this.state === 'leaving') return;
    this.state = 'leaving';
    if (text) this.say(text, 4);
    if (this.spot.taken === this) this.spot.taken = null;
    const [ex, ez] = this.store.entry, [dx, dz] = this.store.door;
    const side = Math.random() < 0.5 ? -1 : 1;
    this.path = [...[...this.spot.via].reverse(), [ex, ez], [dx, dz], [dx, 11.5], [side * 15, 11.5]];
  }

  drawLabel() {
    const { c, tex } = this.label;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const showBar = this.state === 'waiting' || this.state === 'browsing' || (this.state === 'helping' && this.sale?.away);
    if (this.bubble) {
      g.font = 'bold 26px -apple-system, Helvetica, Arial';
      const w = Math.min(310, g.measureText(this.bubble).width + 28);
      g.fillStyle = 'rgba(255,255,255,.95)';
      roundRect(g, (c.width - w) / 2, 4, w, 44, 14); g.fill();
      g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(this.bubble, c.width / 2, 27, 290);
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 28px -apple-system, Helvetica, Arial';
    g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.6)';
    const name = this.profile.name + (this.acknowledged ? ' ✓' : '');
    g.strokeText(name, c.width / 2, 72); g.fillStyle = '#fff'; g.fillText(name, c.width / 2, 72);
    if (showBar) {
      const r = this.patience / this.maxPatience;
      g.fillStyle = 'rgba(0,0,0,.55)'; roundRect(g, 60, 96, 200, 18, 9); g.fill();
      g.fillStyle = r > 0.5 ? '#3ecf6e' : r > 0.25 ? '#f2c14e' : '#ff4d4d';
      roundRect(g, 62, 98, Math.max(14, 196 * r), 14, 7); g.fill();
    }
    tex.needsUpdate = true;
  }

  faceTo(x, z) {
    const p = this.obj.position;
    const target = Math.atan2(x - p.x, z - p.z);
    let d = target - this.obj.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.obj.rotation.y += d * 0.15;
  }

  update(dt, playerPos) {
    const p = this.obj.position;
    let moving = false;
    if ((this.state === 'entering' || this.state === 'leaving') && this.path.length) {
      const [tx, tz] = this.path[0];
      const dx = tx - p.x, dz = tz - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.08) {
        this.path.shift();
        if (!this.path.length) {
          if (this.state === 'entering') this.state = 'browsing';
          else { this.state = 'gone'; this.scene.remove(this.obj); return; }
        }
      } else {
        const step = Math.min(dist, this.speed * dt);
        p.x += (dx / dist) * step; p.z += (dz / dist) * step;
        this.faceTo(tx, tz);
        moving = true;
      }
    }

    if (this.state === 'browsing' || this.state === 'waiting') {
      const lookAtPlayer = Math.hypot(playerPos.x - p.x, playerPos.z - p.z) < 3;
      const [lx, lz] = lookAtPlayer ? [playerPos.x, playerPos.z] : this.spot.look;
      this.faceTo(lx, lz);
    }
    if (this.state === 'browsing') {
      this.browse -= dt;
      if (this.browse <= 0) { this.state = 'waiting'; this.say(pick(['Excuse me?', 'Can I get some help?', 'Hello?', 'Anyone working?'])); }
    } else if (this.state === 'waiting') {
      const drain = this.game.save.upgrades.lounge ? 0.75 : 1;
      this.patience -= dt * drain;
      if (this.patience < this.maxPatience * 0.3 && !this.warned) { this.warned = true; this.say(pick(['Seriously?', 'Ugh, come on.', 'This is taking forever.'])); }
      if (this.patience <= 0) { this.game.onWalkout(this); this.leave(pick(['Forget this.', "I'm going somewhere else.", 'Unbelievable.'])); }
    } else if (this.state === 'helping') {
      this.faceTo(playerPos.x, playerPos.z);
      if (this.sale?.away) {
        this.patience -= dt * 1.6;
        if (this.patience <= 0) { this.game.onAbandoned(this); this.leave('You just walked away from me!'); }
      }
    }

    // walk cycle
    this.walkT += dt * (moving ? 7 : 0);
    const sw = moving ? Math.sin(this.walkT) * 0.5 : 0;
    const pr = this.person;
    pr.legL.rotation.x = sw; pr.legR.rotation.x = -sw;
    pr.armL.rotation.x = -sw * 0.8; pr.armR.rotation.x = sw * 0.8;
    pr.root.children[0].position.y = moving ? Math.abs(Math.cos(this.walkT)) * 0.03 : 0;

    if (this.bubbleT > 0) { this.bubbleT -= dt; if (this.bubbleT <= 0) { this.bubble = null; this.drawLabel(); } }
    this.labelTick = (this.labelTick || 0) + dt;
    if (this.labelTick > 0.25) { this.labelTick = 0; this.drawLabel(); }
  }
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
