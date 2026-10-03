import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

// ---------------------------------------------------------------------------
// Units: centimetres. Table: 120 × 75 cm top, 75 cm high, seats 4.
// The table is modelled UPRIGHT inside `assembly`; while it's being built the
// whole group is flipped upside-down (face-down on a blanket), like in real life.
// ---------------------------------------------------------------------------

const TOP = { w: 120, d: 75, t: 2.5 };
const H = 75;                          // total height
const UNDER = H - TOP.t;               // underside of tabletop (72.5)
const LEG = { s: 5, h: UNDER };
const LEG_X = 53.5, LEG_Z = 31;        // leg centres
const RAIL = { h: 10, t: 2.2 };
const RAIL_Y = UNDER - RAIL.h / 2;     // 67.5
const LONG_Z = LEG_Z + LEG.s / 2 - RAIL.t / 2;   // 32.4 (flush with leg face)
const SHORT_X = LEG_X + LEG.s / 2 - RAIL.t / 2;  // 54.9
const LONG_LEN = 2 * (LEG_X - LEG.s / 2);        // 102
const SHORT_LEN = 2 * (LEG_Z - LEG.s / 2);       // 57
const BLANKET_H = 0.5;

// ---------------------------------------------------------------- Steps copy
const PARTS = {
  A: 'Tabletop', B: 'Long rail', C: 'Short rail', D: 'Leg with hanger bolt',
  E: 'Corner bracket', F: 'Wing nut', G: 'L-bracket', H: 'Wood screw 4×20',
};
const STEPS = [
  { title: 'Check the parts', desc: 'Unpack everything and lay the parts out on a clean floor. Make sure nothing is missing before you start.',
    parts: [['A',1],['B',2],['C',2],['D',4],['E',4],['F',4],['G',8],['H',16]],
    tip: 'You need: a Phillips screwdriver. Allow about 30 minutes; two people make step 8 easier.' },
  { title: 'Lay the tabletop face-down', desc: 'Spread a blanket or the cardboard packaging on the floor and place the tabletop on it, good side down, to protect it from scratches.',
    parts: [['A',1]] },
  { title: 'Position the long rails', desc: 'Stand the two long rails on their edges along the long sides of the tabletop, flush with the pre-drilled marks.',
    parts: [['B',2]] },
  { title: 'Add the short rails', desc: 'Place the two short rails at each end so the four rails form a rectangular frame.',
    parts: [['C',2]] },
  { title: 'Fix the frame with L-brackets', desc: 'Put two L-brackets on the inside of each rail. Drive one screw up into the tabletop and one sideways into the rail for every bracket.',
    parts: [['G',8],['H',16]], tip: 'Don’t over-tighten the screws into the tabletop. They are only 20 mm long for a reason.' },
  { title: 'Fit the corner brackets', desc: 'Slot a metal corner bracket diagonally across each inside corner of the frame, hooking its ends into the grooves of both rails.',
    parts: [['E',4]] },
  { title: 'Insert the legs', desc: 'Push each leg into a corner so that its hanger bolt passes through the hole in the corner bracket.',
    parts: [['D',4]] },
  { title: 'Tighten the wing nuts', desc: 'Thread a wing nut onto each hanger bolt and turn it clockwise by hand until the leg is pulled firmly into the corner.',
    parts: [['F',4]], tip: 'Check again after the first week of use and re-tighten if a leg feels loose.' },
  { title: 'Turn the table upright', desc: 'With a helper, lift the table by its frame (never by the legs) and turn it over onto its feet.',
    parts: [], tip: 'Lift, don’t drag. Twisting the legs on the floor can loosen the joints.' },
  { title: 'Done! Ready for four', desc: 'Your 4-seater dining table is assembled. Slide in the chairs and enjoy your first meal at it.',
    parts: [] },
];
const LAST = STEPS.length - 1;

// ---------------------------------------------------------------- Renderer
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

const dark = window.matchMedia('(prefers-color-scheme: dark)');
const scene = new THREE.Scene();
function applyTheme() {
  const bg = dark.matches ? 0x15181d : 0xeef0f2;
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 600, 1400);
  floorMat.color.set(dark.matches ? 0x2a2f37 : 0xdfe2e6);
}

const camera = new THREE.PerspectiveCamera(40, 1, 1, 3000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 60;
controls.maxDistance = 700;

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8a85, 1.4));
const sun = new THREE.DirectionalLight(0xfff4e5, 2.2);
sun.position.set(150, 260, 120);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -220, right: 220, top: 220, bottom: -220, near: 10, far: 700 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.4;
scene.add(sun);

// Floor
const floorMat = new THREE.MeshStandardMaterial({ color: 0xdfe2e6, roughness: 0.95 });
const floor = new THREE.Mesh(new THREE.CircleGeometry(900, 64), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
applyTheme();
dark.addEventListener?.('change', applyTheme);

// ---------------------------------------------------------------- Materials
function woodTexture(base, grain) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 140; i++) {
    const y = rnd() * c.height;
    const amp = 2 + rnd() * 8, freq = 0.002 + rnd() * 0.01, ph = rnd() * 6.28;
    g.strokeStyle = grain; g.globalAlpha = 0.05 + rnd() * 0.12; g.lineWidth = 0.6 + rnd() * 2.2;
    g.beginPath();
    for (let x = 0; x <= c.width; x += 8) {
      const yy = y + Math.sin(x * freq + ph) * amp;
      x === 0 ? g.moveTo(x, yy) : g.lineTo(x, yy);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
const oak = woodTexture('#d9b98c', '#8a6238');
const woodTop = new THREE.MeshStandardMaterial({ map: oak, roughness: 0.55 });
const wood = new THREE.MeshStandardMaterial({ map: oak, roughness: 0.6 });
const steel = new THREE.MeshStandardMaterial({ color: 0x9aa1aa, metalness: 0.85, roughness: 0.32 });
const zinc = new THREE.MeshStandardMaterial({ color: 0xc8ccd1, metalness: 0.9, roughness: 0.25 });
const blanketMat = new THREE.MeshStandardMaterial({ color: 0x6f8fb3, roughness: 1 });
const chairWood = new THREE.MeshStandardMaterial({ map: oak, roughness: 0.6, color: 0xe8e2d8 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x3f4a5a, roughness: 0.9 });
const trayMat = new THREE.MeshStandardMaterial({ color: 0xc9a77a, roughness: 0.9 });

function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const rbox = (w, h, d, r = 0.4, mat = wood) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);

// ---------------------------------------------------------------- Scene objects
const assembly = new THREE.Group();          // everything that becomes the table
scene.add(assembly);

// Group transform per phase (upside-down while building, upright afterwards)
const FLIP_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
const G_BUILD = { p: new THREE.Vector3(0, H + BLANKET_H, 0), q: FLIP_Q.clone() };
const G_UP = { p: new THREE.Vector3(0, 0, 0), q: new THREE.Quaternion() };
const G_BUILD_M = new THREE.Matrix4().compose(G_BUILD.p, G_BUILD.q, new THREE.Vector3(1, 1, 1));
const G_BUILD_INV = G_BUILD_M.clone().invert();

const parts = [];   // { obj, step, layout:{p,q}, final:{p,q}, approach:Vector3|null, spin:{axis,turns}|null, delay, arc }

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Qe = (x = 0, y = 0, z = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));

// Convert a pose given in WORLD space (for laying parts out on the floor)
// into assembly-local space, assuming the build-phase group transform.
function worldToLocal(p, q) {
  const m = new THREE.Matrix4().compose(p, q, V(1, 1, 1)).premultiply(G_BUILD_INV);
  const pp = new THREE.Vector3(), qq = new THREE.Quaternion(), s = new THREE.Vector3();
  m.decompose(pp, qq, s);
  return { p: pp, q: qq };
}

function addPart(obj, o) {
  assembly.add(obj);
  const part = {
    obj, step: o.step,
    layout: worldToLocal(o.layout.p, o.layout.q),
    final: { p: o.final.p.clone(), q: o.final.q.clone() },
    approach: o.approach || null,        // local offset from final pose
    spin: o.spin || null,                // { axis: local Vector3, turns }
    delay: o.delay || 0,
    arc: o.arc ?? 30,
  };
  obj.traverse(c => { if (c.isMesh) c.userData.baseEmissive = c.material; });
  parts.push(part);
  return part;
}

// --- A. Tabletop
{
  const top = rbox(TOP.w, TOP.t, TOP.d, 0.9, woodTop);
  addPart(top, {
    step: 1,
    layout: { p: V(0, TOP.t / 2, -100), q: Qe() },                 // face-up, behind the blanket
    final: { p: V(0, UNDER + TOP.t / 2, 0), q: Qe() },
    arc: 70,
  });
}

// Blanket (not part of the table)
const blanket = mesh(new RoundedBoxGeometry(140, BLANKET_H, 95, 2, 0.2), blanketMat);
blanket.position.y = BLANKET_H / 2;
scene.add(blanket);

// Hardware tray (decor for the parts layout)
const tray = mesh(new RoundedBoxGeometry(56, 1, 44, 2, 0.4), trayMat);
tray.position.set(92, 0.5, 80);
scene.add(tray);

// --- B. Long rails
[-1, 1].forEach((sz, i) => {
  const r = rbox(LONG_LEN, RAIL.h, RAIL.t, 0.35);
  addPart(r, {
    step: 2, delay: i * 0.15,
    layout: { p: V(-10, RAIL.t / 2, 64 + i * 14), q: Qe(Math.PI / 2, 0, 0) },
    final: { p: V(0, RAIL_Y, sz * LONG_Z), q: Qe() },
    approach: V(0, -25, 0), arc: 40,
  });
});

// --- C. Short rails
[-1, 1].forEach((sx, i) => {
  const r = rbox(RAIL.t, RAIL.h, SHORT_LEN, 0.35);
  addPart(r, {
    step: 3, delay: i * 0.15,
    layout: { p: V(-100 + i * 14, RAIL.t / 2, 10), q: Qe(0, 0, Math.PI / 2) },
    final: { p: V(sx * SHORT_X, RAIL_Y, 0), q: Qe() },
    approach: V(0, -25, 0), arc: 40,
  });
});

// --- G. L-brackets (+ H. screws)
function makeLBracket() {
  const g = new THREE.Group();
  const a = mesh(new THREE.BoxGeometry(4, 0.3, 3), steel);   // horizontal flange (under tabletop)
  a.position.set(0, -0.15, -1.5);
  const b = mesh(new THREE.BoxGeometry(4, 3, 0.3), steel);   // vertical flange (against rail)
  b.position.set(0, -1.5, -0.15);
  g.add(a, b);
  return g;
}
function makeScrew() {
  // axis = +Y, tip at +Y, head at 0
  const g = new THREE.Group();
  const shaft = mesh(new THREE.CylinderGeometry(0.2, 0.08, 2, 10), zinc);
  shaft.position.y = 1;
  const head = mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.25, 16), zinc);
  head.position.y = -0.12;
  const slot = mesh(new THREE.BoxGeometry(0.7, 0.08, 0.12), steel);
  slot.position.y = -0.26;
  const slot2 = slot.clone(); slot2.rotation.y = Math.PI / 2;
  g.add(shaft, head, slot, slot2);
  return g;
}

const railFaces = [
  // inner-face point on rail (upright local), yaw so local -Z points inward
  { base: V(0, UNDER, LONG_Z - RAIL.t / 2), yaw: 0, along: V(1, 0, 0), span: 30 },
  { base: V(0, UNDER, -(LONG_Z - RAIL.t / 2)), yaw: Math.PI, along: V(1, 0, 0), span: 30 },
  { base: V(SHORT_X - RAIL.t / 2, UNDER, 0), yaw: Math.PI / 2, along: V(0, 0, 1), span: 14 },
  { base: V(-(SHORT_X - RAIL.t / 2), UNDER, 0), yaw: -Math.PI / 2, along: V(0, 0, 1), span: 14 },
];
let bi = 0, si = 0;
railFaces.forEach(f => {
  [-1, 1].forEach(k => {
    const pos = f.base.clone().addScaledVector(f.along, k * f.span);
    const q = Qe(0, f.yaw, 0);
    const bM = new THREE.Matrix4().compose(pos, q, V(1, 1, 1));
    const lx = bi % 8, delay = bi * 0.04;
    addPart(makeLBracket(), {
      step: 4, delay,
      layout: { p: V(70 + lx * 6, 1.5, 68), q: Qe(Math.PI, 0, 0) },
      final: { p: pos, q },
      approach: V(0, -12, 0), arc: 25,
    });
    // two screws per bracket
    const screwDefs = [
      { lp: V(0, -0.3, -1.9), lq: Qe(0, 0, 0), dir: V(0, 1, 0) },                 // up into tabletop
      { lp: V(0, -1.9, -0.3), lq: Qe(Math.PI / 2, 0, 0), dir: V(0, 0, 1) },       // sideways into rail
    ];
    screwDefs.forEach(sd => {
      const m = new THREE.Matrix4().compose(sd.lp, sd.lq, V(1, 1, 1)).premultiply(bM);
      const p = new THREE.Vector3(), qq = new THREE.Quaternion(), s = new THREE.Vector3();
      m.decompose(p, qq, s);
      // screws are driven in: final position has shaft buried, head on flange
      const dirWorld = sd.dir.clone().applyQuaternion(q);
      const row = Math.floor(si / 8), col = si % 8;
      addPart(makeScrew(), {
        step: 4, delay: 0.35 + bi * 0.03,
        layout: { p: V(70 + col * 6, 1.4, 80 + row * 6), q: Qe(0, 0, Math.PI / 2) },
        final: { p, q: qq },
        approach: dirWorld.clone().multiplyScalar(-6),
        spin: { axis: V(0, 1, 0), turns: 5 }, arc: 20,
      });
      si++;
    });
    bi++;
  });
});

// --- E. Corner brackets, D. Legs (with hanger bolts), F. Wing nuts
const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
function makeCornerBracket() {
  const g = new THREE.Group();
  const plate = mesh(new THREE.BoxGeometry(11.3, 6, 0.3), steel);
  const tabL = mesh(new THREE.BoxGeometry(0.3, 5, 1.6), steel);
  tabL.position.set(-5.9, 0, 0.55); tabL.rotation.y = Math.PI / 4;
  const tabR = tabL.clone(); tabR.position.x = 5.9; tabR.rotation.y = -Math.PI / 4;
  const ring = mesh(new THREE.TorusGeometry(0.75, 0.18, 8, 20), zinc);
  g.add(plate, tabL, tabR, ring);
  return g;
}
function makeLeg() {
  const g = new THREE.Group();
  const leg = rbox(LEG.s, LEG.h, LEG.s, 0.5);
  g.add(leg);
  return g;
}
function makeHangerBolt() {
  const g = new THREE.Group(); // axis +Y
  const shaft = mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 12), zinc);
  shaft.position.y = 3.5;
  g.add(shaft);
  return g;
}
function makeWingNut() {
  const g = new THREE.Group(); // axis +Y
  const hub = mesh(new THREE.CylinderGeometry(0.85, 0.95, 1.2, 12), zinc);
  const wing1 = mesh(new THREE.BoxGeometry(1.5, 1.6, 0.3), zinc);
  wing1.position.set(1.45, 0.3, 0);
  const wing2 = wing1.clone(); wing2.position.x = -1.45;
  g.add(hub, wing1, wing2);
  return g;
}
const Y_AXIS = V(0, 1, 0), Z_AXIS = V(0, 0, 1);
const rot = (from, to) => new THREE.Quaternion().setFromUnitVectors(from, to.clone().normalize());

corners.forEach(([sx, sz], i) => {
  const dir = V(-sx, 0, -sz).normalize();                                // from leg corner inward
  const innerCorner = V(sx * (LEG_X - LEG.s / 2), RAIL_Y, sz * (LEG_Z - LEG.s / 2));
  const inner = V(sx * (SHORT_X - RAIL.t / 2), RAIL_Y, sz * (LONG_Z - RAIL.t / 2));
  const plateCenter = inner.clone().add(V(-sx * 4, 0, -sz * 4));         // plate across the corner
  const plateQ = rot(Z_AXIS, dir);

  addPart(makeCornerBracket(), {
    step: 5, delay: i * 0.12,
    layout: { p: V(70 + i * 12, 1.2, 92), q: Qe(-Math.PI / 2, 0, 0) },
    final: { p: plateCenter, q: plateQ },
    approach: dir.clone().multiplyScalar(8).add(V(0, -10, 0)), arc: 25,
  });

  // Leg group: leg + hanger bolt (bolt is factory-fitted in the leg)
  const legG = makeLeg();
  const bolt = makeHangerBolt();
  // bolt local to leg: leg centre at (sx*LEG_X, LEG.h/2, sz*LEG_Z)
  const legCenter = V(sx * LEG_X, LEG.h / 2, sz * LEG_Z);
  const boltStart = innerCorner.clone().addScaledVector(dir, -1.2);
  bolt.position.copy(boltStart.clone().sub(legCenter));
  bolt.quaternion.copy(rot(Y_AXIS, dir));
  legG.add(bolt);
  addPart(legG, {
    step: 6, delay: i * 0.18,
    layout: { p: V(118 + i * 8, LEG.s / 2, -10), q: Qe(Math.PI / 2, 0, 0) },
    final: { p: legCenter, q: Qe() },
    approach: V(sx * 7, 0, sz * 7).add(V(0, -0, 0)), arc: 90,
  });

  // Wing nut on the bolt, just past the plate
  const distToPlate = inner.clone().add(V(-sx * 4, 0, -sz * 4)).sub(innerCorner).dot(dir);
  const nutPos = innerCorner.clone().addScaledVector(dir, distToPlate + 0.75);
  addPart(makeWingNut(), {
    step: 7, delay: i * 0.15,
    layout: { p: V(72 + i * 8, 0.6, 100), q: Qe() },
    final: { p: nutPos, q: rot(Y_AXIS, dir) },
    approach: dir.clone().multiplyScalar(5),
    spin: { axis: V(0, 1, 0), turns: 6 }, arc: 25,
  });
});

// --- Chairs (appear at the end)
function makeChair() {
  const g = new THREE.Group();
  const seatH = 45;
  const seat = rbox(42, 4, 42, 1.5, seatMat); seat.position.y = seatH;
  g.add(seat);
  [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([x, z]) => {
    const l = rbox(3.5, seatH - 2, 3.5, 0.6, chairWood);
    l.position.set(x * 17.5, (seatH - 2) / 2, z * 17.5);
    g.add(l);
  });
  [-1, 1].forEach(x => {
    const post = rbox(3.5, 42, 3.5, 0.6, chairWood);
    post.position.set(x * 17.5, seatH + 21, 17.5);
    g.add(post);
  });
  const back = rbox(38, 14, 2.5, 1, chairWood);
  back.position.set(0, seatH + 32, 17.5);
  g.add(back);
  return g;
}
const chairs = [
  { x: -28, z: 1 }, { x: 28, z: 1 }, { x: -28, z: -1 }, { x: 28, z: -1 },
].map(({ x, z }, i) => {
  const c = makeChair();
  const finalP = V(x, 0, z * 58);
  const startP = V(x, 0, z * 120);
  c.rotation.y = z > 0 ? 0 : Math.PI;       // backrest away from table
  c.position.copy(startP);
  c.visible = false;
  scene.add(c);
  return { obj: c, startP, finalP, delay: i * 0.12 };
});

// ---------------------------------------------------------------- Camera views per step
const VIEWS = [
  { pos: V(-40, 230, 290), target: V(10, 0, 0) },     // 0 parts
  { pos: V(-150, 150, 190), target: V(0, 0, 0) },     // 1 tabletop
  { pos: V(-140, 140, 170), target: V(0, 5, 0) },
  { pos: V(-160, 130, 150), target: V(0, 5, 0) },
  { pos: V(120, 105, 135), target: V(25, 4, 12) },    // 4 L-brackets close-up
  { pos: V(125, 100, 120), target: V(35, 6, 18) },    // 5 corner brackets
  { pos: V(-150, 160, 180), target: V(0, 35, 0) },    // 6 legs
  { pos: V(160, 125, 150), target: V(30, 20, 15) },   // 7 wing nuts
  { pos: V(-180, 150, 200), target: V(0, 40, 0) },    // 8 flip
  { pos: V(-170, 150, 210), target: V(0, 35, 0) },    // 9 done
];

// Pull the camera back on narrow / portrait screens
function viewFor(s) {
  const v = VIEWS[s];
  const aspect = window.innerWidth / window.innerHeight;
  const k = aspect < 1 ? Math.min(2.1, 1.25 / aspect) : 1;
  return { pos: v.target.clone().add(v.pos.clone().sub(v.target).multiplyScalar(k)), target: v.target };
}

// ---------------------------------------------------------------- Animation
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = t => Math.min(1, Math.max(0, t));
const DUR = 2.6;          // seconds per step
const FLIP_DUR = 3.2;

const worldUpLocal = V(0, 1, 0).applyQuaternion(FLIP_Q.clone().invert()); // (0,-1,0)
const tmpQ = new THREE.Quaternion();

function poseAtStepEnd(part, s) {
  return s >= part.step ? part.final : part.layout;
}

function applyPartAnim(part, s, t) {
  // t in [0,1] (already includes delay mapping); only called for part.step === s
  const { obj, layout, final } = part;
  const approachP = part.approach ? final.p.clone().add(part.approach) : final.p.clone();
  let p, q;
  const split = part.approach ? 0.65 : 1;
  if (t < split) {
    const u = ease(t / split);
    p = layout.p.clone().lerp(approachP, u);
    p.addScaledVector(worldUpLocal, Math.sin(Math.PI * u) * part.arc);
    q = layout.q.clone().slerp(final.q, u);
  } else {
    const u = ease((t - split) / (1 - split));
    p = approachP.lerp(final.p, u);
    q = final.q.clone();
  }
  if (part.spin && t >= split) {
    const u = (t - split) / (1 - split);
    tmpQ.setFromAxisAngle(part.spin.axis, -(1 - u) * part.spin.turns * Math.PI * 2);
    q = q.clone().multiply(tmpQ);
  }
  obj.position.copy(p);
  obj.quaternion.copy(q);
}

function setGroup(pose) {
  assembly.position.copy(pose.p);
  assembly.quaternion.copy(pose.q);
}

function snapTo(s) {
  parts.forEach(part => {
    const pose = poseAtStepEnd(part, s);
    part.obj.position.copy(pose.p);
    part.obj.quaternion.copy(pose.q);
  });
  setGroup(s >= 8 ? G_UP : G_BUILD);
  blanket.visible = s >= 1 && s < 8;
  blanket.scale.set(1, 1, 1);
  tray.visible = s < 8;
  chairs.forEach(c => { c.visible = s >= 9; c.obj.position.copy(s >= 9 ? c.finalP : c.startP); c.obj.visible = s >= 9; });
  setHighlight(s, 0);
}

// Highlight parts of the current step with a soft emissive pulse
const highlightColor = new THREE.Color(0x3b82f6);
const materialCache = new Map();
function hlMat(m) {
  if (!materialCache.has(m)) {
    const c = m.clone();
    c.emissive = highlightColor.clone();
    c.emissiveIntensity = 0;
    materialCache.set(m, c);
  }
  return materialCache.get(m);
}
let highlighted = [];
function setHighlight(s, intensity) {
  highlighted.forEach(o => o.traverse(c => { if (c.isMesh) c.material = c.userData.baseEmissive; }));
  highlighted = [];
  if (intensity <= 0) return;
  parts.filter(p => p.step === s).forEach(p => {
    p.obj.traverse(c => { if (c.isMesh) { const hm = hlMat(c.userData.baseEmissive); hm.emissiveIntensity = intensity; c.material = hm; } });
    highlighted.push(p.obj);
  });
}

let current = 0;
let anim = null;                   // { step, t0, dur, camFrom, camTo }
const clock = new THREE.Clock();

function playStep(s) {
  // snap to state at end of s-1, then animate s
  snapTo(s - 1);
  if (s >= 1) blanket.visible = true;
  if (s === 9) chairs.forEach(c => { c.obj.visible = true; c.obj.position.copy(c.startP); });
  const dur = s === 8 ? FLIP_DUR : DUR;
  anim = {
    step: s, t: 0, dur: dur + 0.6,
    camFromP: camera.position.clone(), camFromT: controls.target.clone(),
    camToP: viewFor(s).pos, camToT: viewFor(s).target,
  };
}

function tick(dt) {
  if (!anim) return;
  anim.t += dt;
  const s = anim.step;
  const T = anim.t / anim.dur;

  // camera glides during the first part of the animation
  const cu = ease(clamp01(anim.t / 1.4));
  camera.position.lerpVectors(anim.camFromP, anim.camToP, cu);
  controls.target.lerpVectors(anim.camFromT, anim.camToT, cu);

  const partT = (d) => clamp01((anim.t - 0.35 - d * DUR) / (DUR * 0.62));
  parts.filter(p => p.step === s).forEach(p => applyPartAnim(p, s, partT(p.delay)));

  if (s === 8) {
    const u = ease(clamp01((anim.t - 0.4) / (FLIP_DUR - 0.4)));
    // rotate the whole table about its long axis, lifting it clear of the floor
    const q = G_BUILD.q.clone().slerp(G_UP.q, u);
    const lift = Math.sin(Math.PI * u) * 75;
    // keep the table's centre (~y=37.5 local) moving smoothly
    const centreLocal = V(0, H / 2, 0);
    const startCentre = centreLocal.clone().applyQuaternion(G_BUILD.q).add(G_BUILD.p);
    const endCentre = centreLocal.clone().applyQuaternion(G_UP.q).add(G_UP.p);
    const centre = startCentre.lerp(endCentre, u).add(V(0, lift, 0));
    const p = centre.sub(centreLocal.clone().applyQuaternion(q));
    setGroup({ p, q });
    blanket.visible = u < 0.98;
    blanket.scale.setScalar(1);
  }
  if (s === 9) {
    chairs.forEach(c => {
      const u = ease(clamp01((anim.t - 0.4 - c.delay * 3) / 1.6));
      c.obj.position.lerpVectors(c.startP, c.finalP, u);
    });
  }

  const pulse = anim.t < anim.dur ? 0.35 * Math.sin(Math.PI * clamp01(anim.t / anim.dur)) : 0;
  setHighlight(s, pulse);

  if (anim.t >= anim.dur) {
    snapTo(s);
    anim = null;
    onAnimDone();
  }
}

// ---------------------------------------------------------------- UI
const $ = id => document.getElementById(id);
const progress = $('progress');
STEPS.forEach((st, i) => {
  const b = document.createElement('button');
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-label', `Step ${i}: ${st.title}`);
  b.title = `${i}. ${st.title}`;
  b.addEventListener('click', () => goTo(i, false));
  progress.appendChild(b);
});
$('stepCount').textContent = `of ${LAST}`;

function renderUI() {
  const st = STEPS[current];
  $('stepBadge').textContent = current === 0 ? 'Before you start' : `Step ${current}`;
  $('stepCount').textContent = current === 0 ? '' : `of ${LAST}`;
  $('stepTitle').textContent = st.title;
  $('stepDesc').textContent = st.desc;
  const ul = $('stepParts');
  ul.innerHTML = '';
  st.parts.forEach(([k, n]) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="tag">${k}</span><span class="name">${PARTS[k]}</span><span class="qty">×${n}</span>`;
    ul.appendChild(li);
  });
  const tip = $('stepTip');
  tip.hidden = !st.tip;
  tip.textContent = st.tip || '';
  [...progress.children].forEach((b, i) => {
    b.classList.toggle('active', i === current);
    b.classList.toggle('done', i < current);
    b.setAttribute('aria-selected', i === current);
  });
  $('prevBtn').disabled = current === 0;
  $('nextBtn').textContent = current === LAST ? 'Start over ↺' : 'Next →';
}

function goTo(s, animate = true) {
  s = Math.max(0, Math.min(LAST, s));
  current = s;
  if (animate && s > 0) {
    playStep(s);
  } else {
    anim = null;
    snapTo(s);
    // smooth camera move without replaying parts
    anim = null;
    camGlide(viewFor(s));
  }
  renderUI();
}

let glide = null;
function camGlide(v) {
  glide = { t: 0, fromP: camera.position.clone(), fromT: controls.target.clone(), toP: v.pos, toT: v.target };
}
function tickGlide(dt) {
  if (!glide) return;
  glide.t += dt;
  const u = ease(clamp01(glide.t / 1.2));
  camera.position.lerpVectors(glide.fromP, glide.toP, u);
  controls.target.lerpVectors(glide.fromT, glide.toT, u);
  if (u >= 1) glide = null;
}

let autoplay = false;
function setAutoplay(on) {
  autoplay = on;
  $('playIcon').innerHTML = on ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
  $('playBtn').setAttribute('aria-label', on ? 'Pause auto-play' : 'Auto-play all steps');
  if (on) {
    if (current === LAST) { goTo(0, false); setTimeout(() => autoplay && goTo(1), 1400); }
    else if (!anim) goTo(current + 1);
  }
}
function onAnimDone() {
  if (autoplay) {
    if (current < LAST) setTimeout(() => autoplay && !anim && goTo(current + 1), 1100);
    else setAutoplay(false);
  }
}

$('nextBtn').addEventListener('click', () => { if (current === LAST) { setAutoplay(false); goTo(0, false); } else goTo(current + 1); });
$('prevBtn').addEventListener('click', () => { setAutoplay(false); goTo(current - 1, false); });
$('replayBtn').addEventListener('click', () => { if (current > 0) playStep(current); });
$('playBtn').addEventListener('click', () => setAutoplay(!autoplay));
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') $('nextBtn').click();
  else if (e.key === 'ArrowLeft') $('prevBtn').click();
  else if (e.key === ' ') { e.preventDefault(); $('playBtn').click(); }
});
controls.addEventListener('start', () => { glide = null; });

// ---------------------------------------------------------------- Resize & loop
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  // On narrow screens pull the camera back a little; on wide screens shift view left of the panel
  camera.fov = w < 760 ? 52 : 40;
  if (w >= 760) camera.setViewOffset(w, h, 180, 0, w, h);
  else camera.setViewOffset(w, h, 0, h * 0.2, w, h);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

camera.position.copy(viewFor(0).pos);
controls.target.copy(viewFor(0).target);
snapTo(0);
renderUI();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  tick(dt);
  tickGlide(dt);
  controls.update();
  renderer.render(scene, camera);
});

requestAnimationFrame(() => $('loader').classList.add('hide'));

// expose for debugging / screenshots
window.__guide = { goTo, snapTo, camera, controls, VIEWS, get current() { return current; }, get busy() { return !!anim; } };
