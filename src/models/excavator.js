import { P, I, merge, frustum, disc, torus, box, tube, rod, ellipsoid, rand } from './shapes.js';

const PI = Math.PI;
const SIDES = [1, -1];

/** Box beam between two points in the XY plane. */
function beam(a, b, w, d, n) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return box(w, L, d, n, { edges: 0.35 }).align([b[0] - a[0], b[1] - a[1], 0]).move((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0);
}
/** Hydraulic cylinder: fat barrel from a, thin chromed rod to b, split at t. */
function ram(a, b, r, t, n) {
  const m = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] || 0];
  const A = [a[0], a[1], a[2] || 0];
  const B = [b[0], b[1], a[2] || 0];
  return { barrel: rod(A, m, r, Math.floor(n * 0.7), { caps: true }), piston: rod(m, B, r * 0.45, Math.floor(n * 0.3)) };
}
const pin = (p, n = 60) => rod([p[0], p[1], -0.16], [p[0], p[1], 0.16], 0.05, n);

export function buildExcavator() {
  const parts = [];

  // Tracks
  const loop = [[-1.6, -1.15], [0, -1.2], [1.6, -1.15], [1.78, -0.9], [1.5, -0.62], [0, -0.58], [-1.5, -0.62], [-1.78, -0.9]];
  parts.push(
    P(
      'Tracks',
      'Steel crawler chains that spread the weight and climb almost anything.',
      '#8fa3c9',
      SIDES.map((s) => I(tube(loop.map(([x, y]) => [x, y, 0]), 0.1, 2600, { closed: true }).scale(1, 1, 2.8).move(0, 0, s * 1.05), [0, -0.35, s * 1.25])),
    ),
  );

  // Rollers
  const rollers = [];
  for (const s of SIDES) {
    const c = merge();
    for (const [x, r] of [[-1.55, 0.2], [-0.8, 0.11], [0, 0.11], [0.8, 0.11], [1.55, 0.2]]) c.merge(frustum(r, r, 0.3, 170, { cap0: true, cap1: true }).rotate(PI / 2, 0, 0).move(x, -0.9, s * 1.05));
    rollers.push(I(c, [0, -0.35, s * 0.55]));
  }
  parts.push(P('Rollers and sprockets', 'The rear sprocket drives the chain and the rollers carry the machine.', '#ffa53a', rollers));

  // Undercarriage frame
  const under = merge(box(2.6, 0.3, 1.3, 1300).move(0, -0.65, 0));
  for (const s of SIDES) under.merge(box(3.1, 0.22, 0.28, 500).move(0, -0.9, s * 1.05));
  parts.push(P('Undercarriage', 'Welded frame between the tracks that takes every digging load.', '#5c7cff', [I(under, [0, -0.15, 0])]));

  // Slew ring
  parts.push(P('Slew ring', 'Giant bearing that lets the top of the machine turn all the way around.', '#ffe14d', [I(merge(torus(0.72, 0.06, 900).move(0, -0.42, 0), frustum(0.7, 0.7, 0.14, 500).move(0, -0.42, 0), disc(0.1, 0.68, 300, -0.42)), [0, 0.9, 0])]));

  // Upper house
  const house = merge(box(3.1, 0.14, 2.2, 1300).move(-0.35, -0.28, 0));
  parts.push(P('Upper frame', 'Platform that carries the boom, cab, engine and counterweight.', '#ffd23f', [I(house, [0, 1.5, 0])]));

  // Cab
  const cab = merge(box(0.95, 1.05, 0.9, 1800, { edges: 0.5 }).move(0.4, 0.33, 0.62));
  parts.push(P('Cab', 'Operator station. Two joysticks work all the hydraulic functions.', '#8ad7ff', [I(cab, [0.3, 2.2, 1.9])]));

  // Seat
  parts.push(P('Seat and joysticks', 'Each joystick controls two motions at once.', '#ffc2e2', [I(merge(box(0.3, 0.08, 0.32, 130).move(0.28, 0.05, 0.62), box(0.08, 0.38, 0.32, 130).move(0.1, 0.25, 0.62), rod([0.5, 0.05, 0.42], [0.5, 0.3, 0.42], 0.015, 40), rod([0.5, 0.05, 0.82], [0.5, 0.3, 0.82], 0.015, 40)), [0.3, 1.2, 1.2])]));

  // Engine hood + engine + pump + tank
  parts.push(P('Engine hood', 'Hinged cover over the engine bay.', '#46d9d0', [I(box(1.55, 0.8, 1.1, 1500).move(-1.0, 0.2, -0.42), [-0.3, 2.6, -1.0])]));
  const eng = merge(box(0.9, 0.42, 0.55, 800).move(-1.0, 0.05, -0.45));
  for (let k = 0; k < 4; k++) eng.merge(rod([-1.32 + k * 0.21, 0.26, -0.45], [-1.32 + k * 0.21, 0.42, -0.45], 0.05, 60));
  parts.push(P('Diesel engine', 'Does not drive the arm directly. It only spins the hydraulic pump.', '#ff5a52', [I(eng, [-0.3, 1.2, -1.3])]));
  parts.push(P('Hydraulic pump', 'Pushes oil at about 350 bar, the source of all the digging force.', '#ff9f2e', [I(merge(frustum(0.14, 0.14, 0.38, 340, { cap0: true, cap1: true }).rotate(0, 0, PI / 2).move(-0.32, 0.03, -0.45), disc(0, 0.13, 60).rotate(0, 0, PI / 2).move(-0.12, 0.03, -0.45)), [0.3, 0.7, -2.0])]));
  parts.push(P('Oil tank', 'Holds the oil that returns from the rams, and cools it.', '#c58bff', [I(box(0.55, 0.65, 0.42, 620).move(0.28, 0.12, -0.72), [0.8, 0.5, -1.9])]));
  parts.push(P('Counterweight', 'Solid iron block that stops the machine tipping forward under load.', '#d4c9ff', [I(box(0.62, 0.72, 2.1, 1500).move(-1.75, 0.15, 0), [-1.9, 0.4, 0])]));

  // Arm geometry (XY plane)
  const root = [0.55, -0.1];
  const elbow = [2.9, 2.0];
  const wrist = [4.45, -0.4];
  const bucketEnd = [4.6, -1.25];

  // Boom
  const boom = merge(beam(root, [1.75, 1.6], 0.34, 0.3, 1500), beam([1.75, 1.6], elbow, 0.28, 0.28, 1200), pin(root), pin(elbow));
  parts.push(P('Boom', 'Bent main arm. It lifts everything hanging off the end.', '#ffb02e', [I(boom, [0.4, 1.0, 0])]));

  // Stick
  const stick = merge(beam([2.65, 2.3], elbow, 0.24, 0.24, 200), beam(elbow, wrist, 0.22, 0.22, 1400), pin(wrist));
  parts.push(P('Stick', 'Also called the dipper. It pulls the bucket in towards the machine.', '#ff6b4a', [I(stick, [2.0, 1.1, 0])]));

  // Rams
  const boomRams = SIDES.map((s) => ram([0.85, -0.25, s * 0.2], [1.75, 1.3], 0.075, 0.55, 700));
  const stickRam = ram([1.9, 1.95, 0], [2.65, 2.3], 0.07, 0.5, 600);
  const bucketRam = ram([3.05, 1.85, 0], [4.25, 0.1], 0.06, 0.55, 700);
  parts.push(P('Boom rams', 'Pair of cylinders, the largest on the machine, that raise the boom.', '#38c9b8', boomRams.map((r, k) => I(r.barrel, [0.1, -0.2, SIDES[k] * 1.5]))));
  parts.push(
    P('Ram rods', 'Polished steel rods sliding out of each barrel under oil pressure.', '#ffffff', [
      ...boomRams.map((r, k) => I(r.piston, [0.8, 0.5, SIDES[k] * 1.5])),
      I(stickRam.piston, [1.3, 2.3, 0.8]),
      I(bucketRam.piston, [2.7, 1.3, 0.8]),
    ]),
  );
  parts.push(
    P('Stick and bucket rams', 'Longer stroke cylinders that curl the stick and the bucket.', '#4fe3e0', [
      I(stickRam.barrel, [0.6, 1.9, 0.8]),
      I(bucketRam.barrel, [2.0, 1.6, 0.8]),
    ]),
  );

  // Linkage
  const link = merge(rod([4.05, 0.15], [4.25, 0.1], 0.03, 60), rod([4.25, 0.1], [4.72, -0.3], 0.03, 120), rod([4.05, 0.15].concat(0.1), [4.05, 0.15].concat(-0.1), 0.03, 50));
  parts.push(P('Bucket linkage', 'H-link that gives the bucket a wider curl than the ram alone.', '#ff4f9a', [I(link, [3.2, 0.7, 0])]));

  // Bucket
  const bucket = merge();
  const prof = [[4.45, -0.4], [4.95, -0.5], [5.15, -0.95], [5.0, -1.35], bucketEnd];
  for (const z of [-0.42, -0.21, 0, 0.21, 0.42]) bucket.merge(tube(prof.map(([x, y]) => [x, y, z]), 0.018, 280));
  for (let k = 0; k < 2200; k++) {
    // back shell between the outer profile curves
    const i = Math.min(prof.length - 2, Math.floor(rand() * (prof.length - 1)));
    const t = rand();
    bucket.add(prof[i][0] + (prof[i + 1][0] - prof[i][0]) * t, prof[i][1] + (prof[i + 1][1] - prof[i][1]) * t, (rand() - 0.5) * 0.86);
  }
  for (const s of SIDES) bucket.merge(ellipsoid(0.32, 0.42, 0.012, 340).move(4.82, -0.85, s * 0.43));
  parts.push(P('Bucket', 'Holds the load. Its back curve lets the dirt roll in easily.', '#ffd9a0', [I(bucket, [3.6, -0.3, 0])]));

  // Teeth
  const teeth = [];
  for (const z of [-0.36, -0.18, 0, 0.18, 0.36]) teeth.push(I(frustum(0.05, 0.01, 0.22, 90).align([-0.35, -1, 0]).move(4.53, -1.36, z), [3.5, -1.4, z * 1.5]));
  parts.push(P('Teeth', 'Replaceable tips that bite into hard ground.', '#ff3d5a', teeth));

  // Hoses
  const hoses = merge(tube([[0.1, 0.0, 0.1], [0.9, 0.6, 0.18], [1.7, 1.85, 0.18], [2.8, 2.25, 0.16]], 0.022, 420), tube([[0.1, 0.0, -0.1], [0.9, 0.6, -0.18], [1.7, 1.85, -0.18], [2.8, 2.25, -0.16]], 0.022, 420), tube([[2.85, 2.2, 0.14], [3.5, 1.1, 0.14], [4.25, 0.15, 0.14]], 0.02, 300));
  parts.push(P('Hydraulic lines', 'High-pressure steel pipes and hoses that carry oil to every ram.', '#ff5ad6', [I(hoses, [1.2, 2.8, 1.5])]));

  return parts;
}
