import { P, I, merge, frustum, disc, ring, torus, lathe, box, tube, rod, ellipsoid, TAU } from './shapes.js';

const PI = Math.PI;
const ARMS = 8;

/** Point along an arm: t 0..1 from the hub, curling up near the tip. */
function armPt(th, t, phase) {
  const rho = 0.62 + 2.75 * t;
  const swirl = th + 0.55 * t * t * Math.sin(phase);
  const y = -0.62 - 0.95 * Math.sin(t * PI * 0.72) + 0.7 * t * t * t + 0.16 * Math.sin(t * 7 + phase) * t;
  return [rho * Math.cos(swirl), y, rho * Math.sin(swirl)];
}

export function buildOctopus() {
  const parts = [];

  // Mantle: two shells that split front and back
  const mantleProfile = [[0.62, -0.22], [0.86, 0.25], [0.92, 0.75], [0.8, 1.3], [0.5, 1.75], [0, 1.98]];
  parts.push(
    P('Mantle', 'Soft outer dome. It flexes to squeeze water through the siphon.', '#ff5a52', [
      I(lathe(mantleProfile, 2600, { a0: -PI / 2, a1: PI / 2 }), [2.2, 0.8, 0]),
      I(lathe(mantleProfile, 2600, { a0: PI / 2, a1: (3 * PI) / 2 }), [-2.2, 0.8, 0]),
    ]),
  );

  // Pressure hull
  const hull = merge(frustum(0.5, 0.5, 1.1, 2200, { rings: 6, lines: 10 }), ellipsoid(0.5, 0.28, 0.5, 700).move(0, 0.55, 0), ring(0.53, -0.55, 200), ring(0.53, 0.55, 200)).move(0, 0.65, 0);
  parts.push(P('Pressure hull', 'Sealed titanium can that keeps the electronics dry at depth.', '#8fa3c9', [I(hull)]));

  // Inner stack
  parts.push(P('Battery', 'Stacked pouch cells inside the hull.', '#ffd23f', [I(frustum(0.3, 0.3, 0.42, 900, { rings: 4, cap0: true, cap1: true }).move(0, 0.42, 0), [0, -3.8, 2.2])]));
  const brain = merge();
  for (let k = 0; k < 3; k++) brain.merge(disc(0, 0.34, 340, 0.82 + k * 0.13));
  parts.push(P('Control stack', 'Three boards: navigation, arm control and sonar.', '#38c9b8', [I(brain, [0, 3.0, 0])]));

  // Eyes
  parts.push(
    P(
      'Eyes',
      'Low-light cameras on stalks. They see nearly all the way around.',
      '#ffe14d',
      [1, -1].map((s) => {
        const e = merge(ellipsoid(0.2, 0.2, 0.2, 620), disc(0, 0.1, 110).rotate(PI / 2, 0, 0).move(0, 0, s * 0.21)).move(0.25, 0.48, s * 0.82);
        return I(e, [0.6, 0.5, s * 1.9]);
      }),
    ),
  );

  // Siphon
  const siphon = merge(tube([[0, 0.05, 0.55], [0.72, -0.05, 0.58], [1.1, -0.12, 0.42]], 0.13, 700, { taper: (t) => 1 - 0.45 * t }), ring(0.09, 0, 80).rotate(0, 0, PI / 2).move(1.1, -0.12, 0.42));
  parts.push(P('Siphon jet', 'Forces water out to dash backwards in a burst.', '#ff9f2e', [I(siphon, [2.4, -0.2, 1.0])]));

  // Pump
  const pump = merge(frustum(0.2, 0.2, 0.34, 520, { rings: 3, cap0: true, cap1: true }), disc(0, 0.17, 150, 0)).move(0, -0.02, 0);
  parts.push(P('Water pump', 'Impeller pump that drives the siphon jet.', '#ff4f9a', [I(pump, [1.6, -1.4, 0.2])]));

  // Hub
  const hub = merge(frustum(0.66, 0.5, 0.3, 1200, { rings: 3, lines: 8 }), torus(0.66, 0.05, 340).move(0, 0.15, 0)).move(0, -0.4, 0);
  parts.push(P('Arm hub', 'Ring where all eight arms meet, with a drive for each one.', '#d4c9ff', [I(hub, [0, -0.5, 0])]));

  // Arms, spines, suckers, motors
  const arms = [];
  const spines = [];
  const suckers = [];
  const motors = [];
  for (let k = 0; k < ARMS; k++) {
    const th = ((k + 0.5) / ARMS) * TAU;
    const phase = k * 1.7;
    const path = Array.from({ length: 9 }, (_, i) => armPt(th, i / 8, phase));
    const out = [Math.cos(th), 0, Math.sin(th)];
    const dir = [out[0] * 1.25, -0.5, out[2] * 1.25];
    arms.push(I(tube(path, 0.17, 2200, { taper: (t) => 1 - 0.88 * t }), dir));
    spines.push(I(tube(path, 0.03, 420, { taper: (t) => 1 - 0.7 * t }), [out[0] * 0.55, -1.5, out[2] * 0.55]));
    const s = merge();
    for (let j = 1; j < 15; j++) {
      const t = j / 15;
      const c = armPt(th, t, phase);
      const r = 0.085 * (1 - 0.78 * t);
      const offset = 0.17 * (1 - 0.88 * t);
      s.merge(torus(r, r * 0.3, 40).move(c[0], c[1] - offset, c[2]), disc(0, r, 18).move(c[0], c[1] - offset, c[2]));
    }
    suckers.push(I(s, [out[0] * 1.3, -2.1, out[2] * 1.3]));
    const m = armPt(th, 0, phase);
    motors.push(I(box(0.19, 0.19, 0.19, 170).move(m[0] * 0.92, -0.42, m[2] * 0.92), [out[0] * 0.2, -3.3, out[2] * 0.2]));
  }
  parts.push(P('Arms (8)', 'Silicone arms with no joints. They bend anywhere along their length.', '#c58bff', arms));
  parts.push(P('Tendon spines', 'Cables pull inside each arm to curl it in any direction.', '#46d9d0', spines));
  parts.push(P('Suckers', 'Vacuum cups along the underside that grip rock and tools.', '#ffc2e2', suckers));
  parts.push(P('Arm motors', 'A drive per arm reels the tendons in and out.', '#ffa53a', motors));

  // Propeller-free mouth + sonar
  const mouth = merge(lathe([[0.26, -0.66], [0.12, -0.84], [0, -0.93]], 460), rod([0, -0.92, 0], [0, -1.05, 0], 0.02, 40));
  parts.push(P('Sonar beak', 'Downward sonar at the centre of the arms.', '#ffffff', [I(mouth, [0, -2.8, 0])]));

  return parts;
}
