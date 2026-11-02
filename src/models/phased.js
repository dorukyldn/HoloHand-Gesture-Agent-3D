import { Cloud, P, I, merge, frustum, box, rod, R, rand } from './shapes.js';

const N = 16; // elements per side
const PITCH = 0.16;
const CX = 0.3; // the aperture sits off-centre, the free end holds the power section
const HALF = (N * PITCH) / 2;
const W = 5.2; // housing length (X)
const D = 3.4; // housing depth (Z)
const BW = 4.7; // board length
const BD = 3.0; // board depth

/** Flat sheet at height y, with an optional rectangular window [x0, x1, z0, z1]. */
function plate(x0, x1, z0, z1, y, n, hole) {
  const c = new Cloud();
  for (let i = 0; i < n; ) {
    const edge = i % 5 === 0;
    let x = R(x0, x1);
    let z = R(z0, z1);
    if (edge) {
      if (rand() < 0.5) z = rand() < 0.5 ? z0 : z1;
      else x = rand() < 0.5 ? x0 : x1;
    }
    i++;
    if (hole && x > hole[0] && x < hole[1] && z > hole[2] && z < hole[3]) continue;
    c.add(x, y, z);
  }
  return c;
}
/** Flat copper line between two points in the XZ plane. */
function trace(a, b, w, n, y) {
  const c = new Cloud();
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / L;
  const nz = (b[0] - a[0]) / L;
  for (let i = 0; i < n; i++) {
    const t = rand();
    const v = R(-w / 2, w / 2);
    c.add(a[0] + (b[0] - a[0]) * t + nx * v, y, a[1] + (b[1] - a[1]) * t + nz * v);
  }
  return c;
}
/** H-tree: every split halves the signal path, so all elements see the same length. */
function hTree(x, z, dx, dz, depth, y, cloud, leaves) {
  const seg = Math.floor(90 + depth * 150);
  cloud.merge(trace([x - dx, z], [x + dx, z], 0.05, seg, y));
  for (const sx of [-1, 1]) {
    cloud.merge(trace([x + sx * dx, z - dz], [x + sx * dx, z + dz], 0.05, seg, y));
    for (const sz of [-1, 1]) {
      if (depth > 0) hTree(x + sx * dx, z + sz * dz, dx / 2, dz / 2, depth - 1, y, cloud, leaves);
      else leaves.push([x + sx * dx, z + sz * dz]);
    }
  }
}
const chip = (x, z, y, w, d, h, n) => box(w, h, d, n).move(x, y + h / 2, z);

export function buildPhased() {
  const parts = [];

  // Housing tray: floor, four walls, flange ears
  const tray = merge(plate(-W / 2, W / 2, -D / 2, D / 2, -0.38, 1500, [-1.3, -0.6, -0.2, 0.2]));
  tray.merge(box(W, 0.76, 0.05, 900).move(0, 0, D / 2), box(W, 0.76, 0.05, 900).move(0, 0, -D / 2));
  tray.merge(box(0.05, 0.76, D, 620).move(W / 2, 0, 0), box(0.05, 0.76, D, 620).move(-W / 2, 0, 0));
  for (const x of [-1.8, -0.6, 0.6, 1.8]) {
    for (const s of [1, -1]) tray.merge(box(0.2, 0.05, 0.14, 40).move(x, 0.36, s * (D / 2 + 0.07)));
  }
  parts.push(P('Housing', 'Milled, gold-plated tray. It seals the electronics and pulls heat out of the chips.', '#ffb02e', [I(tray, [0, -1.9, 0])]));

  // Mounting feet
  const feet = [];
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      const c = merge(box(0.3, 0.7, 0.09, 150).move(0, -0.72, 0), box(0.3, 0.09, 0.4, 120).move(0, -1.05, 0.15), box(0.1, 0.3, 0.3, 60).move(0, -0.55, -0.1));
      if (sz < 0) c.scale(1, 1, -1);
      feet.push(I(c.move(sx * 1.75, 0, sz * 1.75), [sx * 0.8, -2.5, sz * 0.8]));
    }
  }
  parts.push(P('Mounting feet', 'Bolt the module to the satellite structure and conduct heat into it.', '#ff9f2e', feet));

  // Control board
  parts.push(P('Control board', 'Lower circuit board. It takes commands and power and hands them on to the array.', '#6a64a8', [I(plate(-BW / 2, BW / 2, -BD / 2, BD / 2, -0.18, 2400), [0, -1.05, 0])]));

  // Control chips
  const logic = merge(chip(0.9, 0.3, -0.17, 0.4, 0.4, 0.05, 240), chip(0.3, -0.5, -0.17, 0.32, 0.32, 0.05, 200), chip(1.2, -0.65, -0.17, 0.3, 0.2, 0.05, 150), chip(1.45, 0.55, -0.17, 0.26, 0.14, 0.04, 100));
  for (const [x, z] of [[0.25, 0.7], [0.7, 0.85], [1.25, 0.15], [1.4, -0.15]]) logic.merge(chip(x, z, -0.17, 0.16, 0.16, 0.04, 70));
  parts.push(P('Control chips', 'Processor and logic that work out the phase each element needs for the beam angle.', '#38c9b8', [I(logic, [0.3, -0.45, 0])]));

  // Power section
  const power = merge();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) power.merge(chip(-1.35 + col * 0.24, -1.05 + row * 0.3, -0.17, 0.17, 0.2, 0.1, 62));
  }
  parts.push(P('Power section', 'Banks of capacitors and inductors that clean the supply rails for the RF chips.', '#ff6b4a', [I(power, [-0.7, -0.55, 0])]));

  // Power connector
  const dc = merge(box(0.5, 0.3, 1.6, 760).move(-2.1, -0.02, 0));
  for (let k = 0; k < 8; k++) dc.merge(rod([-2.34, 0.14, -0.7 + k * 0.2], [-1.86, 0.14, -0.7 + k * 0.2], 0.018, 40));
  parts.push(P('Power connector', 'High-current header that brings the power in from the platform.', '#d4c9ff', [I(dc, [-1.3, -0.5, 0])]));

  // Side connectors
  const io = [
    [-1.0, 0.75, 0.2],
    [0.75, 0.75, 0.16],
  ].map(([x, w, h]) => I(merge(box(w, h, 0.12, 360).move(x, -0.08, D / 2 + 0.03), box(w * 0.75, h * 0.6, 0.05, 110).move(x, -0.08, D / 2 + 0.11)), [x * 0.2, -0.5, 1.4]));
  parts.push(P('Data connectors', 'Side ports for the command, telemetry and data lines.', '#4fe3e0', io));

  // RF port
  const coax = merge(rod([CX, 0.14, D / 2 - 0.3], [CX, 0.14, D / 2 + 0.34], 0.05, 200, { caps: true }), box(0.34, 0.26, 0.09, 140).move(CX, 0.14, D / 2 + 0.03));
  parts.push(P('RF port', 'Coaxial connector. The whole array signal passes through this one point.', '#ffe14d', [I(coax, [0, 1.15, 1.7])]));

  // Shield plates
  parts.push(
    P('Shield plates', 'Machined covers that stop circuits on the board from interfering with each other.', '#e9e6ff', [
      I(box(1.3, 0.05, 1.5, 620).move(-1.0, 0.03, -0.3), [-0.4, 0.2, -0.3]),
      I(box(0.45, 0.05, 0.9, 260).move(-0.2, 0.03, 0.8), [-0.1, 0.2, 0.4]),
      I(box(0.8, 0.05, 0.55, 300).move(0.4, 0.03, -0.75), [0.2, 0.2, -0.45]),
    ]),
  );

  // Middle deck
  parts.push(P('Middle deck', 'Metal floor between the boards. It carries the RF board and spreads its heat.', '#8fa3c9', [I(plate(-W / 2 + 0.1, W / 2 - 0.1, -D / 2 + 0.1, D / 2 - 0.1, 0.16, 2000, [-2.15, -1.6, -0.8, 0.8]), [0, 0.5, 0])]));

  // RF board
  parts.push(P('RF board', 'Upper multilayer board. It carries the signal between one port and all the elements.', '#5c7cff', [I(plate(-BW / 2, BW / 2, -BD / 2, BD / 2, 0.24, 2200), [0, 1.05, 0])]));

  // Feed network
  const feed = new Cloud();
  const leaves = [];
  hTree(CX, 0, HALF / 2, HALF / 2, 1, 0.255, feed, leaves);
  feed.merge(trace([CX, 0], [CX, D / 2 - 0.2], 0.05, 200, 0.255));
  parts.push(P('Feed network', 'H-tree of copper lines. Every path has the same length, so all elements stay in phase.', '#ffc2e2', [I(feed, [0, 1.3, 0])]));

  // Beamformer chips, one at each leaf of the feed network
  const bf = leaves.map(([x, z]) => I(merge(chip(x, z, 0.26, 0.14, 0.14, 0.035, 80), plate(x - 0.11, x + 0.11, z - 0.11, z + 0.11, 0.26, 40)), [(x - CX) * 0.3, 1.75, z * 0.3]));
  parts.push(P('Beamformer chips', 'One chip per group of elements. It sets each channel’s phase and gain, which is what steers the beam.', '#ff4f9a', bf));

  // Board-to-board connector
  const b2b = merge(box(0.32, 0.26, 2.0, 900).move(2.05, 0.1, 0));
  for (let k = 0; k < 26; k++) b2b.merge(rod([1.97, 0.23, -0.95 + k * 0.076], [1.97, 0.3, -0.95 + k * 0.076], 0.008, 7), rod([2.13, 0.23, -0.95 + k * 0.076], [2.13, 0.3, -0.95 + k * 0.076], 0.008, 7));
  parts.push(P('Board connector', 'Dense stack connector that links the control and RF boards.', '#c58bff', [I(b2b, [1.0, 0.45, 0])]));

  // Antenna board with its via grid
  const ant = merge(plate(-BW / 2, BW / 2, -BD / 2, BD / 2, 0.36, 2000));
  for (let k = 0; k < 26; k++) {
    for (const x of [2.0, 2.1]) ant.merge(box(0.02, 0.01, 0.02, 4).move(x, 0.37, -0.95 + k * 0.076));
  }
  parts.push(P('Antenna board', 'Top layer of low-loss laminate that holds the radiating elements.', '#46d9d0', [I(ant, [0, 2.3, 0])]));

  // Radiating elements
  const elems = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = CX + (i - (N - 1) / 2) * PITCH;
      const z = (j - (N - 1) / 2) * PITCH;
      const c = plate(x - 0.055, x + 0.055, z - 0.055, z + 0.055, 0.38, 34);
      elems.push(I(c, [(x - CX) * 0.35, 2.75, z * 0.35]));
    }
  }
  parts.push(P('Patch elements (256)', '16 by 16 antennas, about half a wavelength apart. Their signals add up in one direction.', '#ffffff', elems));

  // Lid
  const m = 0.14;
  const lid = merge(plate(-W / 2, W / 2, -D / 2, D / 2, 0.42, 3000, [CX - HALF - m, CX + HALF + m, -HALF - m, HALF + m]));
  const screws = merge();
  for (const x of [-2.45, -1.2, 0, 1.2, 2.45]) {
    for (const s of [1, -1]) screws.merge(rod([x, 0.36, s * 1.6], [x, 0.5, s * 1.6], 0.035, 34));
  }
  parts.push(P('Lid', 'Metal top plate with a window that exposes only the aperture.', '#ffd23f', [I(lid, [0, 3.3, 0])]));
  parts.push(P('Lid screws', 'Fix the lid on and hold the stack under even pressure.', '#ffa53a', [I(screws, [0, 3.9, 0])]));

  // Radome
  parts.push(P('Radome', 'Thin window over the array. Radio waves pass through, dust and debris do not.', '#8ad7ff', [I(plate(CX - HALF - m, CX + HALF + m, -HALF - m, HALF + m, 0.46, 1100), [0, 3.75, 0])]));

  // Steered beam
  const beam = new Cloud();
  for (let i = 0; i < 3600; i++) {
    const x = CX + Math.round(R(-7.5, 7.5)) * PITCH;
    const z = Math.round(R(-7.5, 7.5)) * PITCH;
    const t = rand() * rand();
    const h = t * 1.8;
    const spread = 1 + t * 0.25;
    beam.add(CX + (x - CX) * spread + h * 0.4, 0.5 + h, z * spread);
  }
  parts.push(P('Steered beam', 'No moving parts: changing the phase across the elements tilts the beam electronically.', '#7dffb2', [I(beam, [0.4, 4.0, 0])]));

  return parts;
}
