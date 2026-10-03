// Coffee table with a lower shelf: 110 × 60 cm, 45 cm high, screw-in legs.
// Modelled upright; built upside-down on a blanket, then turned over.
import { THREE, V, Qe, rbox, cyl, box, M, makeScrew, makeLBracket, makeBlanket, makeTray, group, at, mesh, rng } from './kit.js';

const TOP = { w: 110, d: 60, t: 3 };
const H = 45;
const UNDER = H - TOP.t;
const LEG = { s: 4.5, h: UNDER };
const LEG_X = 50, LEG_Z = 25;
const PLATE = { s: 9, t: 0.4 };
const SHELF = { w: 2 * (LEG_X - LEG.s / 2) - 0.6, t: 1.8, d: 54, y: 12 };
const BLANKET_H = 0.5;

const PARTS = {
  A: 'Tabletop', B: 'Lower shelf', C: 'Leg with hanger bolt', D: 'Mounting plate',
  E: 'Wood screw 4×16', F: 'Shelf bracket', G: 'Wood screw 3.5×12',
};
const STEPS = [
  { title: 'Check the parts', desc: 'Open the carton, take out the hardware bag first, then lift out the top, the shelf and the four legs. Check everything against the list.',
    parts: [['A', 1], ['B', 1], ['C', 4], ['D', 4], ['F', 4], ['E', 16], ['G', 8]],
    tip: 'You need: a Phillips screwdriver. Allow about 20 minutes.' },
  { title: 'Lay the top face-down', desc: 'Put the blanket or a piece of the packaging foam on the floor and lay the tabletop on it, good side down.',
    parts: [['A', 1]], tip: 'Never assemble on a hard floor: grit under the top will scratch it.' },
  { title: 'Screw on the mounting plates', desc: 'Place a mounting plate over the pre-drilled holes at each corner and fix it with four screws.',
    parts: [['D', 4], ['E', 16]] },
  { title: 'Screw in the legs', desc: 'Thread each leg’s hanger bolt into the centre of a plate and turn the leg clockwise by hand until it is tight.',
    parts: [['C', 4]], tip: 'Hand-tight is enough. Using a wrench on the legs can split the plate threads.' },
  { title: 'Drop in the lower shelf', desc: 'Lower the shelf between the legs, finished side towards the tabletop, until it lines up with the marks on the legs.',
    parts: [['B', 1]] },
  { title: 'Fix the shelf brackets', desc: 'Hold a bracket against each leg and the shelf. Drive one screw into the shelf and one into the leg.',
    parts: [['F', 4], ['G', 8]] },
  { title: 'Turn the table over', desc: 'Lift the table by its top, not by the legs, and set it down on its feet.',
    parts: [], tip: 'Check that all four legs touch the floor. If it rocks, give the loose leg another quarter-turn.' },
  { title: 'Done! Time for coffee', desc: 'Your coffee table is ready. The shelf holds up to 10 kg, so books and baskets are fine.',
    parts: [] },
];

const VIEWS = [
  { pos: V(-40, 270, 320), target: V(10, 0, 15) },
  { pos: V(-140, 130, 170), target: V(0, 0, 0) },
  { pos: V(120, 110, 130), target: V(30, 5, 10) },
  { pos: V(-150, 130, 160), target: V(0, 25, 0) },
  { pos: V(-160, 150, 150), target: V(0, 30, 0) },
  { pos: V(100, 85, 95), target: V(45, 34, 22) },
  { pos: V(-170, 130, 200), target: V(0, 25, 0) },
  { pos: V(-150, 120, 190), target: V(0, 25, 0) },
];

function makeDecor() {
  const g = group();
  const ceramic = new THREE.MeshStandardMaterial({ color: 0xece4d6, roughness: 0.35 });
  const vase = mesh(new THREE.LatheGeometry([[0, 0], [5, 0], [6.5, 6], [5, 14], [2.6, 18], [3, 21]].map(([x, y]) => new THREE.Vector2(x, y)), 24), ceramic);
  vase.position.set(-30, 0, -6);
  g.add(vase);
  const stem = new THREE.MeshStandardMaterial({ color: 0x6b8f5b, roughness: 0.8 });
  for (let i = 0; i < 4; i++) {
    const s = cyl(0.25, 0.25, 22, stem, 6);
    s.position.set(-30 + (i - 1.5) * 1.5, 30, -6);
    s.rotation.z = (i - 1.5) * 0.18;
    g.add(s);
  }
  const rnd = rng(17);
  const bookCols = [0x2f4858, 0xd9894f, 0xede6da];
  let y = 0;
  bookCols.forEach((c, i) => {
    const t = 2 + rnd() * 1.5;
    const b = rbox(28 - i * 3, t, 20 - i * 2, 0.3, new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    b.position.set(22, y + t / 2, 4);
    b.rotation.y = (rnd() - 0.5) * 0.3;
    g.add(b);
    y += t;
  });
  const mug = cyl(4, 3.6, 9, ceramic, 20);
  mug.position.set(-6, 4.5, 14);
  g.add(mug);
  return g;
}

export default {
  id: 'coffee-table',
  short: 'Coffee table',
  title: 'Coffee Table Assembly',
  tagline: 'With lower shelf · screw-in legs · 3D step-by-step',
  icon: '<rect x="3" y="11" width="26" height="3.5" rx="1.5"/><rect x="5" y="14" width="3" height="12" rx="1"/><rect x="24" y="14" width="3" height="12" rx="1"/><rect x="8" y="21" width="16" height="2.5"/>',
  parts: PARTS,
  steps: STEPS,
  views: VIEWS,
  flip: {
    step: 6, dur: 3, lift: 50, centre: V(0, H / 2, 0),
    build: { p: V(0, H + BLANKET_H, 0), q: Qe(Math.PI, 0, 0) },
    up: { p: V(0, 0, 0), q: Qe() },
  },

  build({ addPart, world }) {
    const blanket = makeBlanket(135, 85);
    const tray = makeTray(50, 40);
    tray.position.set(105, 0.5, 70);
    world.add(blanket, tray);

    // A. Tabletop
    addPart(rbox(TOP.w, TOP.t, TOP.d, 1, M.walnut), {
      step: 1,
      layout: { p: V(0, TOP.t / 2, -95), q: Qe() },
      final: { p: V(0, UNDER + TOP.t / 2, 0), q: Qe() },
      arc: 60,
    });

    const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];

    // D. Mounting plates + E. screws
    let si = 0;
    corners.forEach(([sx, sz], i) => {
      const c = V(sx * LEG_X, UNDER - PLATE.t / 2, sz * LEG_Z);
      const plate = group(box(PLATE.s, PLATE.t, PLATE.s, M.steel), at(cyl(0.9, 0.9, PLATE.t + 0.2, M.zinc, 16), 0, 0, 0));
      addPart(plate, {
        step: 2, delay: i * 0.08,
        layout: { p: V(84 + i * 11, PLATE.t / 2 + 1, 60), q: Qe(Math.PI, 0, 0) },
        final: { p: c, q: Qe() },
        approach: V(0, -10, 0), arc: 25,
      });
      [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([a, b]) => {
        addPart(makeScrew(1.6), {
          step: 2, delay: 0.35 + si * 0.025,
          layout: { p: V(86 + (si % 8) * 5, 1.4, 74 + Math.floor(si / 8) * 6), q: Qe(0, 0, Math.PI / 2) },
          final: { p: c.clone().add(V(a * 3.2, -PLATE.t / 2, b * 3.2)), q: Qe() },
          approach: V(0, -6, 0),
          spin: { axis: V(0, 1, 0), turns: 4 }, arc: 20,
        });
        si++;
      });
    });

    // C. Legs (screw in)
    corners.forEach(([sx, sz], i) => {
      const leg = group(rbox(LEG.s, LEG.h, LEG.s, 0.6, M.walnut), at(cyl(0.4, 0.4, 3, M.zinc, 10), 0, LEG.h / 2 + 1.5, 0));
      addPart(leg, {
        step: 3, delay: i * 0.15,
        layout: { p: V(-100 + i * 8, LEG.s / 2, 40), q: Qe(Math.PI / 2, 0, 0) },
        final: { p: V(sx * LEG_X, LEG.h / 2 - PLATE.t, sz * LEG_Z), q: Qe() },
        approach: V(0, -8, 0),
        spin: { axis: V(0, 1, 0), turns: 3 }, arc: 60,
      });
    });

    // B. Lower shelf (drops between the legs)
    addPart(rbox(SHELF.w, SHELF.t, SHELF.d, 0.4, M.walnut), {
      step: 4,
      layout: { p: V(-10, SHELF.t / 2, 95), q: Qe(Math.PI, 0, 0) },
      final: { p: V(0, SHELF.y, 0), q: Qe() },
      approach: V(0, -40, 0), arc: 40,
    });

    // F. Shelf brackets + G. screws
    let gi = 0;
    corners.forEach(([sx, sz], i) => {
      const pos = V(sx * (LEG_X - LEG.s / 2), SHELF.y - SHELF.t / 2, sz * LEG_Z);
      const q = Qe(0, sx * Math.PI / 2, 0);
      const bM = new THREE.Matrix4().compose(pos, q, V(1, 1, 1));
      addPart(makeLBracket(3.5, 3), {
        step: 5, delay: i * 0.06,
        layout: { p: V(86 + i * 6, 1.5, 88), q: Qe(Math.PI, 0, 0) },
        final: { p: pos, q },
        approach: V(0, -10, 0), arc: 25,
      });
      [
        { lp: V(0, -0.3, -1.9), lq: Qe(), dir: V(0, 1, 0) },
        { lp: V(0, -1.9, -0.3), lq: Qe(Math.PI / 2, 0, 0), dir: V(0, 0, 1) },
      ].forEach(sd => {
        const m = new THREE.Matrix4().compose(sd.lp, sd.lq, V(1, 1, 1)).premultiply(bM);
        const p = V(), qq = new THREE.Quaternion();
        m.decompose(p, qq, V());
        addPart(makeScrew(1.2, 0.17), {
          step: 5, delay: 0.3 + gi * 0.03,
          layout: { p: V(86 + gi * 5, 1.3, 98), q: Qe(0, 0, Math.PI / 2) },
          final: { p, q: qq },
          approach: sd.dir.clone().applyQuaternion(q).multiplyScalar(-5),
          spin: { axis: V(0, 1, 0), turns: 4 }, arc: 18,
        });
        gi++;
      });
    });

    // A few things on top once it's done
    addPart(makeDecor(), {
      step: 7, appear: true, arc: 0, highlight: false,
      layout: { p: V(0, H + 40, 0), q: Qe() },
      final: { p: V(0, H, 0), q: Qe() },
    });

    return {
      snap(s) { blanket.visible = s >= 1 && s < 6; tray.visible = s < 6; },
      start(s) { if (s >= 1) blanket.visible = true; },
      tick(s, t, flipU) { if (s === 6) blanket.visible = flipU < 0.98; },
    };
  },
};
