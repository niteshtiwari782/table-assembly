// Double bed frame for a 160 × 200 cm mattress: hook-on rails, centre beam with a support leg, 12 slats.
// Built upright, in place, no flipping.
import { THREE, V, Qe, seq, rbox, box, cyl, M, group, at, mesh } from './kit.js';

const RAIL = { len: 200, h: 18, t: 3.5, x: 82.75, y: 28 };
const LEDGE_TOP = 26.75;
const SLAT = { len: 160, w: 8, t: 1.8, n: 12 };
const SLAT_Y = LEDGE_TOP + SLAT.t / 2;
const BEAM = { w: 5, h: 7, len: 200 };
const BEAM_Y = LEDGE_TOP - BEAM.h / 2;
const LEG_H = BEAM_Y - BEAM.h / 2;
const POST = 6;
const END_Z = RAIL.len / 2 + POST / 2;   // headboard / footboard post centres
const MATTRESS = { w: 160, h: 24, d: 200 };
const MATTRESS_Y = LEDGE_TOP + SLAT.t + MATTRESS.h / 2;

const PARTS = {
  A: 'Headboard', B: 'Footboard', C: 'Side rail', D: 'Centre support beam', E: 'Centre support leg', F: 'Slat',
};
const STEPS = [
  { title: 'Check the parts', desc: 'Unpack the bed in the room where it will stand. The headboard and footboard are heavy, so lay them flat rather than leaning them on a wall.',
    parts: [['A', 1], ['B', 1], ['C', 2], ['D', 1], ['E', 1], ['F', 12]],
    tip: 'You need: a rubber mallet. The rail hooks are pre-fitted, so no screws are needed. Allow about 30 minutes, with a helper.' },
  { title: 'Stand the headboard up', desc: 'Lift the headboard and stand it upright against the wall where the bed will go, metal brackets facing into the room.',
    parts: [['A', 1]] },
  { title: 'Hook on the first side rail', desc: 'Hold a side rail at 90° to the headboard, ledge facing in, and slot its hook plate into the headboard bracket. Push down until it locks.',
    parts: [['C', 1]], tip: 'Tap the top of the rail near the joint with a rubber mallet to seat the hooks fully.' },
  { title: 'Hook on the second side rail', desc: 'Fit the other rail the same way on the opposite post, so both ledges face each other.',
    parts: [['C', 1]] },
  { title: 'Attach the footboard', desc: 'Lift the footboard onto the free ends of both rails, drop the hooks into its brackets and tap the joints tight with the mallet.',
    parts: [['B', 1]] },
  { title: 'Fit the support leg', desc: 'Screw the support leg clockwise into the threaded insert in the middle of the centre beam until it stops.',
    parts: [['E', 1]] },
  { title: 'Drop in the centre beam', desc: 'Lower the beam so its ends rest in the brackets on the headboard and footboard, notched end at the foot. Unscrew the leg slightly until it touches the floor.',
    parts: [['D', 1]], tip: 'The leg should just touch the floor. Too high and the beam lifts out of its brackets.' },
  { title: 'Lay the slats', desc: 'Lay the 12 slats across the frame so both ends sit on the rail ledges and the middle rests on the beam. Space them evenly from head to foot.',
    parts: [['F', 12]] },
  { title: 'Add the mattress', desc: 'With a helper, lay a 160 × 200 cm mattress on the slats and push it flush against the headboard.',
    parts: [] },
  { title: 'Done! Sweet dreams', desc: 'Your bed is ready. Make it up and enjoy the first night.',
    parts: [], tip: 'Wood moves with the seasons. Tap the rail joints with the mallet every few months to keep the bed quiet.' },
];

const VIEWS = [
  { pos: V(-40, 420, 440), target: V(-30, 0, 70) },
  { pos: V(-170, 170, 270), target: V(0, 50, -30) },
  { pos: V(240, 150, 170), target: V(40, 30, -40) },
  { pos: V(-240, 150, 170), target: V(-40, 30, -40) },
  { pos: V(-210, 150, 260), target: V(0, 25, 50) },
  { pos: V(300, 110, 130), target: V(190, 5, 0) },
  { pos: V(200, 200, 220), target: V(0, 20, 0) },
  { pos: V(-180, 230, 260), target: V(0, 25, 0) },
  { pos: V(-200, 190, 300), target: V(0, 35, 0) },
  { pos: V(-170, 170, 320), target: V(0, 45, 0) },
];

function makeEnd(height, inward) {
  // Headboard (inward = +1, faces +Z) or footboard (inward = -1). Origin: centre, floor level.
  const g = group();
  [-1, 1].forEach(sx => {
    g.add(at(rbox(POST, height, POST, 0.8, M.walnut), sx * (RAIL.x + 2.75), height / 2, 0));
    g.add(at(rbox(0.4, 16, 4, 0.1, M.steel), sx * RAIL.x, RAIL.y, inward * (POST / 2 + 0.2)));   // rail hook plate
  });
  const span = 2 * (RAIL.x + 2.75) - POST;
  g.add(at(rbox(span, RAIL.h, RAIL.t, 0.4, M.walnut), 0, RAIL.y, 0));
  if (height > 80) {
    g.add(at(rbox(span, height - 52, 2.5, 0.6, M.walnut), 0, 42 + (height - 52) / 2 - 2, 0));
    g.add(at(rbox(span + 2 * POST + 4, 4, 8, 1, M.walnut), 0, height + 2, 0));
  } else {
    g.add(at(rbox(span, 9, RAIL.t, 0.4, M.walnut), 0, height - 6, 0));
  }
  // bracket the centre beam rests in
  g.add(at(box(8, 0.8, 6, M.steel), 0, LEG_H - 0.4, inward * (RAIL.t / 2 + 3)));
  g.add(at(box(8, 10, 0.4, M.steel), 0, LEG_H + 4, inward * (RAIL.t / 2 + 0.2)));
  return g;
}

function makeRail(sx) {
  const g = group(rbox(RAIL.t, RAIL.h, RAIL.len, 0.5, M.walnut));
  g.add(at(box(2.5, 2.5, RAIL.len - 4, M.pine), -sx * (RAIL.t / 2 + 1.25), LEDGE_TOP - 1.25 - RAIL.y, 0));
  [-1, 1].forEach(sz => g.add(at(box(0.4, 14, 3, M.steel), -sx * (RAIL.t / 2 + 0.2), 0, sz * (RAIL.len / 2 - 1.5))));
  return g;
}

export default {
  id: 'bed-frame',
  short: 'Bed frame',
  title: 'Bed Frame Assembly',
  tagline: '160 × 200 double · hook-on rails · 3D step-by-step',
  time: '30 min', people: 2, blurb: 'Hook-on side rails, a centre beam with support leg and 12 slats. No screws.',
  icon: '<rect x="3" y="6" width="4" height="20" rx="1"/><rect x="25" y="13" width="4" height="13" rx="1"/><rect x="7" y="17" width="18" height="4"/><rect x="8" y="13" width="7" height="4" rx="1.5"/>',
  parts: PARTS,
  steps: STEPS,
  views: VIEWS,
  flip: null,

  build({ addPart }) {
    // A. Headboard
    addPart(makeEnd(110, 1), {
      step: 1,
      layout: { p: V(0, POST / 2, 236), q: Qe(-Math.PI / 2, 0, 0) },
      final: { p: V(0, 0, -END_Z), q: Qe() },
      approach: V(0, 0, 25), arc: 90,
    });

    // C. Side rails
    [1, -1].forEach((sx, i) => addPart(makeRail(sx), {
      step: 2 + i,
      layout: { p: V(130 + i * 26, RAIL.t / 2, 0), q: Qe(0, 0, -sx * Math.PI / 2) },
      final: { p: V(sx * RAIL.x, RAIL.y, 0), q: Qe() },
      approach: V(0, 8, 0), arc: 60,
    }));

    // B. Footboard
    addPart(makeEnd(50, -1), {
      step: 4,
      layout: { p: V(-200, POST / 2, 0), q: seq(Qe(-Math.PI / 2, 0, 0), Qe(0, Math.PI / 2, 0)) },
      final: { p: V(0, 0, END_Z), q: Qe() },
      approach: V(0, 8, 0), arc: 70,
    });

    // D. Centre beam, with E. its leg screwed in first
    const beam = addPart(rbox(BEAM.w, BEAM.h, BEAM.len, 0.4, M.pine), {
      step: 6,
      layout: { p: V(185, BEAM.w / 2, 0), q: Qe(0, 0, Math.PI / 2) },
      final: { p: V(0, BEAM_Y, 0), q: Qe() },
      approach: V(0, 10, 0), arc: 50,
    });
    const leg = group(at(cyl(2.2, 2.2, LEG_H - 1.2, M.pine), 0, 0.6, 0), at(cyl(2.8, 2.8, 1.2, new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9 })), 0, -LEG_H / 2 + 0.6, 0));
    addPart(leg, {
      step: 5, parent: beam,
      layout: { p: V(240, 2.8, 30), q: Qe(0, 0, Math.PI / 2) },
      final: { p: V(0, -BEAM.h / 2 - LEG_H / 2, 0), q: Qe() },
      approach: V(0, -8, 0),
      spin: { axis: V(0, 1, 0), turns: 4 }, arc: 25,
    });

    // F. Slats
    for (let i = 0; i < SLAT.n; i++) {
      const z = -94 + (188 / (SLAT.n - 1)) * i;
      addPart(rbox(SLAT.len, SLAT.t, SLAT.w, 0.3, M.pine), {
        step: 7, delay: i * 0.05,
        layout: { p: V(-200, SLAT.t / 2 + i * SLAT.t, 150), q: Qe() },
        final: { p: V(0, SLAT_Y, z), q: Qe() },
        approach: V(0, 10, 0), arc: 45,
      });
    }

    // Mattress (not in the box)
    addPart(rbox(MATTRESS.w, MATTRESS.h, MATTRESS.d, 5, M.mattress), {
      step: 8, appear: true, arc: 0, highlight: false,
      layout: { p: V(0, MATTRESS_Y + 90, 120), q: Qe(0.25, 0, 0) },
      final: { p: V(0, MATTRESS_Y, 0), q: Qe() },
    });

    // Bedding, once it's done
    const top = MATTRESS_Y + MATTRESS.h / 2;
    const bedding = group(
      at(rbox(166, 5, 150, 2.4, M.duvet), 0, 2.5, 25),
      at(rbox(166, 6, 26, 2.8, M.linen), 0, 3, -42),
      at(rbox(64, 13, 42, 6, M.linen), -38, 8, -74),
      at(rbox(64, 13, 42, 6, M.linen), 38, 8, -74),
      at(rbox(44, 12, 14, 5, M.accentA), 0, 12, -58),
    );
    bedding.children[2].rotation.x = -0.25;
    bedding.children[3].rotation.x = -0.25;
    bedding.children[4].rotation.x = -0.35;
    addPart(bedding, {
      step: 9, appear: true, arc: 0, highlight: false,
      layout: { p: V(0, top + 60, 0), q: Qe() },
      final: { p: V(0, top, 0), q: Qe() },
    });
  },
};
