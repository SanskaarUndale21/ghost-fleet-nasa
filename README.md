# Ghost Fleet: Abandoned but not Forgotten

**Live demo:** https://ghost-fleet-omega.vercel.app

An interactive 3D documentary built for the NASA Space Apps Challenge 2026 challenge
[Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/).

Since 1966, NASA has left landers, rovers and probes on the Moon, on Mars and across deep space.
Ghost Fleet lets school-age and casual space fans meet 15 of these machines. Each one tells its own story in
first person, from launch on Earth to where it rests today.

## The 15 machines

| The Moon | Mars | Deep space |
|---|---|---|
| Surveyor landers | Viking 1 & 2 | Pioneer 10 & 11 |
| Apollo 11 Lunar Module "Eagle" | Sojourner | NEAR Shoemaker |
| ALSEP science stations | Spirit | Dawn |
| Lunar Roving Vehicles | Opportunity | Kepler |
| | Phoenix | |
| | InSight | |
| | Ingenuity | |

## What you can do

- **Explore** a 3D home scene you can orbit, pan and zoom: Earth with city lights and clouds, the Moon and Mars,
  with the ISS, Hubble, LRO, MRO and Voyager. Open Moon and Mars globes with markers at the real landing
  coordinates, or a map of deep space.
- **Watch** each machine's mission as a 3D film in seven phases:
  **Launch** (countdown, liftoff, staging) → **Cruise** (Earth to destination, day counter) →
  **Arrival** (Mars entry with heat shield and parachute, airbags, sky crane, lunar descent, orbit) →
  **Mission** (rovers driving with tracks, digging, Ingenuity flying, Eagle lifting off) →
  **Discovery** (marsquake seismograph, a cutaway of the inside of Mars and the Moon, an exoplanet light curve, a Jupiter flyby) →
  **Legacy** (the missions that followed) → **Today** (dust storms, frost, signal lost).
- **Listen** to about 24 minutes of narration, with a different natural-sounding voice for each machine,
  and optional subtitles (CC) that highlight word by word.
- **Pause** at any moment: the whole 3D scene freezes and you can look around it freely.
- **Learn more** in each machine's Mission File: facts, launch rocket, how its engineering led to science, and NASA source links.
- **Test yourself** with 45 multiple-choice questions (3 per machine) with explanations. Scores and
  "ghosts found" are saved in the browser.
- Works on **desktop and phones** (portrait and landscape).

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev        # development server
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Project structure

```
src/
  App.tsx              views (home, Moon/Mars/deep space maps, mission player), top bar, sources
  StoryPlayer.tsx      mission film player: narration, subtitles, timeline, mission file, quiz
  Hud.tsx              on-screen status, telemetry, seismograph, light curve
  data/
    artifacts.ts       the 15 machines: facts, landing sites, models, first quiz question
    missions.ts        mission timelines (113 story scenes), rockets, dates
    quizzes.ts         additional quiz questions
    resources.ts       NASA resource links from the challenge page, credits
  scene/
    Worlds.tsx         home scene, globes, deep space map, surface stage
    Cinematic.tsx      launch, cruise, Mars entry, orbit, flyby, interior, transit, legacy, Deep Space Network scenes
    Actor.tsx          surface animations (landing, driving, flying, quakes, dust storms...)
    Rockets.tsx        Atlas-Centaur, Titan IIIE, Delta II, Atlas V and the launch tower
    Planets.tsx        Earth (day/night, clouds, atmosphere), planets, animated Sun
    Effects.tsx        particles, engine flames, wheel tracks, weather, laser
    Models.tsx         NASA model loading and simplified models
public/
  models/              NASA 3D models (glTF)
  textures/            planet and terrain textures
  audio/               narration clips and word timings (captions.json)
scripts/
  dump-beats.ts        exports story text for narration
  narrate.py           generates narration audio and word timings
```

## Regenerating narration

After editing any story text in `src/data/missions.ts`:

```bash
pip install edge-tts
node scripts/dump-beats.ts > beats.json
python scripts/narrate.py beats.json public/audio
```

Only the changed lines are re-recorded.

## Built with

TypeScript, React, three.js, React Three Fiber, Drei, Vite. Deployed on Vercel.

## Data and asset credits

- **Facts:** the NASA resources listed on the challenge page: the NASA Space Science Data Coordinated Archive (NSSDCA)
  and NASA Science mission pages. The full list is in `src/data/resources.ts` and in the app's Sources panel.
- **3D models:** [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources): Saturn V, Apollo Lunar Module,
  Viking Lander, Mars Exploration Rover, Perseverance, Ingenuity, InSight, Pioneer 10, NEAR Shoemaker, Dawn, Kepler,
  LRO, MRO, Voyager, OSIRIS-REx, asteroid Bennu, TESS, James Webb Space Telescope, ISS, Hubble,
  Deep Space Network antenna and Vehicle Assembly Building.
- **Simplified models built for this project:** Lunar Roving Vehicle, Surveyor, ALSEP, Sojourner, Pathfinder lander,
  Atlas-Centaur, Titan IIIE, Delta II and Atlas V rockets, launch tower, aeroshells, parachutes and sky crane.
- **Moon map:** NASA SVS CGI Moon Kit (LRO LROC color).
- **Earth, Mars, Jupiter and Milky Way textures:** [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0).
- **Narration:** pre-generated neural text-to-speech, one voice per machine.
