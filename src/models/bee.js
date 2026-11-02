import { Cloud, P, I, merge, frustum, box, tube, rod, ellipsoid, disc, torus, rand } from './shapes.js';

const PI = Math.PI;
const SIDES = [1, -1];

/** Flat veined wing in the XZ plane, root at the origin, tip at +X. */
function wing(L, W, n) {
  const c = new Cloud();
  const width = (u) => W * Math.sin(PI * Math.pow(u, 0.72));
  for (let i = 0; i < n; i++) {
    const u = rand();
    const w = width(u);
    const kind = i % 5;
    let v = rand() - 0.5;
    if (kind === 0) v = rand() < 0.5 ? -0.5 : 0.5; // outline
    else if (kind === 1) v = -0.4 + Math.floor(rand() * 5) * 0.2; // veins
    c.add(u * L, 0, v * w);
  }
  return c;
}

export function buildBee() {
  const parts = [];

  // Thorax shell
  const thorax = ellipsoid(0.68, 0.6, 0.6, 2800).move(0.3, 0.1, 0);
  parts.push(P('Thorax shell', 'Carbon shell that carries the wings and all six legs.', '#ffb02e', [I(thorax, [0, 1.2, 0])]));

  // Head
  parts.push(P('Head', 'Sensor pod in front of the thorax.', '#3d3a5c', [I(ellipsoid(0.42, 0.44, 0.48, 1600).move(1.32, 0.12, 0), [1.5, 0.2, 0])]));

  // Compound eyes
  parts.push(
    P(
      'Compound eyes',
      'Wide-angle sensors that read motion and polarised sky light for navigation.',
      '#4fe3e0',
      SIDES.map((s) => I(ellipsoid(0.22, 0.32, 0.14, 820).move(1.4, 0.18, s * 0.4), [2.2, 0.5, s * 1.0])),
    ),
  );

  // Antennae
  parts.push(
    P(
      'Antennae',
      'Chemical and airflow sensors that sniff out flowers.',
      '#ffffff',
      SIDES.map((s) => I(tube([[1.62, 0.42, s * 0.12], [1.95, 0.85, s * 0.28], [2.45, 0.92, s * 0.42]], 0.022, 330), [2.3, 1.1, s * 0.5])),
    ),
  );

  // Mouth
  parts.push(P('Proboscis', 'Tube that reaches into a flower to draw up nectar.', '#ff9f2e', [I(tube([[1.65, -0.12, 0], [1.9, -0.45, 0], [2.0, -0.85, 0]], 0.03, 260), [2.0, -1.0, 0])]));

  // Wings
  const wings = (L, W, rootX, back, ex, n) =>
    SIDES.map((s) => {
      const c = wing(L, W, n).rotate(-0.3 * s, -s * (PI / 2 + back), 0).move(rootX, 0.55, s * 0.28);
      return I(c, [ex, 1.8, s * 1.3]);
    });
  parts.push(P('Forewings', 'Thin film on carbon veins. They beat around 200 times a second.', '#8ad7ff', wings(2.7, 0.95, 0.45, 0.25, 0.5, 2100)));
  parts.push(P('Hindwings', 'Smaller rear pair. They hook to the forewings in flight.', '#c58bff', wings(1.9, 0.72, 0.02, 0.8, -0.5, 1500)));

  // Flapping drive
  const drive = merge(box(0.42, 0.22, 0.46, 520).move(0.3, 0.14, 0));
  for (const s of SIDES) drive.merge(rod([0.3, 0.2, s * 0.2], [0.42, 0.55, s * 0.3], 0.025, 90), rod([0.2, 0.2, s * 0.2], [0.02, 0.55, s * 0.3], 0.025, 90));
  parts.push(P('Flapping drive', 'Piezo actuator and hinges that turn tiny strokes into wide wing beats.', '#ff4f9a', [I(drive, [0, 3.0, 0])]));

  // Flight board
  const board = merge(box(0.58, 0.03, 0.34, 360).move(0.32, -0.18, 0));
  for (let k = 0; k < 3; k++) board.merge(box(0.1, 0.05, 0.1, 60).move(0.14 + k * 0.18, -0.15, 0));
  parts.push(P('Flight computer', 'Tiny board with a gyro and accelerometers to keep it stable.', '#38c9b8', [I(board, [0.3, -2.7, 0])]));

  // Abdomen: striped bands that spread apart
  const dark = [];
  const gold = [];
  const BANDS = 6;
  for (let k = 0; k < BANDS; k++) {
    const t0 = k / BANDS;
    const t1 = (k + 1) / BANDS;
    const f = (t) => 0.62 * Math.sqrt(Math.max(0.02, 1 - Math.pow(t > 0.275 ? (t - 0.275) / 0.725 : (0.275 - t) / 0.275, 2)));
    const c = frustum(f(t0), f(t1), 1.95 / BANDS, 860, { rings: 2 }).rotate(0, 0, PI / 2).move(-0.4 - ((t0 + t1) / 2) * 1.95, -0.1 - t0 * 0.3, 0);
    const dir = [-0.45 - k * 0.42, -0.1 - k * 0.04, 0];
    (k % 2 ? dark : gold).push(I(c, dir));
  }
  parts.push(P('Gold bands', 'Abdomen plates that telescope, so it can pump air and shift its balance.', '#ffd23f', gold));
  parts.push(P('Dark bands', 'Alternating plates that house the pollen sensor and antenna coil.', '#6a64a8', dark));

  // Battery
  parts.push(P('Battery', 'Thin-film cell in the abdomen for about half an hour of flight.', '#ffe14d', [I(ellipsoid(0.62, 0.26, 0.26, 900).move(-1.15, -0.2, 0), [-0.4, -2.2, 0])]));

  // Stinger
  parts.push(P('Stinger', 'Hollow tip that doubles as a pollen sampler.', '#ff5a52', [I(tube([[-2.3, -0.4, 0], [-2.6, -0.48, 0], [-2.85, -0.62, 0]], 0.05, 240, { taper: (t) => 1 - 0.9 * t }), [-3.3, -0.3, 0])]));

  // Legs
  const legs = [];
  const baskets = [];
  const legX = [0.75, 0.32, -0.1];
  for (const s of SIDES) {
    legX.forEach((x, k) => {
      const sp = (x - 0.32) * 0.9;
      const root = [x, -0.32, s * 0.38];
      const knee = [x + sp * 0.5, -0.28, s * 1.05];
      const ankle = [x + sp, -0.95, s * 1.3];
      const foot = [x + sp * 1.3, -1.32, s * 1.45];
      legs.push(I(merge(rod(root, knee, 0.038, 210), rod(knee, ankle, 0.03, 200), rod(ankle, foot, 0.018, 110), disc(0, 0.05, 30).move(...foot)), [sp * 0.6, -1.0, s * 1.2]));
      if (k === 2) {
        const b = ellipsoid(0.09, 0.17, 0.05, 240).move(ankle[0] - 0.02, ankle[1] + 0.2, ankle[2] - s * 0.05);
        baskets.push(I(merge(b, torus(0.09, 0.012, 50).move(ankle[0] - 0.02, ankle[1] + 0.2, ankle[2] - s * 0.05)), [-0.5, -1.2, s * 2.0]));
      }
    });
  }
  parts.push(P('Legs (6)', 'Grip petals and bring the bee down softly on a landing.', '#d4c9ff', legs));
  parts.push(P('Pollen baskets', 'Pockets on the hind legs that carry pollen back to the hive.', '#ffa53a', baskets));

  return parts;
}
