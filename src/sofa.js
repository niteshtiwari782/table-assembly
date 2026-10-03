// L-shaped 7-seater sectional: corner unit + two 3-seat units with arms, 310 × 310 cm.
// The units come upside-down: legs and connector brackets go on first, then each unit
// is turned over and hooked to its neighbour. No flip of the whole assembly.
import { THREE, V, Qe, seq, rbox, cyl, box, M, group, at, within, makeTray } from './kit.js';

const D = 95, SEAT_H = 42, BACK_H = 85, ARM_H = 62, ARM_W = 20, BACK_T = 20, LEG_H = 12, SEAT_W = 65;
const RUN = 3 * SEAT_W + ARM_W;   // 215

const UNITS = {
  corner: { len: D, corner: true, final: { p: V(107.5, 0, -107.5), q: Qe() },
    layout: { p: V(-40, BACK_H, 0), q: Qe(Math.PI, 0, 0) } },
  long: { len: RUN, arm: -1, final: { p: V(-47.5, 0, -107.5), q: Qe() },
    layout: { p: V(-60, BACK_H, 120), q: Qe(Math.PI, 0, 0) } },
  side: { len: RUN, arm: 1, final: { p: V(107.5, 0, 47.5), q: Qe(0, -Math.PI / 2, 0) },
    layout: { p: V(-250, BACK_H, 20), q: seq(Qe(Math.PI, 0, 0), Qe(0, Math.PI / 2, 0)) } },
};

const PARTS = {
  A: 'Corner unit', B: '3-seat unit, left arm', C: '3-seat unit, right arm', D: 'Leg',
  E: 'Connector bracket', F: 'Seat cushion', G: 'Back cushion',
};
const STEPS = [
  { title: 'Check the parts', desc: 'The three units ship upside-down. Unbox them where the sofa will stand, leave them upside-down on the cardboard, and check the legs, brackets and cushions.',
    parts: [['A', 1], ['B', 1], ['C', 1], ['D', 12], ['E', 8], ['F', 7], ['G', 7]],
    tip: 'You need: a Phillips screwdriver and a helper (each unit weighs 30–45 kg). Allow about 40 minutes.' },
  { title: 'Screw in the legs', desc: 'Screw four legs into the threaded plates under each unit, turning them clockwise until hand-tight.',
    parts: [['D', 12]], tip: 'Don’t use a tool on the legs; overtightening can strip the plate.' },
  { title: 'Fit the connector brackets', desc: 'Screw a connector bracket onto each marked spot at the joining ends: two on each 3-seat unit and four on the corner unit.',
    parts: [['E', 8]], tip: 'The hooks on matching brackets must point in opposite directions, one up and one down, or they won’t lock.' },
  { title: 'Place the corner unit', desc: 'With a helper, turn the corner unit onto its legs and set it in the corner. It is the anchor the other units hook onto.',
    parts: [['A', 1]] },
  { title: 'Hook on the left 3-seater', desc: 'Turn the left-arm unit upright, line it up against the corner unit, then lift its end slightly and lower it so the brackets hook together.',
    parts: [['B', 1]], tip: 'Lift, don’t drag. Sliding a unit can bend the legs or scratch the floor.' },
  { title: 'Hook on the right 3-seater', desc: 'Do the same with the right-arm unit on the other side of the corner. Push the units together until the gap closes.',
    parts: [['C', 1]] },
  { title: 'Lay the seat cushions', desc: 'Put the seven seat cushions on the bases, zips facing the back.',
    parts: [['F', 7]] },
  { title: 'Add the back cushions', desc: 'Stand the seven back cushions against the backrests and plump them into shape.',
    parts: [['G', 7]] },
  { title: 'Done! Room for seven', desc: 'Your L-shaped sofa is assembled. Add a few throw pillows and invite everyone over.',
    parts: [], tip: 'Rotate and plump the cushions every week or two so they wear evenly.' },
];

const VIEWS = [
  { pos: V(-90, 520, 560), target: V(0, 0, 40) },
  { pos: V(-200, 330, 420), target: V(-110, 40, 50) },
  { pos: V(-60, 300, 380), target: V(-90, 60, 40) },
  { pos: V(-160, 330, 430), target: V(40, 30, -40) },
  { pos: V(-120, 330, 450), target: V(0, 30, -60) },
  { pos: V(-260, 340, 420), target: V(50, 30, 0) },
  { pos: V(-250, 360, 450), target: V(70, 30, 0) },
  { pos: V(-260, 320, 430), target: V(50, 40, 10) },
  { pos: V(-300, 300, 420), target: V(10, 40, -10) },
];

function makeUnit(u) {
  const g = group(at(rbox(u.len, SEAT_H - LEG_H, D, 3, M.fabric), 0, (SEAT_H + LEG_H) / 2, 0));
  const backY = (BACK_H + SEAT_H) / 2, backH = BACK_H - SEAT_H;
  if (u.corner) {
    g.add(at(rbox(D, backH, BACK_T, 4, M.fabric), 0, backY, -D / 2 + BACK_T / 2));
    g.add(at(rbox(BACK_T, backH, D - BACK_T, 4, M.fabric), D / 2 - BACK_T / 2, backY, BACK_T / 2));
  } else {
    g.add(at(rbox(u.len - ARM_W, backH, BACK_T, 4, M.fabric), -u.arm * ARM_W / 2, backY, -D / 2 + BACK_T / 2));
    g.add(at(rbox(ARM_W, ARM_H - LEG_H, D, 5, M.fabric), u.arm * (u.len / 2 - ARM_W / 2), (ARM_H + LEG_H) / 2, 0));
  }
  return g;
}
const makeLeg = () => group(cyl(2.4, 1.8, LEG_H, M.walnut, 20), at(cyl(0.45, 0.45, 2, M.zinc, 8), 0, LEG_H / 2 + 1, 0));
const makeConnector = () => group(box(10, 0.4, 5, M.steel), at(box(0.4, 2.6, 5, M.steel), 5, -1.3, 0));

export default {
  id: 'l-sofa',
  short: 'L-shaped sofa',
  title: 'L-Shaped Sofa Assembly',
  tagline: '7-seater sectional · 3 units · 3D step-by-step',
  icon: '<rect x="3" y="6" width="5" height="20" rx="1.5"/><rect x="3" y="21" width="26" height="5" rx="1.5"/><rect x="8" y="15" width="7" height="6" rx="1"/>',
  parts: PARTS,
  steps: STEPS,
  views: VIEWS,
  flip: null,

  build({ addPart, world }) {
    const tray = makeTray(50, 36);
    tray.position.set(-150, 0.5, 220);
    world.add(tray);
    let hw = 0;
    const traySpot = () => { const i = hw++; return V(-170 + (i % 8) * 6, 1.2, 210 + Math.floor(i / 8) * 8); };

    // A/B/C. Units (upside-down until their step)
    const unit = {};
    [['corner', 3], ['long', 4], ['side', 5]].forEach(([k, step]) => {
      const u = UNITS[k];
      unit[k] = addPart(makeUnit(u), {
        step, layout: u.layout, final: u.final,
        approach: V(0, 14, 0), arc: 110,
      });
    });

    // D. Legs, screwed in while the units are upside-down
    let li = 0;
    ['corner', 'long', 'side'].forEach(k => {
      const u = UNITS[k];
      [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
        addPart(makeLeg(), {
          step: 1, parent: unit[k], delay: li * 0.03,
          layout: { p: traySpot(), q: Qe(0, 0, Math.PI / 2) },
          final: { p: V(sx * (u.len / 2 - 7), LEG_H / 2, sz * (D / 2 - 7)), q: Qe() },
          approach: V(0, -10, 0),
          spin: { axis: V(0, 1, 0), turns: 3 }, arc: 60,
        });
        li++;
      });
    });

    // E. Connector brackets on the joining ends (hooks point towards the joint)
    const conn = [
      ['long', V(RUN / 2 - 6, LEG_H - 0.2, -25), 0], ['long', V(RUN / 2 - 6, LEG_H - 0.2, 25), 0],
      ['corner', V(-D / 2 + 6, LEG_H - 0.2, -25), Math.PI], ['corner', V(-D / 2 + 6, LEG_H - 0.2, 25), Math.PI],
      ['corner', V(-25, LEG_H - 0.2, D / 2 - 6), -Math.PI / 2], ['corner', V(25, LEG_H - 0.2, D / 2 - 6), -Math.PI / 2],
      ['side', V(-RUN / 2 + 6, LEG_H - 0.2, -25), Math.PI], ['side', V(-RUN / 2 + 6, LEG_H - 0.2, 25), Math.PI],
    ];
    conn.forEach(([k, p, yaw], i) => addPart(makeConnector(), {
      step: 2, parent: unit[k], delay: i * 0.06,
      layout: { p: traySpot(), q: Qe() },
      final: { p, q: Qe(0, yaw, 0) },
      approach: V(0, -8, 0), arc: 50,
    }));

    // F/G. Cushions
    const seatsOf = k => (k === 'corner' ? [{ x: -BACK_T / 2, w: D - BACK_T - 1 }]
      : [0, 1, 2].map(i => ({ x: -RUN / 2 + (UNITS[k].arm < 0 ? ARM_W : 0) + SEAT_W / 2 + i * SEAT_W, w: SEAT_W - 1 })));
    let seatN = 0, backN = 0;
    ['long', 'corner', 'side'].forEach(k => seatsOf(k).forEach(({ x, w }) => {
      const seatZ = BACK_T / 2;
      const seat = within(UNITS[k].final, V(x, SEAT_H + 7, seatZ));
      addPart(rbox(w, 14, D - BACK_T - 1, 5, M.cushion), {
        step: 6, delay: seatN * 0.07,
        layout: { p: V(250 + (seatN % 2) * 90, 7 + Math.floor(seatN / 2) * 14, -40), q: Qe(0, Math.PI / 2, 0) },
        final: seat, approach: V(0, 12, 0), arc: 70,
      });
      seatN++;
      const back = within(UNITS[k].final, V(x, SEAT_H + 14 + 21, -D / 2 + BACK_T + 8), Qe(-0.2, 0, 0));
      addPart(rbox(w - 1, 42, 16, 6, M.cushion), {
        step: 7, delay: backN * 0.07,
        layout: { p: V(250 + (backN % 2) * 90, 8 + Math.floor(backN / 2) * 16, 110), q: Qe(-Math.PI / 2, Math.PI / 2, 0) },
        final: back, approach: V(0, 10, 0), arc: 70,
      });
      backN++;
    }));

    // Throw pillows, once it's done
    [['long', -60, M.accentA, 0.2], ['corner', -14, M.accentB, -0.25], ['side', 40, M.accentA, 0.15]].forEach(([k, x, mat, r], i) => {
      const final = within(UNITS[k].final, V(x, SEAT_H + 14 + 20, -D / 2 + BACK_T + 22), Qe(-0.35, 0, r));
      addPart(rbox(44, 44, 13, 6, mat), {
        step: 8, delay: i * 0.12, appear: true, arc: 0, highlight: false,
        layout: { p: final.p.clone().add(V(0, 60, 0)), q: final.q },
        final,
      });
    });

    return {
      snap(s) { tray.visible = s < 3; },
    };
  },
};
