// 4-seater dining table: 120 × 75 cm top, 75 cm high.
// Modelled upright; built upside-down on a blanket, then turned over.
import { THREE, V, Qe, rot, rbox, mesh, M, Y_AXIS, Z_AXIS, makeScrew, makeLBracket, makeBlanket, makeTray, group, at } from './kit.js';

const TOP = { w: 120, d: 75, t: 2.5 };
const H = 75;
const UNDER = H - TOP.t;
const LEG = { s: 5, h: UNDER };
const LEG_X = 53.5, LEG_Z = 31;
const RAIL = { h: 10, t: 2.2 };
const RAIL_Y = UNDER - RAIL.h / 2;
const LONG_Z = LEG_Z + LEG.s / 2 - RAIL.t / 2;
const SHORT_X = LEG_X + LEG.s / 2 - RAIL.t / 2;
const LONG_LEN = 2 * (LEG_X - LEG.s / 2);
const SHORT_LEN = 2 * (LEG_Z - LEG.s / 2);
const BLANKET_H = 0.5;

const PARTS = {
  A: 'Tabletop', B: 'Long rail', C: 'Short rail', D: 'Leg with hanger bolt',
  E: 'Corner bracket', F: 'Wing nut', G: 'L-bracket', H: 'Wood screw 4×20',
};
const STEPS = [
  { title: 'Check the parts', desc: 'Unpack everything and lay the parts out on a clean floor. Make sure nothing is missing before you start.',
    parts: [['A', 1], ['B', 2], ['C', 2], ['D', 4], ['E', 4], ['F', 4], ['G', 8], ['H', 16]],
    tip: 'You need: a Phillips screwdriver. Allow about 30 minutes; two people make step 8 easier.' },
  { title: 'Lay the tabletop face-down', desc: 'Spread a blanket or the cardboard packaging on the floor and place the tabletop on it, good side down, to protect it from scratches.',
    parts: [['A', 1]] },
  { title: 'Position the long rails', desc: 'Stand the two long rails on their edges along the long sides of the tabletop, flush with the pre-drilled marks.',
    parts: [['B', 2]] },
  { title: 'Add the short rails', desc: 'Place the two short rails at each end so the four rails form a rectangular frame.',
    parts: [['C', 2]] },
  { title: 'Fix the frame with L-brackets', desc: 'Put two L-brackets on the inside of each rail. Drive one screw up into the tabletop and one sideways into the rail for every bracket.',
    parts: [['G', 8], ['H', 16]], tip: 'Don’t over-tighten the screws into the tabletop. They are only 20 mm long for a reason.' },
  { title: 'Fit the corner brackets', desc: 'Slot a metal corner bracket diagonally across each inside corner of the frame, hooking its ends into the grooves of both rails.',
    parts: [['E', 4]] },
  { title: 'Insert the legs', desc: 'Push each leg into a corner so that its hanger bolt passes through the hole in the corner bracket.',
    parts: [['D', 4]] },
  { title: 'Tighten the wing nuts', desc: 'Thread a wing nut onto each hanger bolt and turn it clockwise by hand until the leg is pulled firmly into the corner.',
    parts: [['F', 4]], tip: 'Check again after the first week of use and re-tighten if a leg feels loose.' },
  { title: 'Turn the table upright', desc: 'With a helper, lift the table by its frame (never by the legs) and turn it over onto its feet.',
    parts: [], tip: 'Lift, don’t drag. Twisting the legs on the floor can loosen the joints.' },
  { title: 'Done! Ready for four', desc: 'Your 4-seater dining table is assembled. Slide in the chairs and enjoy your first meal at it.',
    parts: [] },
];

const VIEWS = [
  { pos: V(-40, 230, 290), target: V(10, 0, 0) },
  { pos: V(-150, 150, 190), target: V(0, 0, 0) },
  { pos: V(-140, 140, 170), target: V(0, 5, 0) },
  { pos: V(-160, 130, 150), target: V(0, 5, 0) },
  { pos: V(120, 105, 135), target: V(25, 4, 12) },
  { pos: V(125, 100, 120), target: V(35, 6, 18) },
  { pos: V(-150, 160, 180), target: V(0, 35, 0) },
  { pos: V(160, 125, 150), target: V(30, 20, 15) },
  { pos: V(-180, 150, 200), target: V(0, 40, 0) },
  { pos: V(-170, 150, 210), target: V(0, 35, 0) },
];

const rbx = (w, h, d, r, mat = M.oak) => rbox(w, h, d, r, mat);
const chairWood = new THREE.MeshStandardMaterial({ map: M.oak.map, roughness: 0.6, color: 0xe8e2d8 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x3f4a5a, roughness: 0.9 });

function makeCornerBracket() {
  const plate = mesh(new THREE.BoxGeometry(11.3, 6, 0.3), M.steel);
  const tabL = mesh(new THREE.BoxGeometry(0.3, 5, 1.6), M.steel);
  tabL.position.set(-5.9, 0, 0.55); tabL.rotation.y = Math.PI / 4;
  const tabR = tabL.clone(); tabR.position.x = 5.9; tabR.rotation.y = -Math.PI / 4;
  const ring = mesh(new THREE.TorusGeometry(0.75, 0.18, 8, 20), M.zinc);
  return group(plate, tabL, tabR, ring);
}
function makeWingNut() {
  const hub = mesh(new THREE.CylinderGeometry(0.85, 0.95, 1.2, 12), M.zinc);
  const wing1 = at(mesh(new THREE.BoxGeometry(1.5, 1.6, 0.3), M.zinc), 1.45, 0.3, 0);
  const wing2 = wing1.clone(); wing2.position.x = -1.45;
  return group(hub, wing1, wing2);
}
function makeChair() {
  const g = new THREE.Group();
  const seatH = 45;
  g.add(at(rbx(42, 4, 42, 1.5, seatMat), 0, seatH, 0));
  [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([x, z]) => g.add(at(rbx(3.5, seatH - 2, 3.5, 0.6, chairWood), x * 17.5, (seatH - 2) / 2, z * 17.5)));
  [-1, 1].forEach(x => g.add(at(rbx(3.5, 42, 3.5, 0.6, chairWood), x * 17.5, seatH + 21, 17.5)));
  g.add(at(rbx(38, 14, 2.5, 1, chairWood), 0, seatH + 32, 17.5));
  return g;
}

export default {
  id: 'dining-table',
  short: 'Dining table',
  title: 'Dining Table Assembly',
  tagline: '4-seater · flat-pack · 3D step-by-step',
  time: '30 min', people: 2, blurb: 'Rails, corner brackets and wing-nut legs, built upside-down on a blanket.',
  icon: '<rect x="3" y="8" width="26" height="4" rx="1.5"/><rect x="6" y="12" width="3" height="14" rx="1"/><rect x="23" y="12" width="3" height="14" rx="1"/>',
  parts: PARTS,
  steps: STEPS,
  views: VIEWS,
  flip: {
    step: 8, dur: 3.2, lift: 75, centre: V(0, H / 2, 0),
    build: { p: V(0, H + BLANKET_H, 0), q: Qe(Math.PI, 0, 0) },
    up: { p: V(0, 0, 0), q: Qe() },
  },

  build({ addPart, world }) {
    // A. Tabletop
    addPart(rbx(TOP.w, TOP.t, TOP.d, 0.9, M.oakTop), {
      step: 1,
      layout: { p: V(0, TOP.t / 2, -100), q: Qe() },
      final: { p: V(0, UNDER + TOP.t / 2, 0), q: Qe() },
      arc: 70,
    });

    const blanket = makeBlanket(140, 95);
    const tray = makeTray();
    tray.position.set(92, 0.5, 80);
    world.add(blanket, tray);

    // B. Long rails
    [-1, 1].forEach((sz, i) => addPart(rbx(LONG_LEN, RAIL.h, RAIL.t, 0.35), {
      step: 2, delay: i * 0.15,
      layout: { p: V(-10, RAIL.t / 2, 64 + i * 14), q: Qe(Math.PI / 2, 0, 0) },
      final: { p: V(0, RAIL_Y, sz * LONG_Z), q: Qe() },
      approach: V(0, -25, 0), arc: 40,
    }));

    // C. Short rails
    [-1, 1].forEach((sx, i) => addPart(rbx(RAIL.t, RAIL.h, SHORT_LEN, 0.35), {
      step: 3, delay: i * 0.15,
      layout: { p: V(-100 + i * 14, RAIL.t / 2, 10), q: Qe(0, 0, Math.PI / 2) },
      final: { p: V(sx * SHORT_X, RAIL_Y, 0), q: Qe() },
      approach: V(0, -25, 0), arc: 40,
    }));

    // G. L-brackets + H. screws
    const railFaces = [
      { base: V(0, UNDER, LONG_Z - RAIL.t / 2), yaw: 0, along: V(1, 0, 0), span: 30 },
      { base: V(0, UNDER, -(LONG_Z - RAIL.t / 2)), yaw: Math.PI, along: V(1, 0, 0), span: 30 },
      { base: V(SHORT_X - RAIL.t / 2, UNDER, 0), yaw: Math.PI / 2, along: V(0, 0, 1), span: 14 },
      { base: V(-(SHORT_X - RAIL.t / 2), UNDER, 0), yaw: -Math.PI / 2, along: V(0, 0, 1), span: 14 },
    ];
    let bi = 0, si = 0;
    railFaces.forEach(f => [-1, 1].forEach(k => {
      const pos = f.base.clone().addScaledVector(f.along, k * f.span);
      const q = Qe(0, f.yaw, 0);
      const bM = new THREE.Matrix4().compose(pos, q, V(1, 1, 1));
      addPart(makeLBracket(), {
        step: 4, delay: bi * 0.04,
        layout: { p: V(70 + (bi % 8) * 6, 1.5, 68), q: Qe(Math.PI, 0, 0) },
        final: { p: pos, q },
        approach: V(0, -12, 0), arc: 25,
      });
      [
        { lp: V(0, -0.3, -1.9), lq: Qe(), dir: V(0, 1, 0) },                   // up into tabletop
        { lp: V(0, -1.9, -0.3), lq: Qe(Math.PI / 2, 0, 0), dir: V(0, 0, 1) },  // sideways into rail
      ].forEach(sd => {
        const m = new THREE.Matrix4().compose(sd.lp, sd.lq, V(1, 1, 1)).premultiply(bM);
        const p = V(), qq = new THREE.Quaternion();
        m.decompose(p, qq, V());
        const row = Math.floor(si / 8), col = si % 8;
        addPart(makeScrew(), {
          step: 4, delay: 0.35 + bi * 0.03,
          layout: { p: V(70 + col * 6, 1.4, 80 + row * 6), q: Qe(0, 0, Math.PI / 2) },
          final: { p, q: qq },
          approach: sd.dir.clone().applyQuaternion(q).multiplyScalar(-6),
          spin: { axis: V(0, 1, 0), turns: 5 }, arc: 20,
        });
        si++;
      });
      bi++;
    }));

    // E. Corner brackets, D. legs (hanger bolt factory-fitted), F. wing nuts
    [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sx, sz], i) => {
      const dir = V(-sx, 0, -sz).normalize();
      const innerCorner = V(sx * (LEG_X - LEG.s / 2), RAIL_Y, sz * (LEG_Z - LEG.s / 2));
      const inner = V(sx * (SHORT_X - RAIL.t / 2), RAIL_Y, sz * (LONG_Z - RAIL.t / 2));
      const plateCenter = inner.clone().add(V(-sx * 4, 0, -sz * 4));

      addPart(makeCornerBracket(), {
        step: 5, delay: i * 0.12,
        layout: { p: V(70 + i * 12, 1.2, 92), q: Qe(-Math.PI / 2, 0, 0) },
        final: { p: plateCenter, q: rot(Z_AXIS, dir) },
        approach: dir.clone().multiplyScalar(8).add(V(0, -10, 0)), arc: 25,
      });

      const legCenter = V(sx * LEG_X, LEG.h / 2, sz * LEG_Z);
      const legG = group(rbx(LEG.s, LEG.h, LEG.s, 0.5));
      const bolt = group(at(mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 12), M.zinc), 0, 3.5, 0));
      bolt.position.copy(innerCorner.clone().addScaledVector(dir, -1.2).sub(legCenter));
      bolt.quaternion.copy(rot(Y_AXIS, dir));
      legG.add(bolt);
      addPart(legG, {
        step: 6, delay: i * 0.18,
        layout: { p: V(118 + i * 8, LEG.s / 2, -10), q: Qe(Math.PI / 2, 0, 0) },
        final: { p: legCenter, q: Qe() },
        approach: V(sx * 7, 0, sz * 7), arc: 90,
      });

      const distToPlate = plateCenter.clone().sub(innerCorner).dot(dir);
      addPart(makeWingNut(), {
        step: 7, delay: i * 0.15,
        layout: { p: V(72 + i * 8, 0.6, 100), q: Qe() },
        final: { p: innerCorner.clone().addScaledVector(dir, distToPlate + 0.75), q: rot(Y_AXIS, dir) },
        approach: dir.clone().multiplyScalar(5),
        spin: { axis: V(0, 1, 0), turns: 6 }, arc: 25,
      });
    });

    // Chairs slide in at the end
    [{ x: -28, z: 1 }, { x: 28, z: 1 }, { x: -28, z: -1 }, { x: 28, z: -1 }].forEach(({ x, z }, i) => {
      const q = Qe(0, z > 0 ? 0 : Math.PI, 0);
      addPart(makeChair(), {
        step: 9, delay: i * 0.12, appear: true, arc: 0, highlight: false,
        layout: { p: V(x, 0, z * 120), q },
        final: { p: V(x, 0, z * 58), q },
      });
    });

    return {
      snap(s) {
        blanket.visible = s >= 1 && s < 8;
        tray.visible = s < 8;
      },
      start(s) { if (s >= 1) blanket.visible = true; },
      tick(s, t, flipU) { if (s === 8) blanket.visible = flipU < 0.98; },
    };
  },
};
