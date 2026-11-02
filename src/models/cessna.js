import { Cloud, P, I, merge, frustum, disc, ring, torus, lathe, blades, box, rod, ellipsoid, rand } from './shapes.js';

const PI = Math.PI;
const SIDES = [1, -1];
// Built along +Y, then turned so the fuselage axis is +X (nose on the left).
const A = (c) => c.rotate(0, 0, -PI / 2);
const SQUASH = 0.85; // fuselage is narrower than it is tall

/** Airfoil surface spanning z0..z1, leading edge at x0 (+X is aft). sweep moves the leading edge aft toward z1. */
function foil(z0, z1, x0, chord, n, o = {}) {
  const { th = 0.13, sweep = 0, taper = 1, ribs = 6 } = o;
  const c = new Cloud();
  for (let i = 0; i < n; i++) {
    const t = i % 4 === 0 ? Math.floor(rand() * (ribs + 1)) / ribs : rand();
    const u = rand();
    const h = 5 * th * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u * u * u - 0.1036 * u * u * u * u);
    const ch = chord * (1 + (taper - 1) * t);
    c.add(x0 + sweep * t + u * ch, (rand() < 0.5 ? 1 : -1) * h * ch, z0 + (z1 - z0) * t);
  }
  return c;
}
const wheel = (r, w, n) => merge(torus(r, w, n), disc(0, r * 0.7, n * 0.4)).rotate(PI / 2, 0, 0);

export function buildCessna() {
  const parts = [];
  const WY = 0.86;

  // Fuselage
  const skin = merge(lathe([[0.56, -1.85], [0.74, -1.2], [0.78, 0], [0.62, 1.0], [0.3, 2.4], [0.12, 3.6]], 5200));
  for (const [r, y] of [[0.74, -1.2], [0.78, -0.4], [0.74, 0.4], [0.62, 1.0], [0.47, 1.7], [0.3, 2.4]]) skin.merge(ring(r, y, 260));
  parts.push(P('Fuselage', 'Aluminium skin over ribs and stringers. Every other part hangs off it.', '#e9e6ff', [I(A(skin).scale(1, 1, SQUASH))]));

  // Cowling: two halves
  const cowl = (a0, a1) => A(lathe([[0.14, -3.0], [0.46, -2.75], [0.58, -2.3], [0.56, -1.85]], 1200, { a0, a1 })).scale(1, 1, SQUASH);
  parts.push(
    P('Engine cowling', 'Removable shell that directs cooling air over the engine.', '#ff5a52', [
      I(cowl(PI / 2, (3 * PI) / 2), [-0.8, 1.5, 0]),
      I(cowl(-PI / 2, PI / 2), [-0.8, -1.5, 0]),
    ]),
  );

  // Propeller
  const prop = merge(blades(2, 0.1, 1.2, 0.17, 1500, { pitch: 0.45, twist: 0.6 }), lathe([[0.16, 0.08], [0.12, -0.08], [0, -0.26]], 420));
  parts.push(P('Propeller', 'Two-blade fixed-pitch prop. It pulls the aircraft through the air.', '#ffd23f', [I(A(prop.move(0, -3.05, 0)), [-3.2, 0, 0])]));

  // Engine: flat four
  const eng = merge(box(0.8, 0.36, 0.42, 900).move(-2.35, 0, 0));
  for (const s of SIDES) {
    for (const x of [-2.55, -2.15]) eng.merge(rod([x + s * 0.05, 0, s * 0.2], [x + s * 0.05, 0, s * 0.5], 0.1, 240));
  }
  parts.push(P('Flat-four engine', 'Horizontally opposed Lycoming style engine, air cooled and about 160 hp.', '#ffa53a', [I(eng, [-0.9, 2.3, 0])]));

  // Windshield
  const screen = A(lathe([[0.6, -1.85], [0.79, -1.15]], 900, { a0: PI - 0.95, a1: PI + 0.95 })).scale(1, 1, SQUASH);
  parts.push(P('Windshield', 'Curved acrylic screen that gives the pilot the view ahead.', '#8ad7ff', [I(screen, [-0.7, 1.7, 0])]));

  // Instrument panel
  const panel = merge(box(0.08, 0.42, 1.0, 500).move(-1.32, 0.12, 0));
  for (let k = 0; k < 6; k++) panel.merge(ring(0.07, 0, 60).rotate(0, 0, PI / 2).move(-1.37, k < 3 ? 0.22 : 0.02, -0.25 + (k % 3) * 0.25));
  parts.push(P('Instrument panel', 'Airspeed, altitude, attitude and heading: the six-pack flight instruments.', '#4fe3e0', [I(panel, [-0.4, -2.3, 0])]));

  // Seats
  const seat = () => merge(box(0.42, 0.08, 0.38, 180), box(0.07, 0.5, 0.38, 180).move(0.2, 0.27, 0));
  const seats = [];
  for (const s of SIDES) {
    for (const x of [-0.9, 0.05]) seats.push(I(seat().move(x, -0.42, s * 0.28), [x * 0.3, -2.5, s * 0.7]));
  }
  parts.push(P('Seats (4)', 'Pilot and three passengers sit under the wing.', '#c58bff', seats));

  // Wings
  parts.push(
    P(
      'Wings',
      'High mounted and strut braced. They make the lift and keep the view below clear.',
      '#46d9d0',
      SIDES.map((s) => I(foil(s * 0.1, s * 4.9, -1.25, 1.0, 3400).move(0, WY, 0), [0, 1.2, s * 1.4])),
    ),
  );

  // Flaps
  parts.push(
    P(
      'Flaps',
      'Extend on approach for more lift at low speed and a steeper descent.',
      '#ff9f2e',
      SIDES.map((s) => I(foil(s * 0.25, s * 2.55, -0.5, 0.3, 600, { ribs: 3 }).move(0, WY - 0.02, 0), [0.45, -0.85, s * 0.5])),
    ),
  );

  // Ailerons
  parts.push(
    P(
      'Ailerons',
      'Move in opposite directions to roll the aircraft into a turn.',
      '#ff4f9a',
      SIDES.map((s) => I(foil(s * 2.7, s * 4.75, -0.5, 0.3, 520, { ribs: 3 }).move(0, WY - 0.02, 0), [0.45, 0.6, s * 2.3])),
    ),
  );

  // Fuel tanks
  parts.push(
    P(
      'Fuel tanks',
      'One tank inside each wing. Fuel feeds the engine by gravity.',
      '#ffe14d',
      SIDES.map((s) => I(box(0.5, 0.11, 1.7, 700).move(-0.9, WY, s * 1.4), [0, 2.6, s * 1.0])),
    ),
  );

  // Wing struts
  parts.push(
    P(
      'Wing struts',
      'Carry wing loads down into the lower fuselage, so the wing needs no heavy spar.',
      '#d4c9ff',
      SIDES.map((s) => I(rod([-0.6, -0.55, s * 0.6], [-0.85, WY - 0.05, s * 2.8], 0.03, 340), [0, -0.5, s * 1.3])),
    ),
  );

  // Tailplane
  parts.push(
    P(
      'Horizontal stabilizer',
      'Fixed tail surface that keeps the nose from pitching on its own.',
      '#38c9b8',
      SIDES.map((s) => I(foil(s * 0.05, s * 1.75, 2.95, 0.6, 1000, { th: 0.09, sweep: 0.12, ribs: 4 }).move(0, 0.13, 0), [0.7, 0, s * 1.1])),
    ),
  );
  parts.push(
    P(
      'Elevators',
      'Hinged to the stabilizer. Pull back on the yoke and the nose comes up.',
      '#ff6b4a',
      SIDES.map((s) => I(foil(s * 0.05, s * 1.75, 3.57, 0.24, 500, { th: 0.08, sweep: 0.12, ribs: 3 }).move(0, 0.13, 0), [1.5, 0, s * 1.1])),
    ),
  );

  // Fin and rudder: foil built spanning +Z, then stood up
  const up = (c) => c.rotate(-PI / 2, 0, 0);
  parts.push(P('Vertical fin', 'Keeps the aircraft pointing into the airflow.', '#5c7cff', [I(up(foil(0, 1.45, 2.65, 0.72, 1000, { th: 0.09, sweep: 0.55, taper: 0.7, ribs: 4 })).move(0, 0.18, 0), [0.7, 1.7, 0])]));
  parts.push(P('Rudder', 'Swings the tail left or right, worked by the pedals.', '#ffffff', [I(up(foil(0, 1.45, 3.37, 0.26, 460, { th: 0.08, sweep: 0.35, taper: 0.8, ribs: 3 })).move(0, 0.18, 0), [1.7, 1.7, 0])]));

  // Landing gear
  const mains = SIDES.map((s) => {
    const c = merge(rod([-0.35, -0.68, s * 0.3], [-0.35, -1.45, s * 1.22], 0.035, 300));
    c.merge(wheel(0.17, 0.065, 460).move(-0.35, -1.5, s * 1.27));
    c.merge(ellipsoid(0.34, 0.2, 0.11, 280).move(-0.35, -1.46, s * 1.27));
    return I(c, [0, -1.5, s * 0.9]);
  });
  parts.push(P('Main gear', 'Spring-steel legs absorb the landing without any moving parts.', '#8fa3c9', mains));
  const nose = merge(rod([-2.1, -0.45, 0], [-2.1, -1.5, 0], 0.04, 300), frustum(0.07, 0.07, 0.4, 150).move(-2.1, -0.75, 0), wheel(0.14, 0.055, 360).move(-2.1, -1.55, 0));
  parts.push(P('Nose gear', 'Steerable oleo strut linked to the rudder pedals.', '#ffc2e2', [I(nose, [-0.8, -1.7, 0])]));

  return parts;
}
