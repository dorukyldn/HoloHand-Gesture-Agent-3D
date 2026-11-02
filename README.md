# HoloHand (gesture-agent-3d)
## Dev / Creator = tubakhxn

Control exploded 3D models with your bare hands. Your webcam is the background, a hand skeleton and a gold ring follow your hand,
and each model is a glowing point cloud that pulls apart into labelled parts so you can see what is inside.

Everything runs in the browser: MediaPipe Hand Landmarker + Three.js. No backend, no API keys, nothing is uploaded.

## Run

Needs Node.js 18+ and Chrome or Edge.

```bash
cd gesture-agent-3d
npm install
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173) and click **Start camera**. Camera only works on `http://localhost` or `https`.
`npm install` copies the MediaPipe WASM and downloads the hand model into `public/`. If that download is blocked, the app fetches both from a CDN at runtime.

## Models

Turbofan Jet Engine (fan, guide vanes, compressors, combustor, turbines, shaft, nozzle) ·
Radial Aircraft Engine (crankcase, 9 cylinders, pistons, rods, crankshaft, exhaust ring, supercharger) ·
Sports Car (body panels, chassis, engine, drivetrain, seats, wheels, brakes) ·
V8 Engine (block, heads, pistons, rods, valves, crankshaft, camshaft, intake, exhaust) ·
Cessna 172 (fuselage, wings, flaps, ailerons, tail surfaces, engine, propeller, gear) ·
Hydraulic Excavator (tracks, slew ring, cab, engine, boom, stick, rams, bucket) ·
Mechanical Watch (mainspring, going train, pallet fork, balance wheel, hairspring, dial) ·
Strandbeest (Jansen linkage legs, crankshaft, frame, sails) ·
Robotic Scorpion (chassis, 8 legs, servos, claws, tail, stinger) ·
Robotic Octopus (mantle, pressure hull, 8 arms, tendons, suckers, siphon) ·
Robotic Bee (wings, flapping drive, compound eyes, abdomen, legs, pollen baskets) ·
Human Brain (4 lobes, cerebellum, brainstem, corpus callosum, thalamus, hippocampus, amygdala, hypothalamus)

## Gestures

| Gesture | Effect |
|---|---|
| Open hand slowly | Explode the model. The white arc on the gold ring shows how far. |
| Close your hand / fist | Pull it back together |
| Move or twist your hand | Rotate and tilt the model |
| Point (index finger) | Highlight the part under your fingertip. Hold still to lock it. |
| Pinch while over a part | Grab it, drag it out, release to snap it back |
| Two hands | Move them apart or together to zoom |
| Peace sign (hold ~0.3 s) | Jump to the next model |

## Mouse and keyboard

Drag = rotate · scroll = zoom · click a part = inspect it · `Space` = explode / assemble · `←` `→` or `1`–`4` = switch model · `R` = reset view.
Sliders in the left panel control the explosion and its intensity. The top-right buttons toggle camera background, hand skeleton, labels and fullscreen.

## Tips

- Even light and a plain background help. Keep your hand 40–80 cm from the camera, palm facing it.
- Open and close your hand slowly. The peace sign needs a short hold so it does not trigger by accident.

## Files

```
src/main.js          app loop, hand overlay, gesture -> action, labels, UI
src/handTracking.js  MediaPipe wrapper (2 hands, local files then CDN, GPU then CPU)
src/gestureEngine.js landmarks -> gesture, openness, smoothed palm / fingertip / pinch, wrist roll
src/scene.js         Three.js point-cloud renderer: explode, scatter transition, picking, part dragging
src/models/          shapes.js (point sampling) + one file per model
```

To add a model: write a `build()` returning parts (`P(name, description, color, [I(cloud, explodeDirection)])`) and register it in `src/models/index.js`.
