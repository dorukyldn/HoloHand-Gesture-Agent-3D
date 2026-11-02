import { P, I, merge, frustum, disc, torus, box, tube, rod, ellipsoid } from './shapes.js';

const PI = Math.PI;
const S = Math.SQRT1_2;
const X = (c) => c.rotate(0, 0, -PI / 2); // +Y axis shape -> +X axis
const XS = [-1.05, -0.35, 0.35, 1.05];
const THROWS = [0, PI / 2, (3 * PI) / 2, PI]; // cross-plane crankshaft
// d = along the cylinders, o = outer side of the bank
const BANKS = [
  { s: 1, a: PI / 4, d: [0, S, S], o: [0, -S, S], dx: 0.09 },
  { s: -1, a: -PI / 4, d: [0, S, -S], o: [0, -S, -S], dx: -0.09 },
];
const at = (x, b, rho, off = 0) => [x + b.dx, b.d[1] * rho + b.o[1] * off, b.d[2] * rho + b.o[2] * off];
const mul = (v, k) => [v[0] * k, v[1] * k, v[2] * k];

export function buildV8() {
  const parts = [];

  // Block
  const block = merge(box(3.1, 0.85, 1.5, 2600).move(0, -0.15, 0));
  for (const b of BANKS) {
    block.merge(box(3.0, 1.15, 0.86, 2000).rotate(b.a, 0, 0).move(...at(0, b, 1.0)));
    for (const x of XS) block.merge(frustum(0.31, 0.31, 1.1, 260, { rings: 2 }).align(b.d).move(...at(x, b, 1.0)));
  }
  parts.push(P('Engine block', 'Cast core of the engine. Two banks of four cylinders meet at 90 degrees.', '#8fa3c9', [I(block)]));

  // Cylinder heads
  parts.push(
    P(
      'Cylinder heads',
      'Seal the top of each bank and hold the valves and spark plugs.',
      '#46d9d0',
      BANKS.map((b) => I(box(3.0, 0.3, 0.92, 1500).rotate(b.a, 0, 0).move(...at(0, b, 1.72)), mul(b.d, 1.6))),
    ),
  );

  // Valve covers
  parts.push(
    P(
      'Valve covers',
      'Keep the oil in around the rocker gear on top of each head.',
      '#ff5a52',
      BANKS.map((b) => I(box(2.9, 0.22, 0.78, 1100).rotate(b.a, 0, 0).move(...at(0, b, 2.0)), mul(b.d, 2.6))),
    ),
  );

  // Per-cylinder parts
  const pistons = [];
  const rods = [];
  const valves = [];
  const plugs = [];
  for (const b of BANKS) {
    XS.forEach((x, k) => {
      const th = THROWS[k] + (b.s > 0 ? 0 : 0.2);
      const pin = [x + b.dx, 0.24 * Math.cos(th), 0.24 * Math.sin(th)];
      const top = at(x, b, 0.95);
      pistons.push(I(frustum(0.29, 0.29, 0.3, 420, { rings: 3, cap1: true }).align(b.d).move(...top), mul(b.d, 0.85)));
      rods.push(I(merge(rod(pin, top, 0.035, 190), torus(0.075, 0.025, 90).rotate(0, 0, PI / 2).move(...pin)), mul(b.d, 0.42)));
      const v = merge();
      for (const off of [-0.13, 0.13]) {
        v.merge(rod(at(x, b, 1.25, off), at(x, b, 1.72, off), 0.02, 70));
        v.merge(disc(0, 0.08, 60).align(b.d).move(...at(x, b, 1.25, off)));
      }
      valves.push(I(v, mul(b.d, 1.2)));
      plugs.push(I(rod(at(x, b, 1.65, 0.3), at(x, b, 2.2, 0.3), 0.035, 90), mul(b.d, 3.3)));
    });
  }
  parts.push(P('Pistons (8)', 'Burning fuel pushes each piston down its cylinder.', '#ffd23f', pistons));
  parts.push(P('Connecting rods', 'Carry the force of each piston to the crankshaft.', '#38c9b8', rods));
  parts.push(P('Valves', 'Open to let the mixture in and the exhaust out, four strokes at a time.', '#d4c9ff', valves));
  parts.push(P('Spark plugs', 'Fire a spark at the top of the compression stroke.', '#ffffff', plugs));

  // Crankshaft
  const crank = merge(rod([-1.75, 0, 0], [1.75, 0, 0], 0.11, 900, { caps: true }));
  XS.forEach((x, k) => {
    const c = Math.cos(THROWS[k]);
    const s = Math.sin(THROWS[k]);
    crank.merge(
      rod([x - 0.2, 0.24 * c, 0.24 * s], [x + 0.2, 0.24 * c, 0.24 * s], 0.07, 200),
      rod([x - 0.2, 0, 0], [x - 0.2, 0.24 * c, 0.24 * s], 0.08, 120),
      rod([x + 0.2, 0, 0], [x + 0.2, 0.24 * c, 0.24 * s], 0.08, 120),
      ellipsoid(0.07, 0.17, 0.17, 170).move(x, -0.2 * c, -0.2 * s),
    );
  });
  parts.push(P('Crankshaft', 'Turns the straight push of eight pistons into rotation.', '#ffa53a', [I(crank, [0, -1.7, 0])]));

  // Camshaft
  const cam = merge(rod([-1.5, 0.55, 0], [1.5, 0.55, 0], 0.05, 420));
  for (let k = 0; k < 8; k++) cam.merge(ellipsoid(0.04, 0.11, 0.08, 70).move(-1.3 + k * 0.37, 0.55, 0));
  parts.push(P('Camshaft', 'Its lobes open each valve at the right moment.', '#c58bff', [I(cam, [0, 1.3, 0])]));

  // Oil pan
  parts.push(P('Oil pan', 'Holds the oil that lubricates and cools the moving parts.', '#5c7cff', [I(box(3.0, 0.45, 1.25, 1700).move(0, -0.85, 0), [0, -3.0, 0])]));

  // Intake
  const intake = merge(X(frustum(0.24, 0.24, 2.7, 1400, { rings: 4, lines: 6, cap0: true, cap1: true })).move(0, 1.8, 0));
  for (const b of BANKS) {
    for (const x of XS) intake.merge(tube([[x, 1.75, 0], [x + b.dx, 1.75, b.s * 0.25], at(x, b, 1.72, -0.42)], 0.05, 170));
  }
  parts.push(P('Intake manifold', 'Shares incoming air evenly between all eight cylinders.', '#ff4f9a', [I(intake, [0, 3.3, 0])]));

  // Exhaust headers
  parts.push(
    P(
      'Exhaust headers',
      'Four pipes per bank carry the burnt gas away into one collector.',
      '#ff6b4a',
      BANKS.map((b) => {
        const end = at(1.6, b, 0.9, 0.95);
        const c = merge();
        for (const x of XS) c.merge(tube([at(x, b, 1.55, 0.45), at(x, b, 1.35, 0.8), at((x + 1.6) / 2, b, 1.0, 0.95), end], 0.05, 280));
        return I(c, mul(b.o, 1.7));
      }),
    ),
  );

  // Flywheel
  parts.push(P('Flywheel', 'Heavy disc that smooths out the power pulses.', '#f4f1ff', [I(X(merge(disc(0.1, 0.85, 1500, 0), torus(0.85, 0.06, 500))).move(1.85, -0.05, 0), [1.6, 0, 0])]));

  // Timing cover + pulley
  parts.push(P('Timing cover', 'Encloses the chain that keeps the camshaft in step with the crank.', '#4fe3e0', [I(box(0.14, 1.4, 1.1, 900).move(-1.65, 0.1, 0), [-1.3, 0, 0])]));
  parts.push(P('Crank pulley', 'Drives the belt for the alternator and water pump.', '#ffe14d', [I(X(merge(disc(0.08, 0.36, 500, 0), torus(0.36, 0.035, 180))).move(-1.85, 0, 0), [-2.5, 0, 0])]));

  return parts;
}
