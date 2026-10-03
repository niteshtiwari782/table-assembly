// 5-shelf bookcase: 80 × 30 cm, 180 cm tall, cam-lock construction.
// Modelled upright; built lying face-down on a blanket, then stood up.
import { THREE, V, Qe, rot, rbox, M, Y_AXIS, Z_AXIS, makeCamLock, makeCamPin, makeNail, makeShelfPin, makeBlanket, makeTray, group, at, rng } from './kit.js';

const W = 80, H = 180, D = 30, T = 1.8;
const IW = W - 2 * T;                    // inner width
const SIDE_X = W / 2 - T / 2;
const PLINTH_H = 6;
const JOINT_Y = { bottom: PLINTH_H + T / 2, fixed: 92, top: H - T / 2 };
const SHELF_Y = [50, 136];               // adjustable shelves
const BACK_T = 0.4;
const BACK_Z = -D / 2 - BACK_T / 2;
const BLANKET_H = 0.5;

const PARTS = {
  A: 'Cam pin', B: 'Cam lock', C: 'Side panel', D: 'Top panel', E: 'Bottom panel', F: 'Fixed shelf',
  G: 'Plinth (with dowels)', H: 'Back panel', J: 'Nail 20 mm', K: 'Shelf pin', L: 'Adjustable shelf',
};
const STEPS = [
  { title: 'Check the parts', desc: 'Unpack the panels and the hardware bag. Lay everything out on a soft, clean surface and check it against the list.',
    parts: [['C', 2], ['D', 1], ['E', 1], ['F', 1], ['G', 1], ['H', 1], ['L', 2], ['A', 12], ['B', 12], ['J', 12], ['K', 8]],
    tip: 'You need: a Phillips screwdriver and a hammer. Allow about 45 minutes, and get a second person for step 7.' },
  { title: 'Screw in the cam pins', desc: 'Screw a cam pin into each of the six pre-drilled holes on the inside face of both side panels. Hand-tight is enough.',
    parts: [['A', 12]] },
  { title: 'Insert the cam locks', desc: 'Press a cam lock into every round hole in the top panel, bottom panel and fixed shelf. Turn each one so its arrow points at the nearest panel edge (the open position).',
    parts: [['B', 12]], tip: 'If a cam is turned the wrong way, the pin won’t go in. Open it again before joining the panels.' },
  { title: 'Lay down the right side panel', desc: 'Spread a blanket on the floor. Stand the right side panel on its front edge, with the cam pins facing in.',
    parts: [['C', 1]] },
  { title: 'Add the top, bottom and fixed shelf', desc: 'Slide the top panel, bottom panel, fixed shelf and plinth onto the pins of the side panel. Turn each cam lock a quarter-turn clockwise to pull the joint tight.',
    parts: [['D', 1], ['E', 1], ['F', 1], ['G', 1]] },
  { title: 'Close it with the left side panel', desc: 'Lower the left side panel onto the other ends, guiding every pin into its cam. Then tighten those cam locks too.',
    parts: [['C', 1]], tip: 'Don’t overtighten cam locks. A quarter-turn is all they need; more can strip the particle board.' },
  { title: 'Nail on the back panel', desc: 'Lay the back panel on the frame, smooth side facing in. Measure both diagonals; when they match the case is square. Nail it to every edge.',
    parts: [['H', 1], ['J', 12]], tip: 'Equal diagonals = square frame. Nail the corners first, then the rest.' },
  { title: 'Stand it upright', desc: 'With a helper, lift the bookcase by its sides and stand it up. Walk it into place rather than dragging it.',
    parts: [], tip: 'Lift by the sides, never by the shelves, and keep the back panel facing the wall.' },
  { title: 'Fit the adjustable shelves', desc: 'Push four shelf pins into holes at the same height on both sides, then slide each shelf in and rest it on its pins.',
    parts: [['K', 8], ['L', 2]] },
  { title: 'Done! Fill it up', desc: 'Your bookcase is ready. Put the heaviest books on the lowest shelves to keep it stable.',
    parts: [], tip: 'Always anchor a tall bookcase to the wall with the anti-tip strap supplied, especially if children are around.' },
];

const VIEWS = [
  { pos: V(-30, 340, 400), target: V(0, 0, 40) },
  { pos: V(60, 130, 310), target: V(-10, 0, 150) },
  { pos: V(-60, 140, 170), target: V(-125, 0, -10) },
  { pos: V(200, 160, 180), target: V(0, 10, 0) },
  { pos: V(-210, 170, 170), target: V(0, 10, 0) },
  { pos: V(-220, 170, 150), target: V(0, 10, 0) },
  { pos: V(190, 230, 170), target: V(0, 15, 0) },
  { pos: V(-230, 190, 300), target: V(0, 80, 0) },
  { pos: V(80, 150, 310), target: V(0, 95, 0) },
  { pos: V(-130, 150, 270), target: V(0, 85, 0) },
];

const BOOK_COLORS = [0x2f4858, 0xc35f4a, 0xe0b04f, 0x86a789, 0x3f6c8f, 0xd9894f, 0x6d5a72, 0xede6da, 0x1f2a36];
function makeBookRow(seed, width) {
  const rnd = rng(seed);
  const g = new THREE.Group();
  let x = -width / 2 + 2;
  const end = width / 2 - 2 - rnd() * 20;
  while (x < end) {
    const w = 2 + rnd() * 2.5, h = 18 + rnd() * 9, d = 16 + rnd() * 5;
    const mat = new THREE.MeshStandardMaterial({ color: BOOK_COLORS[Math.floor(rnd() * BOOK_COLORS.length)], roughness: 0.7 });
    g.add(at(rbox(w, h, d, 0.25, mat), x + w / 2, h / 2, -D / 2 + d / 2 + 2));
    x += w + 0.15;
  }
  return g;
}

export default {
  id: 'bookshelf',
  short: 'Bookshelf',
  title: 'Bookshelf Assembly',
  tagline: '5 shelves · cam-lock flat-pack · 3D step-by-step',
  time: '45 min', people: 2, blurb: 'Cam pins, cam locks and a nailed-on back panel, built face-down then stood up.',
  icon: '<rect x="7" y="3" width="3" height="26" rx="1"/><rect x="22" y="3" width="3" height="26" rx="1"/><rect x="9" y="3" width="14" height="2.5"/><rect x="9" y="12" width="14" height="2.5"/><rect x="9" y="21" width="14" height="2.5"/>',
  parts: PARTS,
  steps: STEPS,
  views: VIEWS,
  flip: {
    step: 7, dur: 3.4, lift: 35, centre: V(0, H / 2, 0),
    build: { p: V(0, D / 2 + BLANKET_H, -H / 2), q: Qe(Math.PI / 2, 0, 0) },   // face-down, top towards +Z
    up: { p: V(0, 0, 0), q: Qe() },
  },

  build({ addPart, world }) {
    const blanket = makeBlanket(115, 205);
    const tray = makeTray(60, 44);
    tray.position.set(112, 0.5, 132);
    world.add(blanket, tray);

    // Hardware layout spots on the tray
    let hw = 0;
    const traySpot = (y = 0.8) => { const i = hw++; return V(88 + (i % 10) * 5, y, 116 + Math.floor(i / 10) * 6); };

    // C. Side panels, lying flat with their inside faces up
    const sides = {};
    [1, -1].forEach(sx => {
      sides[sx] = addPart(rbox(T, H, D, 0.25, M.white), {
        step: sx > 0 ? 3 : 5,
        layout: { p: V(-10, T / 2, sx > 0 ? 130 : 168), q: Qe(0, 0, sx > 0 ? -Math.PI / 2 : Math.PI / 2) },
        final: { p: V(sx * SIDE_X, H / 2, 0), q: Qe() },
        approach: sx > 0 ? V(0, 0, -25) : V(-22, 0, 0),
        arc: sx > 0 ? 45 : 35,
      });
    });

    // A. Cam pins, screwed into the side panels (step 1)
    [1, -1].forEach(sx => {
      let k = 0;
      Object.values(JOINT_Y).forEach(jy => [-8, 8].forEach(z => {
        addPart(makeCamPin(), {
          step: 1, parent: sides[sx], delay: (sx > 0 ? 0 : 0.18) + k++ * 0.03,
          layout: { p: traySpot(0.4), q: Qe(0, 0, Math.PI / 2) },
          final: { p: V(-sx * T / 2, jy - H / 2, z), q: rot(Y_AXIS, V(-sx, 0, 0)) },
          approach: V(-sx * 4, 0, 0),
          spin: { axis: V(0, 1, 0), turns: 3 }, arc: 25,
        });
      }));
    });

    // D/E/F. Top, bottom and fixed shelf, lying with their cam holes up; G. plinth
    const panels = [
      { y: JOINT_Y.top, face: -1, z: -70 },
      { y: JOINT_Y.bottom, face: 1, z: -30 },
      { y: JOINT_Y.fixed, face: -1, z: 10 },
    ].map((pn, i) => ({
      ...pn,
      part: addPart(rbox(IW, T, D, 0.2, M.white), {
        step: 4, delay: i * 0.1,
        layout: { p: V(-125, T / 2, pn.z), q: pn.face < 0 ? Qe(Math.PI, 0, 0) : Qe() },
        final: { p: V(0, pn.y, 0), q: Qe() },
        approach: V(-22, 0, 0), arc: 45,
      }),
    }));
    addPart(rbox(IW, PLINTH_H, T, 0.2, M.white), {
      step: 4, delay: 0.3,
      layout: { p: V(-125, T / 2, 45), q: Qe(-Math.PI / 2, 0, 0) },
      final: { p: V(0, PLINTH_H / 2, D / 2 - T / 2 - 1), q: Qe() },
      approach: V(-22, 0, 0), arc: 45,
    });

    // B. Cam locks, pressed into the panels (step 2)
    let ci = 0;
    panels.forEach(pn => [-1, 1].forEach(sx => [-8, 8].forEach(z => {
      addPart(makeCamLock(), {
        step: 2, parent: pn.part, delay: ci++ * 0.035,
        layout: { p: traySpot(0.25), q: Qe() },
        final: { p: V(sx * (IW / 2 - 3.2), pn.face * (T / 2 - 0.15), z), q: rot(Y_AXIS, V(0, pn.face, 0)) },
        approach: V(0, pn.face * 4, 0),
        spin: { axis: V(0, 1, 0), turns: 1 }, arc: 25,
      });
    })));

    // H. Back panel and J. nails
    addPart(rbox(W, H, BACK_T, 0.1, M.hardboard), {
      step: 6,
      layout: { p: V(125, BACK_T / 2, 0), q: Qe(-Math.PI / 2, 0, 0) },
      final: { p: V(0, H / 2, BACK_Z), q: Qe() },
      approach: V(0, 0, -20), arc: 60,
    });
    const nailSpots = [
      ...[-1, 1].flatMap(sx => [25, 90, 155].map(y => [sx * SIDE_X, y])),
      ...[JOINT_Y.top, JOINT_Y.bottom, JOINT_Y.fixed].flatMap(y => [-20, 20].map(x => [x, y])),
    ];
    nailSpots.forEach(([x, y], i) => addPart(makeNail(2), {
      step: 6, delay: 0.3 + i * 0.03,
      layout: { p: traySpot(0.25), q: Qe(0, 0, Math.PI / 2) },
      final: { p: V(x, y, -D / 2 - BACK_T), q: rot(Y_AXIS, Z_AXIS) },
      approach: V(0, 0, -5), arc: 25,
    }));

    // K. Shelf pins and L. adjustable shelves (after the case is standing)
    SHELF_Y.forEach((sy, si) => {
      [-1, 1].forEach(sx => [-1, 1].forEach(sz => addPart(makeShelfPin(), {
        step: 8, delay: si * 0.05,
        layout: { p: V(-150 + si * 6 + (sx + 1) * 3 + (sz + 1) * 1.5, 0.25, 105), q: Qe(Math.PI / 2, 0, 0) },
        final: { p: V(sx * (IW / 2 + 0.6), sy - T / 2 - 0.3, sz * (D / 2 - 5)), q: rot(Y_AXIS, V(-sx, 0, 0)) },
        approach: V(-sx * 4, 0, 0), arc: 30,
      })));
      addPart(rbox(IW - 0.4, T, D - 1.5, 0.2, M.white), {
        step: 8, delay: 0.25 + si * 0.1,
        layout: { p: V(-125, T / 2 + si * T, 80), q: Qe() },
        final: { p: V(0, sy, 0.5), q: Qe() },
        approach: V(0, 0, 40), arc: 50,
      });
    });

    // Books, once it's done
    [JOINT_Y.bottom, SHELF_Y[0], JOINT_Y.fixed, SHELF_Y[1]].forEach((y, i) => addPart(makeBookRow(31 + i * 7, IW), {
      step: 9, delay: i * 0.1, appear: true, highlight: false, arc: 0,
      layout: { p: V(0, y + T / 2, 70), q: Qe() },
      final: { p: V(0, y + T / 2, 0), q: Qe() },
    }));

    return {
      snap(s) { blanket.visible = s >= 3 && s < 7; tray.visible = s < 7; },
      start(s) { if (s === 3) blanket.visible = true; },
      tick(s, t, flipU) { if (s === 7) blanket.visible = flipU < 0.98; },
    };
  },
};
