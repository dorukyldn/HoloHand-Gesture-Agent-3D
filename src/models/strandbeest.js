import { P, I, merge, box, rod, disc, torus, TAU } from './shapes.js';

const PI = Math.PI;
const U = 1 / 40; // Jansen's holy numbers are in arbitrary units
const LEN = { a: 38, b: 41.5, c: 39.3, d: 40.1, e: 55.8, f: 39.4, g: 36.7, h: 65.7, i: 49, j: 50, k: 61.9, l: 7.8, m: 15 };
const LEGS = 6;

/** Intersection of two circles. pick chooses between the two solutions. */
function cc(p, r0, q, r1, pick) {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const d = Math.hypot(dx, dy);
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r0 * r0 - a * a));
  const mx = p[0] + (a * dx) / d;
  const my = p[1] + (a * dy) / d;
  return pick([mx + (h * dy) / d, my - (h * dx) / d], [mx - (h * dy) / d, my + (h * dx) / d]);
}
const upper = (a, b) => (a[1] > b[1] ? a : b);
const lower = (a, b) => (a[1] < b[1] ? a : b);
const left = (a, b) => (a[0] < b[0] ? a : b);

/** Solve one Jansen leg for a crank tip, in the leg's own frame (leg reaches to -X). */
function solve(C) {
  const B = [-LEN.a, -LEN.l];
  const up = cc(C, LEN.j, B, LEN.b, upper);
  const back = cc(up, LEN.e, B, LEN.d, left);
  const low = cc(C, LEN.k, B, LEN.c, lower);
  const knee = cc(back, LEN.f, low, LEN.g, left);
  const foot = cc(low, LEN.i, knee, LEN.h, lower);
  return { C, B, up, back, low, knee, foot };
}

export function buildStrandbeest() {
  const upperTri = [];
  const lowerTri = [];
  const rockers = [];
  const links = [];
  const feet = [];
  const crank = merge();
  const zAt = (k) => (k - (LEGS - 1) / 2) * 0.56;

  crank.merge(rod([0, 0, zAt(0) - 0.4], [0, 0, zAt(LEGS - 1) + 0.4], 0.04, 700, { caps: true }));

  for (let k = 0; k < LEGS; k++) {
    const z = zAt(k);
    const th = (k * TAU) / 3;
    const tip = [LEN.m * Math.cos(th), LEN.m * Math.sin(th)];
    crank.merge(
      rod([0, 0, z], [tip[0] * U, tip[1] * U, z], 0.03, 110),
      rod([tip[0] * U, tip[1] * U, z - 0.12], [tip[0] * U, tip[1] * U, z + 0.12], 0.025, 70),
    );
    for (const s of [1, -1]) {
      const j = solve([s * tip[0], tip[1]]); // mirrored leg shares the same crank pin
      const zz = z + s * 0.07;
      const W = (p) => [s * p[0] * U, p[1] * U, zz];
      const bar = (a, b, r = 0.022, n = 150) => rod(W(a), W(b), r, n);
      const ex = z * 1.5;
      upperTri.push(I(merge(bar(j.B, j.up), bar(j.up, j.back), bar(j.back, j.B)), [s * 0.8, 1.0, ex]));
      lowerTri.push(I(merge(bar(j.low, j.knee), bar(j.knee, j.foot, 0.024, 210), bar(j.foot, j.low, 0.024, 170)), [s * 0.8, -1.1, ex]));
      rockers.push(I(merge(bar(j.B, j.low), bar(j.back, j.knee)), [s * 1.7, -0.1, ex]));
      links.push(I(merge(bar(j.C, j.up), bar(j.C, j.low)), [s * 0.2, 0.1, ex * 1.3]));
      const f = W(j.foot);
      feet.push(I(merge(disc(0, 0.09, 90).move(f[0], f[1] - 0.02, f[2]), torus(0.09, 0.012, 70).move(f[0], f[1] - 0.02, f[2])), [s * 0.8, -1.8, ex]));
    }
  }

  // Frame: beams at the crank and at each fixed pivot
  const zEnd = zAt(LEGS - 1) + 0.5;
  const Bx = LEN.a * U;
  const By = -LEN.l * U;
  const frame = merge(
    box(0.07, 0.07, zEnd * 2, 400).move(Bx, By, 0),
    box(0.07, 0.07, zEnd * 2, 400).move(-Bx, By, 0),
    box(0.06, 0.06, zEnd * 2, 300).move(0, 0.3, 0),
  );
  for (const z of [-zEnd, 0, zEnd]) {
    frame.merge(rod([Bx, By, z], [0, 0.3, z], 0.02, 110), rod([-Bx, By, z], [0, 0.3, z], 0.02, 110), rod([-Bx, By, z], [Bx, By, z], 0.02, 150));
  }
  const sails = merge();
  for (const z of [-zEnd * 0.7, 0, zEnd * 0.7]) {
    sails.merge(rod([0, 0.3, z], [0, 2.2, z], 0.018, 160));
    sails.merge(box(1.5, 1.4, 0.015, 900, { edges: 0.15 }).rotate(0, 0.5, 0).move(0, 1.45, z));
  }

  return [
    P('Frame', 'PVC backbone. It holds the crank and the fixed pivot of every leg.', '#f4f1ff', [I(frame)]),
    P('Crankshaft', 'Wind or a push turns it. Three phases keep some feet on the ground at all times.', '#ffd23f', [I(crank, [0, 0.9, 0])]),
    P('Upper triangles', 'Rigid triangle that rocks on the frame pivot and guides the leg.', '#46d9d0', upperTri),
    P('Lower triangles', 'Rigid shank that ends in the foot. Its tip traces a flat walking path.', '#ff4f9a', lowerTri),
    P('Rocker links', 'These bars tie the shank to the frame, shaping the foot path.', '#c58bff', rockers),
    P('Crank links', 'Two long bars per leg carry the crank rotation into the linkage.', '#ffa53a', links),
    P('Feet', 'Lift cleanly on the way back and stay level while on the ground.', '#ff6b4a', feet),
    P('Wind sails', 'Catch the wind that powers the whole beach animal.', '#8ad7ff', [I(sails, [0, 2.2, 0])]),
  ];
}
