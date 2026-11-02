import { buildJet } from './jet.js';
import { buildRadial } from './radial.js';
import { buildCar } from './car.js';
import { buildBrain } from './brain.js';
import { buildV8 } from './v8.js';
import { buildCessna } from './cessna.js';
import { buildExcavator } from './excavator.js';
import { buildWatch } from './watch.js';
import { buildStrandbeest } from './strandbeest.js';
import { buildScorpion } from './scorpion.js';
import { buildOctopus } from './octopus.js';
import { buildBee } from './bee.js';
import { buildPhased } from './phased.js';

// view = starting rotation (radians). parts are built lazily the first time a model is shown.
export const MODELS = [
  {
    id: 'jet',
    name: 'Turbofan Jet Engine',
    category: 'Machines',
    subtitle: 'Fan, compressors, combustor, turbines, nozzle',
    view: { x: 0.28, y: -0.55, z: 0 },
    build: buildJet,
  },
  {
    id: 'radial',
    name: 'Radial Aircraft Engine',
    category: 'Machines',
    subtitle: 'Nine cylinders around one crankshaft',
    view: { x: 0.35, y: 0.55, z: 0 },
    build: buildRadial,
  },
  {
    id: 'car',
    name: 'Sports Car',
    category: 'Machines',
    subtitle: 'Body, chassis, drivetrain and interior',
    view: { x: 0.3, y: -0.7, z: 0 },
    build: buildCar,
  },
  {
    id: 'v8',
    name: 'V8 Engine',
    category: 'Machines',
    subtitle: 'Two banks of four around one crankshaft',
    view: { x: 0.3, y: -0.6, z: 0 },
    build: buildV8,
  },
  {
    id: 'cessna',
    name: 'Cessna 172',
    category: 'Machines',
    subtitle: 'Airframe, flight controls, engine and gear',
    view: { x: 0.35, y: -0.6, z: 0 },
    build: buildCessna,
  },
  {
    id: 'excavator',
    name: 'Hydraulic Excavator',
    category: 'Machines',
    subtitle: 'Tracks, boom, stick, rams and bucket',
    view: { x: 0.2, y: -0.45, z: 0 },
    build: buildExcavator,
  },
  {
    id: 'watch',
    name: 'Mechanical Watch',
    category: 'Machines',
    subtitle: 'Mainspring, going train, escapement, balance',
    view: { x: 0.85, y: 0.3, z: 0 },
    build: buildWatch,
  },
  {
    id: 'strandbeest',
    name: 'Strandbeest',
    category: 'Machines',
    subtitle: "Theo Jansen's wind-walking linkage",
    view: { x: 0.2, y: -0.75, z: 0 },
    build: buildStrandbeest,
  },
  {
    id: 'phased',
    name: 'Phased Array',
    category: 'Machines',
    subtitle: '16 x 16 satellite antenna, steered with no moving parts',
    view: { x: 0.5, y: -0.45, z: 0 },
    build: buildPhased,
  },
  {
    id: 'scorpion',
    name: 'Robotic Scorpion',
    category: 'Robots',
    subtitle: 'Eight legs, two claws, an aiming tail',
    view: { x: 0.45, y: -0.6, z: 0 },
    build: buildScorpion,
  },
  {
    id: 'octopus',
    name: 'Robotic Octopus',
    category: 'Robots',
    subtitle: 'Soft arms, tendons, suckers, siphon jet',
    view: { x: 0.3, y: 0.4, z: 0 },
    build: buildOctopus,
  },
  {
    id: 'bee',
    name: 'Robotic Bee',
    category: 'Robots',
    subtitle: 'Flapping wings, sensors and pollen baskets',
    view: { x: 0.3, y: -0.5, z: 0 },
    build: buildBee,
  },
  {
    id: 'brain',
    name: 'Human Brain',
    category: 'Biology',
    subtitle: 'Lobes, cerebellum and the structures inside',
    view: { x: 0.18, y: 0.7, z: 0 },
    build: buildBrain,
  },
];
