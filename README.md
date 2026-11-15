# Ghost Fleet: Abandoned but not Forgotten

Interactive 3D storytelling app for the NASA Space Apps Challenge 2026 challenge
[Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/).

Fly to the Moon, Mars or deep space, find the glowing "ghost" signals at real landing coordinates,
and hear 15 retired machines tell their own story in first person, chapter by chapter, with the
camera moving around a 3D model of each one.

## Mission movies
Every artifact plays as a short 3D film, told in first person, in seven phases:
**Launch** (rocket on the pad, liftoff, staging) → **Cruise** (Earth to destination, day counter) →
**Arrival** (Mars entry with heat shield and parachute, airbags, sky crane, lunar descent, orbit insertion) →
**Mission** (driving with wheel tracks, digging, flying, lift-off) → **Discovery** (seismic cutaway of Mars/Moon,
exoplanet transit light curve, Jupiter flyby) → **Legacy** → **Today** (dust storms, frost, signal lost).
Pause any time to orbit the scene.

## Features
- 3D hub, rotating Moon and Mars globes with pins at real lat/lon, schematic deep space map
- 15 artifacts: Surveyor, Apollo 11 LM Eagle, ALSEP, LRV, Viking 1 & 2, Sojourner, Spirit, Opportunity,
  Phoenix, InSight, Ingenuity, Pioneer 10 & 11, NEAR Shoemaker, Dawn, Kepler
- Official NASA 3D models (GLB), and simplified models built for LRV, Surveyor, ALSEP, Sojourner
- 4-chapter first-person stories, camera choreography per chapter, mission data, engineering to science notes
- Read-aloud narration (Web Speech API), keyboard navigation, mission check quiz, progress tracking
- Timeline 1966 to 2024, sources panel linking every NASA resource from the challenge page
- Responsive layout for phones

## Run
```bash
npm install
npm run dev
```

## Stack
Vite, React, TypeScript, three.js, @react-three/fiber, @react-three/drei

## Data and asset sources
- Challenge resources: NSSDCA, NASA Science mission pages (full list in `src/data/resources.ts` and the in-app Sources panel)
- 3D models (incl. Saturn V, Perseverance) and planet textures: [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources)
- Atlas-Centaur, Titan IIIE, Delta II, Atlas V rockets, aeroshells, parachutes and sky crane are simplified models built for this project
- Moon map: NASA SVS CGI Moon Kit (LRO LROC color)
