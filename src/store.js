// Builds the 3D store: floor, glass front, display tables, counter, accessory wall, promo TV.
import * as THREE from 'three';
import { DEVICES } from './data.js';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const BRAND_RED = '#d52b1e';

export function buildStore(scene) {
  const colliders = [];
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
  const box = (w, h, d, m, x, y, z, collide = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    if (collide) colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    return mesh;
  };

  // Floor: light wood planks
  const floorTex = canvasTex(1024, 1024, (g, w, h) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 4; x++) {
        const off = (y % 2) * 128;
        const l = 74 + Math.random() * 8;
        g.fillStyle = `hsl(32, 28%, ${l}%)`;
        g.fillRect(x * 256 + off - 256, y * 64, 256, 64);
        g.fillRect(x * 256 + off, y * 64, 256, 64);
        g.strokeStyle = 'rgba(80,60,40,.25)';
        g.strokeRect(x * 256 + off, y * 64, 256, 64);
      }
    }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(4, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), mat('#ffffff', { map: floorTex, roughness: 0.35 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Outside: sidewalk + street
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(60, 6), mat('#b8b8b4', { roughness: 0.9 }));
  walk.rotation.x = -Math.PI / 2; walk.position.set(0, -0.01, 12); walk.receiveShadow = true; scene.add(walk);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(80, 14), mat('#2f3136', { roughness: 0.95 }));
  street.rotation.x = -Math.PI / 2; street.position.set(0, -0.02, 22); scene.add(street);
  for (let i = -6; i <= 6; i++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.18), mat('#e8d36a'));
    stripe.rotation.x = -Math.PI / 2; stripe.position.set(i * 6, 0, 22); scene.add(stripe);
  }
  for (let i = 0; i < 8; i++) {
    const h = 8 + Math.random() * 14;
    box(8, h, 6, mat(`hsl(${20 + i * 25}, 12%, ${40 + Math.random() * 20}%)`), -28 + i * 8, h / 2, 34, false);
  }

  // Walls
  const wallMat = mat('#f4f3f0', { roughness: 0.9 });
  box(24, 4, 0.2, wallMat, 0, 2, -9.1);
  box(0.2, 4, 18, wallMat, -12.1, 2, 0);
  box(0.2, 4, 18, wallMat, 12.1, 2, 0);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), mat('#fafafa', { roughness: 1 }));
  ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 4; scene.add(ceiling);
  for (let x = -8; x <= 8; x += 4) {
    for (let z = -6; z <= 6; z += 4) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), new THREE.MeshBasicMaterial({ color: '#fffdf5' }));
      p.rotation.x = Math.PI / 2; p.position.set(x, 3.99, z); scene.add(p);
    }
  }

  // Glass storefront with a door gap at x ∈ [-1.5, 1.5]
  const glass = new THREE.MeshStandardMaterial({ color: '#bfe3ff', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1 });
  const frame = mat('#2a2a2a', { metalness: 0.6, roughness: 0.3 });
  box(10.5, 4, 0.06, glass, -6.75, 2, 9, false);
  box(10.5, 4, 0.06, glass, 6.75, 2, 9, false);
  box(3, 1, 0.06, glass, 0, 3.5, 9, false);
  for (const x of [-12, -8.5, -5, -1.5, 1.5, 5, 8.5, 12]) box(0.12, 4, 0.14, frame, x, 2, 9, false);
  box(24, 0.12, 0.14, frame, 0, 3, 9, false);
  // Player can't leave the store
  colliders.push({ minX: -13, maxX: 13, minZ: 8.9, maxZ: 9.5 });
  const sign = canvasTex(1024, 160, (g, w, h) => {
    g.fillStyle = '#111'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = 'bold 96px Helvetica, Arial'; g.textBaseline = 'middle';
    g.fillText('horizon', 40, h / 2 + 4);
    g.fillStyle = BRAND_RED; g.font = 'bold 110px Helvetica, Arial'; g.fillText('✓', 430, h / 2);
    g.fillStyle = '#bbb'; g.font = '40px Helvetica, Arial'; g.fillText('wireless', 560, h / 2 + 10);
  });
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1), new THREE.MeshBasicMaterial({ map: sign }));
  signMesh.position.set(0, 4.6, 9.46); scene.add(signMesh);
  box(24.4, 1.2, 0.3, mat('#111'), 0, 4.6, 9.3, false);

  // Accent back wall
  const accent = canvasTex(1600, 400, (g, w, h) => {
    g.fillStyle = BRAND_RED; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = 'bold 150px Helvetica, Arial'; g.textBaseline = 'middle';
    g.fillText('horizon', 80, 170);
    g.font = '60px Helvetica, Arial'; g.fillText('The network you can count on.', 84, 300);
    g.font = 'bold 260px Helvetica, Arial'; g.fillText('✓', 1250, 200);
  });
  const accentMesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshStandardMaterial({ map: accent, roughness: 0.7 }));
  accentMesh.position.set(0, 2.4, -8.99); scene.add(accentMesh);

  // Sales counter with tablets
  const white = mat('#ffffff', { roughness: 0.25 });
  box(10, 1.05, 0.8, white, 0, 0.525, -6.5);
  box(10.02, 0.12, 0.82, mat(BRAND_RED), 0, 0.25, -6.5, false);
  for (const x of [-3.5, 0, 3.5]) {
    const tab = box(0.34, 0.02, 0.24, mat('#111', { roughness: 0.2 }), x, 1.07, -6.45, false);
    tab.rotation.x = -0.3;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ color: '#2b6cff' }));
    scr.rotation.x = -Math.PI / 2 - 0.3; scr.position.set(x, 1.085, -6.45); scene.add(scr);
  }

  // Phone screens
  const screenTex = (hue) => canvasTex(64, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, `hsl(${hue}, 80%, 55%)`); gr.addColorStop(1, `hsl(${hue + 60}, 80%, 35%)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.9)'; g.font = 'bold 18px Helvetica'; g.fillText('9:41', 14, 30);
  });
  const phoneOnTable = (d, x, z, rot) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.009), mat(d.color, { metalness: 0.5, roughness: 0.25 }));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.072, 0.15), new THREE.MeshBasicMaterial({ map: screenTex(Math.random() * 360) }));
    scr.position.z = 0.005;
    g.add(body, scr);
    g.position.set(x, 1.0, z);
    g.rotation.set(-0.5, rot, 0);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.06, 12), mat('#ddd'));
    stand.position.set(x, 0.93, z);
    scene.add(g, stand);
  };

  const tables = [
    { x: -6, z: 2 }, { x: 0, z: 2 }, { x: 6, z: 2 }, { x: -3, z: -2.5 }, { x: 3, z: -2.5 },
  ];
  const tableMat = mat('#fbfbfb', { roughness: 0.3 });
  const wood = mat('#b98b5e', { roughness: 0.7 });
  tables.forEach((t, i) => {
    box(2.2, 0.08, 1.1, tableMat, t.x, 0.88, t.z, false);
    box(2.0, 0.84, 0.9, wood, t.x, 0.42, t.z);
    const devs = DEVICES.slice((i * 2) % DEVICES.length, (i * 2) % DEVICES.length + 2);
    devs.forEach((d, k) => {
      phoneOnTable(d, t.x - 0.5 + k, t.z + 0.3, 0);
      phoneOnTable(d, t.x - 0.5 + k, t.z - 0.3, Math.PI);
      const card = canvasTex(256, 96, (g, w, h) => {
        g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#111'; g.font = 'bold 26px Helvetica'; g.fillText(d.name, 10, 36);
        g.fillStyle = BRAND_RED; g.font = 'bold 30px Helvetica'; g.fillText(`$${(d.price / 36).toFixed(2)}/mo`, 10, 78);
      });
      for (const s of [1, -1]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.135), new THREE.MeshBasicMaterial({ map: card }));
        m.rotation.x = -Math.PI / 2 + 0.4 * s; m.position.set(t.x - 0.5 + k, 0.93, t.z + 0.48 * s);
        if (s < 0) m.rotation.set(-Math.PI / 2 - 0.4 * s, 0, Math.PI);
        scene.add(m);
      }
    });
  });

  // Accessory wall (left)
  box(0.1, 2.6, 12, mat('#e9e6e1'), -11.95, 1.7, 0, false);
  const accColors = ['#111', '#d52b1e', '#2b6cff', '#f2c14e', '#6fcf97', '#c3c3c3', '#9b51e0', '#ff8fab'];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 22; col++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.2), mat(accColors[(row * 3 + col) % accColors.length], { roughness: 0.5 }));
      b.position.set(-11.82, 0.75 + row * 0.48, -5.4 + col * 0.5);
      scene.add(b);
    }
  }
  colliders.push({ minX: -12.2, maxX: -11.6, minZ: -6, maxZ: 6 });

  // Promo TV (right wall), cycles through deals
  const promos = [
    ['UPGRADE DAY', 'Up to $800 off with trade-in'],
    ['HOME INTERNET', '$50/mo with any phone plan'],
    ['ADD A LINE', 'Free phone when you add a line'],
    ['TOTAL PROTECTION', 'Cracked screen? Fixed same day'],
  ];
  const tvCanvas = document.createElement('canvas');
  tvCanvas.width = 960; tvCanvas.height = 540;
  const tvTex = new THREE.CanvasTexture(tvCanvas);
  tvTex.colorSpace = THREE.SRGBColorSpace;
  const drawTv = (i) => {
    const g = tvCanvas.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 960, 540);
    gr.addColorStop(0, '#111'); gr.addColorStop(1, '#3a0d0a');
    g.fillStyle = gr; g.fillRect(0, 0, 960, 540);
    g.fillStyle = BRAND_RED; g.fillRect(0, 470, 960, 70);
    g.fillStyle = '#fff'; g.font = 'bold 96px Helvetica'; g.fillText(promos[i][0], 60, 220);
    g.font = '48px Helvetica'; g.fillText(promos[i][1], 60, 320);
    g.font = 'bold 36px Helvetica'; g.fillText('horizon ✓', 60, 518);
    tvTex.needsUpdate = true;
  };
  drawTv(0);
  box(0.08, 1.5, 2.6, mat('#111', { metalness: 0.4 }), 11.95, 2.4, -2, false);
  const tv = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.4), new THREE.MeshBasicMaterial({ map: tvTex }));
  tv.position.set(11.9, 2.4, -2); tv.rotation.y = -Math.PI / 2; scene.add(tv);

  // Plants
  for (const [x, z] of [[-11, -8], [11, -8], [-11, 8], [11, 8]]) {
    box(0.6, 0.6, 0.6, mat('#ffffff'), x, 0.3, z);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), mat('#3f7d3a', { roughness: 0.9 }));
    f.position.set(x, 1.05, z); f.castShadow = true; scene.add(f);
  }

  // Upgrades (hidden until bought)
  const lounge = new THREE.Group();
  const chairMat = mat('#4a4f5a', { roughness: 0.8 });
  for (const [x, z] of [[8.6, 6.6], [10.2, 6.6], [8.6, 4.6], [10.2, 4.6]]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.8), chairMat); seat.position.set(x, 0.225, z);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.15), chairMat); back.position.set(x, 0.65, z + (z > 5.5 ? 0.33 : -0.33));
    seat.castShadow = back.castShadow = true;
    lounge.add(seat, back);
  }
  const lt = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.45, 20), white); lt.position.set(9.4, 0.225, 5.6); lounge.add(lt);
  lounge.visible = false; scene.add(lounge);

  const coffee = new THREE.Group();
  const cbar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 0.6), wood); cbar.position.set(10.8, 0.5, -6.5);
  const machine = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.35), mat('#222', { metalness: 0.6 })); machine.position.set(10.6, 1.25, -6.5);
  const cups = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.3, 10), white); cups.position.set(11.2, 1.15, -6.5);
  coffee.add(cbar, machine, cups); coffee.visible = false; scene.add(coffee);

  const kiosk = new THREE.Group();
  const kp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.3), white); kp.position.set(2.6, 0.6, 7.6);
  const ks = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ color: BRAND_RED })); ks.position.set(2.6, 1.05, 7.44); ks.rotation.y = Math.PI;
  kiosk.add(kp, ks); kiosk.visible = false; scene.add(kiosk);

  // Where customers stand. `via` = waypoints from the entrance; `look` = what they face.
  const spots = [
    { pos: [-6, 3.2], look: [-6, 2], via: [[-6, 5]] },
    { pos: [-6, 0.8], look: [-6, 2], via: [[-7.7, 5], [-8.3, 0.8]] },
    { pos: [0, 3.2], look: [0, 2], via: [] },
    { pos: [6, 3.2], look: [6, 2], via: [[6, 5]] },
    { pos: [6, 0.8], look: [6, 2], via: [[7.7, 5], [7.7, 0.8]] },
    { pos: [-3, -1.3], look: [-3, -2.5], via: [[-3, 5], [-3, 0]] },
    { pos: [3, -1.3], look: [3, -2.5], via: [[3, 5], [3, 0]] },
    { pos: [-10.9, -2], look: [-12, -2], via: [[-9.5, 5], [-9.5, -2]] },
    { pos: [-10.9, 2.5], look: [-12, 2.5], via: [[-9.5, 5]] },
    { pos: [-1.2, -5.6], look: [-1.2, -6.5], via: [[-3, 5], [-3, 0], [0, 0], [0, -4.6]] },
    { pos: [1.4, -5.6], look: [1.4, -6.5], via: [[3, 5], [3, 0], [0, 0], [0, -4.6]] },
    { pos: [10.6, -1], look: [12, -2], via: [[7.7, 5], [10, 0]] },
  ].map((s) => ({ ...s, taken: null }));

  const sky = new THREE.Color();
  let tvIndex = 0, tvTimer = 0;
  return {
    colliders,
    spots,
    entry: [0, 7.4],
    door: [0, 10.2],
    upgrades: { lounge, coffee, kiosk },
    tick(dt, dayFrac) {
      tvTimer += dt;
      if (tvTimer > 7) { tvTimer = 0; tvIndex = (tvIndex + 1) % promos.length; drawTv(tvIndex); }
      // morning blue → afternoon → sunset → night
      const stops = [[0, '#9fc9ef'], [0.55, '#b8dcf5'], [0.8, '#f2a65a'], [1, '#1b2340']];
      let i = 0; while (i < stops.length - 2 && dayFrac > stops[i + 1][0]) i++;
      const [a, ca] = stops[i], [b, cb] = stops[i + 1];
      sky.set(ca).lerp(new THREE.Color(cb), Math.min(1, Math.max(0, (dayFrac - a) / (b - a))));
      scene.background = sky;
      if (scene.fog) scene.fog.color.copy(sky);
    },
  };
}
