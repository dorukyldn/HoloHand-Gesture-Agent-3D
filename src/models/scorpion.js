import { P, I, merge, frustum, disc, torus, box, tube, rod, ellipsoid } from './shapes.js';

const PI = Math.PI;
const SIDES = [1, -1];
const LEG_X = [0.75, 0.25, -0.25, -0.75];

// Tail arc: leaves the body going aft, curls up and over the back
const TC = [-1.55, 1.15];
const TR = 1.05;
const tailPt = (a) => [TC[0] - TR * Math.sin(a), TC[1] - TR * Math.cos(a), 0];
const TAIL = 6;

export function buildScorpion() {
  const parts = [];

  // Chassis
  const chassis = merge(box(2.3, 0.36, 1.0, 2600), box(0.5, 0.26, 0.5, 400).move(-1.3, 0.05, 0));
  parts.push(P('Chassis', 'Machined frame. Legs, tail and claws all bolt onto it.', '#8fa3c9', [I(chassis)]));

  // Dorsal plates
  const plates = [];
  for (let k = 0; k < 5; k++) {
    const x = -0.85 + k * 0.42;
    const plate = merge(ellipsoid(0.26, 0.17, 0.62, 620).move(x, 0.24, 0));
    for (let i = 1; i < plate.p.length; i += 3) plate.p[i] = Math.max(plate.p[i], 0.24); // flat underside
    plates.push(I(plate, [(x + 0.2) * 0.5, 1.7, 0]));
  }
  parts.push(P('Dorsal plates', 'Overlapping armour that slides as the body flexes.', '#ff5a52', plates));

  // Head
  const head = merge(ellipsoid(0.55, 0.3, 0.55, 1800).move(1.35, 0.06, 0));
  parts.push(P('Head shell', 'Front housing for the sensors and the claw drives.', '#46d9d0', [I(head, [1.2, 0.8, 0])]));

  // Sensors
  const eyes = [];
  for (const s of SIDES) {
    for (const [x, z] of [[1.72, 0.2], [1.55, 0.36]]) eyes.push(I(ellipsoid(0.07, 0.07, 0.07, 130).move(x, 0.22, s * z), [2.2, 1.5, s * 0.5]));
  }
  parts.push(P('Camera eyes', 'Stereo cameras that give the depth map for walking and aiming.', '#ffe14d', eyes));

  // Battery + board
  parts.push(P('Battery pack', 'Lithium cells that sit low to keep the centre of mass down.', '#ffd23f', [I(box(1.1, 0.14, 0.6, 800).move(-0.2, -0.06, 0), [0, -1.9, 0])]));
  const board = merge(box(0.9, 0.03, 0.55, 500).move(0.35, 0.13, 0));
  for (let k = 0; k < 4; k++) board.merge(box(0.13, 0.06, 0.13, 80).move(0.05 + k * 0.2, 0.16, k % 2 ? 0.12 : -0.12));
  parts.push(P('Control board', 'Runs the gait controller and reads every joint sensor.', '#38c9b8', [I(board, [0, 2.9, 0])]));

  // Belly
  parts.push(P('Belly plate', 'Skid plate that protects the underside on rough ground.', '#5c7cff', [I(box(2.2, 0.04, 0.95, 900).move(0, -0.22, 0), [0, -3.1, 0])]));

  // Legs
  const legs = [];
  const servos = [];
  const tips = [];
  for (const s of SIDES) {
    LEG_X.forEach((x) => {
      const splay = x * 0.5;
      const root = [x, 0, s * 0.5];
      const knee = [x + splay * 0.4, 0.5, s * 1.25];
      const ankle = [x + splay * 0.8, 0.15, s * 1.95];
      const foot = [x + splay, -0.62, s * 2.3];
      legs.push(I(merge(rod(root, knee, 0.05, 280), rod(knee, ankle, 0.04, 260), rod(ankle, foot, 0.03, 240)), [splay, 0.15, s * 1.25]));
      servos.push(I(merge(box(0.2, 0.2, 0.18, 170).move(...root), ellipsoid(0.08, 0.08, 0.08, 80).move(...knee), ellipsoid(0.065, 0.065, 0.065, 70).move(...ankle)), [splay * 0.5, -0.5, s * 0.55]));
      tips.push(I(ellipsoid(0.05, 0.09, 0.05, 80).move(...foot), [splay * 1.3, -0.5, s * 2.1]));
    });
  }
  parts.push(P('Legs (8)', 'Three-segment legs. Four stay planted while the other four step.', '#d4c9ff', legs));
  parts.push(P('Joint servos', 'Three actuators per leg, 24 in all, each with a position sensor.', '#ffa53a', servos));
  parts.push(P('Foot tips', 'Rubber tips that grip without slipping.', '#ffffff', tips));

  // Claws
  const arms = [];
  const claws = [];
  for (const s of SIDES) {
    arms.push(I(tube([[1.2, 0, s * 0.42], [1.65, 0.28, s * 1.0], [2.25, 0.22, s * 1.25], [2.7, 0.08, s * 1.05]], 0.07, 900), [0.9, 0.3, s * 1.0]));
    const palm = ellipsoid(0.34, 0.13, 0.22, 560).move(2.9, 0.06, s * 0.98);
    const fixed = tube([[3.05, 0.06, s * 1.1], [3.5, 0.06, s * 1.12], [3.85, 0.06, s * 0.82]], 0.07, 420, { taper: (t) => 1 - 0.85 * t });
    const moving = tube([[3.05, 0.06, s * 0.86], [3.42, 0.06, s * 0.7], [3.75, 0.06, s * 0.76]], 0.055, 340, { taper: (t) => 1 - 0.85 * t });
    claws.push(I(merge(palm, fixed, moving), [2.0, 0.4, s * 1.0]));
  }
  parts.push(P('Claw arms', 'Long reach arms that hold the claws out ahead of the body.', '#c58bff', arms));
  parts.push(P('Claws', 'One finger is fixed and a cable closes the other against it.', '#ff4f9a', claws));

  // Tail segments
  const tail = [];
  for (let k = 0; k < TAIL; k++) {
    const a0 = (k / TAIL) * PI * 1.15;
    const a1 = ((k + 0.86) / TAIL) * PI * 1.15;
    const p0 = tailPt(a0);
    const p1 = tailPt(a1);
    const r = 0.22 - k * 0.022;
    const seg = merge(frustum(r, r * 0.9, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 620, { rings: 4, lines: 6, cap0: true, cap1: true }));
    seg.align([p1[0] - p0[0], p1[1] - p0[1], 0]).move((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0);
    const mid = (a0 + a1) / 2;
    tail.push(I(seg, [-Math.sin(mid) * 1.1 - 0.3, -Math.cos(mid) * 1.1 + 0.25, 0]));
  }
  parts.push(P('Tail segments', 'Six hollow links with a motor in each joint, so the tail can aim in any direction.', '#46b3ff', tail));

  // Stinger
  const e = tailPt(PI * 1.15);
  const sting = merge(
    ellipsoid(0.26, 0.2, 0.2, 760).move(e[0] + 0.12, e[1] - 0.05, 0),
    tube([[e[0] + 0.28, e[1] - 0.08, 0], [e[0] + 0.6, e[1] - 0.2, 0], [e[0] + 0.78, e[1] - 0.58, 0]], 0.08, 420, { taper: (t) => 1 - 0.92 * t }),
    torus(0.14, 0.02, 90).rotate(0, 0, PI / 2).move(e[0] - 0.1, e[1], 0),
  );
  parts.push(P('Stinger', 'End of the tail, with a camera and a sampling needle in the tip.', '#ff6b4a', [I(sting, [0.9, 1.2, 0])]));

  // Tail mount
  parts.push(P('Tail mount', 'Pan joint that lets the whole tail swing side to side.', '#ffc2e2', [I(merge(disc(0, 0.26, 260).rotate(0, 0, PI / 2).move(-1.53, 0.08, 0), torus(0.26, 0.03, 130).rotate(0, 0, PI / 2).move(-1.53, 0.08, 0)), [-0.9, -0.9, 0])]));

  return parts;
}
