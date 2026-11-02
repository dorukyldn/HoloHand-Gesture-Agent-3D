import { Cloud, P, I, merge, frustum, disc, ring, torus, lathe, box, rod, TAU, R, rand } from './shapes.js';

const PI = Math.PI;

/** Toothed wheel in the XZ plane around +Y, with spokes. */
function gear(r, teeth, n, y = 0, spokes = 5) {
  const c = new Cloud();
  const nRim = Math.floor(n * 0.6);
  for (let i = 0; i < nRim; i++) {
    const a = rand() * TAU;
    const rr = Math.sin(a * teeth) > 0 ? r + 0.045 : r * R(0.92, 1);
    c.add(rr * Math.cos(a), y + R(-0.015, 0.015), rr * Math.sin(a));
  }
  for (let i = nRim; i < n; i++) {
    const a = (Math.floor(rand() * spokes) / spokes) * TAU + R(-0.05, 0.05);
    const rr = R(0.05, r);
    c.add(rr * Math.cos(a), y, rr * Math.sin(a));
  }
  return c;
}
/** Spiral in the XZ plane. */
function spiral(r0, r1, turns, n, y = 0) {
  const c = new Cloud();
  for (let i = 0; i < n; i++) {
    const t = rand();
    const a = t * turns * TAU;
    const rr = r0 + (r1 - r0) * t;
    c.add(rr * Math.cos(a), y + R(-0.02, 0.02), rr * Math.sin(a));
  }
  return c;
}
const arbor = (x, z, y0, y1) => rod([x, y0, z], [x, y1, z], 0.022, 60);

export function buildWatch() {
  const parts = [];

  // Case
  const lugs = merge();
  for (const sx of [1, -1]) for (const sz of [1, -1]) lugs.merge(box(0.28, 0.2, 0.6, 130).rotate(0, sx * sz * 0.2, 0).move(sx * 1.1, -0.05, sz * 2.25));
  const crown = merge(frustum(0.17, 0.17, 0.3, 300, { lines: 14, cap1: true })).rotate(0, 0, -PI / 2).move(2.45, 0, 0);
  parts.push(P('Case', 'Steel middle case that seals out dust and water.', '#8fa3c9', [I(merge(frustum(2.15, 2.15, 0.75, 3200, { rings: 5, lines: 40 }), torus(2.15, 0.05, 500).move(0, 0.38, 0), lugs))]));
  parts.push(P('Crown', 'Turn it to wind the mainspring. Pull it out to set the hands.', '#ffd23f', [I(crown, [1.9, 0, 0])]));

  // Crystal + bezel
  parts.push(P('Crystal', 'Domed sapphire glass, nearly impossible to scratch.', '#8ad7ff', [I(lathe([[2.05, 0.45], [1.5, 0.58], [0.7, 0.66], [0, 0.68]], 2200), [0, 4.3, 0])]));
  parts.push(P('Bezel', 'Ring that presses the crystal onto its gasket.', '#46d9d0', [I(merge(torus(2.05, 0.09, 900).move(0, 0.45, 0), ring(1.98, 0.5, 200)), [0, 3.6, 0])]));

  // Hands
  const hand = (len, w, n, y, ang) => box(w, 0.014, len, n, { edges: 0.4 }).move(0, y, len / 2 - 0.1).rotate(0, ang, 0);
  parts.push(
    P('Hands', 'Hour, minute and second, all stacked on one centre axis.', '#ffffff', [
      I(hand(1.0, 0.11, 320, 0.4, 0.9), [0, 2.5, 0]),
      I(hand(1.5, 0.08, 360, 0.43, 2.45), [0, 2.8, 0]),
      I(merge(hand(1.75, 0.02, 220, 0.46, 4.4), disc(0, 0.07, 50, 0.46)), [0, 3.1, 0]),
    ]),
  );

  // Dial
  const dial = merge(disc(0.05, 1.98, 2400, 0.36));
  for (let k = 0; k < 12; k++) dial.merge(box(0.07, 0.03, 0.28, 110).move(0, 0.38, 1.72).rotate(0, (k / 12) * TAU, 0));
  parts.push(P('Dial', 'The watch face. Its markers tell you the time.', '#e9e6ff', [I(dial, [0, 1.9, 0])]));

  // Bridges
  const bridge = (x, z, w, d, ang, n) => box(w, 0.04, d, n, { edges: 0.4 }).rotate(0, ang, 0).move(x, 0.24, z);
  parts.push(
    P('Bridges', 'Brass plates that hold the top pivot of every wheel.', '#ffa53a', [
      I(bridge(-0.85, 0.6, 1.6, 0.5, 0.2, 480), [-0.4, 1.3, 0.2]),
      I(bridge(0.75, 0.15, 0.5, 1.6, 0.35, 480), [0.4, 1.3, 0.1]),
      I(bridge(-0.55, -1.0, 1.4, 0.3, -0.25, 360), [-0.3, 1.3, -0.3]),
    ]),
  );

  // Going train
  parts.push(P('Barrel', 'Drum that holds the mainspring and drives the whole train.', '#ff5a52', [I(merge(gear(0.85, 40, 1500, -0.14, 3), frustum(0.72, 0.72, 0.18, 500, { rings: 2 }).move(0, -0.06, 0)).move(-0.85, 0, 0.55), [-0.7, -0.6, 0.45])]));
  parts.push(P('Mainspring', 'Coiled steel strip. Winding it stores about 40 hours of energy.', '#ffe14d', [I(spiral(0.14, 0.68, 8, 1000, 0.02).move(-0.85, 0, 0.55), [-0.7, 0.6, 0.45])]));
  parts.push(P('Centre wheel', 'Turns once an hour and carries the minute hand.', '#ff9f2e', [I(merge(gear(0.72, 36, 1100, 0.12), arbor(0, 0, -0.2, 0.42), gear(0.12, 8, 130, 0.0, 3)), [0, 0.65, 0])]));
  parts.push(P('Third wheel', 'Steps the speed up between the centre and fourth wheels.', '#ff4f9a', [I(merge(gear(0.5, 30, 800, 0.04), arbor(0, 0, -0.18, 0.22), gear(0.09, 8, 90, 0.12, 3)).move(0.75, 0, 0.55), [0.55, 0.42, 0.42])]));
  parts.push(P('Fourth wheel', 'Turns once a minute and carries the second hand.', '#c58bff', [I(merge(gear(0.42, 30, 700, 0.1), arbor(0, 0, -0.18, 0.22), gear(0.08, 8, 80, 0.02, 3)).move(1.1, 0, -0.25), [0.85, 0.22, -0.2])]));
  parts.push(P('Escape wheel', 'Hooked teeth release energy one tick at a time.', '#38c9b8', [I(merge(gear(0.3, 15, 560, 0.0, 4), arbor(0, 0, -0.18, 0.22)).move(0.55, 0, -0.88), [0.5, -0.1, -0.7])]));

  // Pallet fork
  const pf = merge(rod([0.32, -0.02, -1.15], [-0.02, -0.02, -1.42], 0.02, 130), rod([0.32, -0.02, -1.15], [0.44, -0.02, -1.12], 0.018, 50), rod([0.32, -0.02, -1.15], [0.22, -0.02, -0.98], 0.018, 50), arbor(0.32, -1.15, -0.18, 0.18));
  parts.push(P('Pallet fork', 'Rocks to and fro, locking and unlocking the escape wheel. This makes the tick.', '#ffc2e2', [I(pf, [0.2, -0.45, -0.9])]));

  // Balance
  const bal = merge(torus(0.62, 0.03, 700), rod([-0.62, 0, 0], [0.62, 0, 0], 0.016, 110), rod([0, 0, -0.62], [0, 0, 0.62], 0.016, 110), arbor(0, 0, -0.18, 0.24), ring(0.65, 0, 90)).move(-0.55, 0.06, -1.0);
  parts.push(P('Balance wheel', 'Swings back and forth 4 times a second. This is the timekeeper.', '#4fe3e0', [I(bal, [-0.6, 0.65, -1.0])]));
  parts.push(P('Hairspring', 'Hair-thin spiral that returns the balance to the centre on each swing.', '#ffffff', [I(spiral(0.05, 0.3, 9, 460, 0.15).move(-0.55, 0, -1.0), [-0.6, 1.3, -1.0])]));

  // Jewels
  const jewels = [[-0.85, 0.55], [0, 0], [0.75, 0.55], [1.1, -0.25], [0.55, -0.88], [0.32, -1.15], [-0.55, -1.0]].map(([x, z]) => I(merge(torus(0.05, 0.022, 70), disc(0, 0.04, 20)).move(x, 0.29, z), [x * 0.35, 3.1, z * 0.35]));
  parts.push(P('Jewels', 'Synthetic rubies as bearings, so the pivots hardly wear.', '#ff3d5a', jewels));

  // Main plate + back
  parts.push(P('Main plate', 'Base of the movement. Everything is built up on top of it.', '#ffb02e', [I(merge(disc(0.05, 1.92, 2000, -0.24), ring(1.92, -0.24, 300)), [0, -1.5, 0])]));
  parts.push(P('Case back', 'Screws on to close the watch and press it against your wrist.', '#d4c9ff', [I(merge(disc(0, 2.05, 1500, -0.42), torus(2.05, 0.05, 500).move(0, -0.42, 0), ring(1.2, -0.44, 200)), [0, -2.7, 0])]));

  return parts;
}
