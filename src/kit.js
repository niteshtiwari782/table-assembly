// Shared building blocks for every furniture guide: maths helpers, materials, hardware.
// Units are centimetres throughout.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

export { THREE };

// ---------------------------------------------------------------- Maths
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const Qe = (x = 0, y = 0, z = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
// seq(a, b, …): apply rotation a first, then b, … (all about world axes)
export const seq = (...qs) => qs.reduce((acc, q) => q.clone().multiply(acc), new THREE.Quaternion());
export const X_AXIS = V(1, 0, 0), Y_AXIS = V(0, 1, 0), Z_AXIS = V(0, 0, 1);
export const rot = (from, to) => new THREE.Quaternion().setFromUnitVectors(from, to.clone().normalize());

export const m4 = pose => new THREE.Matrix4().compose(pose.p, pose.q, V(1, 1, 1));
export function toPose(m) {
  const p = V(), q = new THREE.Quaternion(), s = V();
  m.decompose(p, q, s);
  return { p, q };
}
// A pose given relative to `frame` (itself a pose) → the same pose in frame's parent space
export const within = (frame, p, q = new THREE.Quaternion()) => toPose(m4(frame).multiply(m4({ p, q })));

export function rng(seed = 7) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

// ---------------------------------------------------------------- Textures
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
export { canvasTexture };

export function woodTexture(base, grain, seed = 7) {
  return canvasTexture(1024, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const rnd = rng(seed);
    for (let i = 0; i < 140; i++) {
      const y = rnd() * h;
      const amp = 2 + rnd() * 8, freq = 0.002 + rnd() * 0.01, ph = rnd() * 6.28;
      g.strokeStyle = grain; g.globalAlpha = 0.05 + rnd() * 0.12; g.lineWidth = 0.6 + rnd() * 2.2;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = y + Math.sin(x * freq + ph) * amp;
        x === 0 ? g.moveTo(x, yy) : g.lineTo(x, yy);
      }
      g.stroke();
    }
  });
}

function fabricTexture(seed = 3) {
  const t = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const rnd = rng(seed);
    for (let i = 0; i < 5000; i++) {
      g.fillStyle = rnd() < 0.5 ? '#000' : '#fff';
      g.globalAlpha = 0.04 + rnd() * 0.06;
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1);
    }
    g.globalAlpha = 0.05; g.strokeStyle = '#000';
    for (let y = 0; y < h; y += 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });
  t.repeat.set(4, 4);
  return t;
}

// ---------------------------------------------------------------- Materials
const oakTex = woodTexture('#d9b98c', '#8a6238', 7);
const walnutTex = woodTexture('#8a5d3b', '#3b2414', 11);
const pineTex = woodTexture('#e8cfa6', '#a77b4f', 23);
const fabricTex = fabricTexture(3);
const std = o => new THREE.MeshStandardMaterial(o);

export const M = {
  oakTop: std({ map: oakTex, roughness: 0.55 }),
  oak: std({ map: oakTex, roughness: 0.6 }),
  walnut: std({ map: walnutTex, roughness: 0.5 }),
  pine: std({ map: pineTex, roughness: 0.65 }),
  white: std({ color: 0xf3f1ec, roughness: 0.45 }),
  hardboard: std({ color: 0xe9e5dd, roughness: 0.7 }),
  steel: std({ color: 0x9aa1aa, metalness: 0.85, roughness: 0.32 }),
  zinc: std({ color: 0xc8ccd1, metalness: 0.9, roughness: 0.25 }),
  brass: std({ color: 0xc9a45c, metalness: 0.9, roughness: 0.3 }),
  blanket: std({ color: 0x6f8fb3, roughness: 1 }),
  tray: std({ color: 0xc9a77a, roughness: 0.9 }),
  fabric: std({ map: fabricTex, color: 0x8d97a5, roughness: 0.95 }),
  cushion: std({ map: fabricTex, color: 0x9ea8b5, roughness: 0.95 }),
  mattress: std({ map: fabricTex, color: 0xf3f1ec, roughness: 0.9 }),
  duvet: std({ map: fabricTex, color: 0xb7c6d6, roughness: 0.95 }),
  linen: std({ map: fabricTex, color: 0xfbfaf7, roughness: 0.95 }),
  accentA: std({ map: fabricTex, color: 0xd99a5b, roughness: 0.95 }),
  accentB: std({ map: fabricTex, color: 0x5e7d6b, roughness: 0.95 }),
};

// ---------------------------------------------------------------- Meshes
export function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function rbox(w, h, d, r = 0.4, mat = M.oak) {
  r = Math.max(0.01, Math.min(r, Math.min(w, h, d) / 2 - 0.01));
  return mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
}
export const box = (w, h, d, mat = M.oak) => mesh(new THREE.BoxGeometry(w, h, d), mat);
export const cyl = (rt, rb, h, mat = M.oak, seg = 16) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
export const group = (...children) => { const g = new THREE.Group(); children.length && g.add(...children); return g; };
export const at = (obj, x, y, z) => { obj.position.set(x, y, z); return obj; };

// ---------------------------------------------------------------- Hardware
// All fasteners: axis = +Y, tip at +Y, head at 0.
export function makeScrew(len = 2, r = 0.2) {
  const shaft = at(cyl(r, r * 0.4, len, M.zinc, 10), 0, len / 2, 0);
  const head = at(cyl(r * 2.5, r * 2.25, 0.25, M.zinc), 0, -0.12, 0);
  const slot = at(box(r * 3.5, 0.08, 0.12, M.steel), 0, -0.26, 0);
  const slot2 = slot.clone(); slot2.rotation.y = Math.PI / 2;
  return group(shaft, head, slot, slot2);
}
export function makeNail(len = 2) {
  return group(at(cyl(0.08, 0.05, len, M.zinc, 8), 0, len / 2, 0), at(cyl(0.22, 0.22, 0.08, M.zinc, 12), 0, -0.04, 0));
}
export function makeCamLock() {
  // disc in the panel face; axis +Y
  const disc = cyl(0.75, 0.75, 0.5, M.zinc, 20);
  const slot = at(box(1, 0.1, 0.16, M.steel), 0, 0.26, 0);
  const slot2 = slot.clone(); slot2.rotation.y = Math.PI / 2;
  return group(disc, slot, slot2);
}
export function makeCamPin() {
  // the part that sticks out of the panel; axis +Y
  return group(at(cyl(0.22, 0.22, 1.1, M.zinc, 10), 0, 0.55, 0), at(new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), M.zinc), 0, 1.2, 0));
}
export function makeShelfPin() {
  return group(at(cyl(0.25, 0.25, 1.6, M.brass, 10), 0, 0.8, 0));
}
export function makeLBracket(w = 4, a = 3) {
  // origin on the inside corner; horizontal flange goes −Z, vertical flange goes −Y
  return group(at(box(w, 0.3, a, M.steel), 0, -0.15, -a / 2), at(box(w, a, 0.3, M.steel), 0, -a / 2, -0.15));
}
export function makeBlanket(w, d) {
  const b = rbox(w, 0.5, d, 0.2, M.blanket);
  b.position.y = 0.25;
  return b;
}
export function makeTray(w = 56, d = 44) {
  const t = rbox(w, 1, d, 0.4, M.tray);
  t.position.y = 0.5;
  return t;
}
