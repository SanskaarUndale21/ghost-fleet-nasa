import { MISSIONS, type Beat, type Mission } from './missions'
export type { Beat } from './missions'

export type World = 'moon' | 'mars' | 'deep'
export type ProcKind = 'lrv' | 'surveyor' | 'alsep' | 'sojourner'
export type ModelSpec =
  | { type: 'glb'; url: string; size?: number; rotY?: number; rotX?: number; split?: 'lm' }
  | { type: 'proc'; kind: ProcKind }
export type Site = { label: string; lat: number; lon: number }
export type Backdrop = 'moon' | 'mars' | 'ceres' | 'eros' | 'void' | 'earthTrail'

export type Artifact = {
  id: string
  world: World
  name: string
  voice: string // who is speaking
  year: number // year it arrived / launched (timeline)
  span: string
  status: string
  where: string
  sites: Site[]
  // deep-space schematic placement
  orbit?: { body: string; r: number; angle: number; escape?: boolean }
  model: ModelSpec
  modelNote?: string
  backdrop: Backdrop
  tagline: string
  chapters: Beat[]
  mission: Mission
  facts: { k: string; v: string }[]
  science: string[]
  source: { label: string; url: string }
  quiz: { q: string; options: string[]; answer: number }
}

const LM = 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C'

const RAW: Omit<Artifact, 'chapters' | 'mission'>[] = [
  // ───────────── MOON ─────────────
  {
    id: 'surveyor',
    world: 'moon',
    name: 'Surveyor Landers',
    voice: 'Surveyor 3',
    year: 1966,
    span: '1966 to 1968',
    status: 'Silent. Five landers still standing.',
    where: 'Scattered across the near side',
    sites: [
      { label: 'Surveyor 1', lat: -2.47, lon: -43.34 },
      { label: 'Surveyor 3', lat: -3.02, lon: -23.42 },
      { label: 'Surveyor 5', lat: 1.46, lon: 23.2 },
      { label: 'Surveyor 6', lat: 0.47, lon: -1.43 },
      { label: 'Surveyor 7', lat: -40.98, lon: -11.51 },
    ],
    model: { type: 'proc', kind: 'surveyor' },
    modelNote: 'Simplified model built for this story',
    backdrop: 'moon',
    tagline: 'Before anyone could walk on the Moon, someone had to prove the ground would hold.',
    facts: [
      { k: 'Successful landings', v: '5 of 7' },
      { k: 'Surveyor 3 landed', v: 'Apr 20, 1967' },
      { k: 'Images (Surveyor 3)', v: '6,000+' },
      { k: 'Mass at landing', v: '~300 kg' },
    ],
    science: [
      'Proved the lunar surface could support a landing spacecraft',
      'First robotic soil digging and bearing-strength tests on the Moon',
      'Surveyor 3 parts returned by Apollo 12 showed how hardware ages in space',
    ],
    source: { label: 'NASA Science: Surveyor 3', url: 'https://science.nasa.gov/mission/surveyor-3/' },
    quiz: {
      q: 'Which crew walked over and took parts of Surveyor 3 home?',
      options: ['Apollo 11', 'Apollo 12', 'Apollo 17'],
      answer: 1,
    },
  },
  {
    id: 'eagle',
    world: 'moon',
    name: 'Apollo 11 Lunar Module "Eagle"',
    voice: "Eagle's descent stage",
    year: 1969,
    span: 'July 20 to 21, 1969',
    status: 'Parked forever at Tranquility Base',
    where: 'Sea of Tranquility',
    sites: [{ label: 'Tranquility Base', lat: 0.674, lon: 23.473 }],
    model: { type: 'glb', url: '/models/apollo-lm.glb', size: 3.2, split: 'lm' },
    modelNote: 'NASA 3D model (full LM shown; only the lower half stayed)',
    backdrop: 'moon',
    tagline: 'I was the launch pad they left behind.',
    facts: [
      { k: 'Landed', v: 'Jul 20, 1969' },
      { k: 'Time on surface', v: '21.5 hours' },
      { k: 'Samples returned', v: '21.5 kg' },
      { k: 'NSSDCA ID', v: '1969-059C' },
    ],
    science: [
      'First rock and soil samples brought back from another world',
      'Laser Ranging Retroreflector still used to measure Earth to Moon distance',
      'Early seismometer recorded the first moonquake data',
    ],
    source: { label: 'NSSDCA: Apollo 11 Lunar Module', url: LM },
    quiz: {
      q: 'Which part of the Lunar Module stayed on the Moon?',
      options: ['The ascent stage', 'The descent stage', 'The command module'],
      answer: 1,
    },
  },
  {
    id: 'alsep',
    world: 'moon',
    name: 'ALSEP Science Stations',
    voice: 'Apollo 12 ALSEP',
    year: 1969,
    span: '1969 to 1977',
    status: 'Switched off Sept 30, 1977. Mirrors still in use.',
    where: 'Apollo 12, 14, 15, 16, 17 sites',
    sites: [
      { label: 'Apollo 12', lat: -3.01, lon: -23.42 },
      { label: 'Apollo 14', lat: -3.65, lon: -17.47 },
      { label: 'Apollo 15', lat: 26.13, lon: 3.63 },
      { label: 'Apollo 16', lat: -8.97, lon: 15.5 },
      { label: 'Apollo 17', lat: 20.19, lon: 30.77 },
    ],
    model: { type: 'proc', kind: 'alsep' },
    modelNote: 'Simplified model built for this story',
    backdrop: 'moon',
    tagline: 'The astronauts went home. We stayed and kept listening.',
    facts: [
      { k: 'Stations deployed', v: '5' },
      { k: 'Power', v: 'Nuclear (RTG)' },
      { k: 'Switched off', v: 'Sep 30, 1977' },
      { k: 'NSSDCA ID', v: '1969-099C' },
    ],
    science: [
      'Discovered deep and shallow moonquakes',
      'Revealed the Moon has a layered inside: crust, mantle, core',
      'Retroreflectors still measure the Moon moving away from Earth',
    ],
    source: {
      label: 'NSSDCA: Apollo 12 ALSEP',
      url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C',
    },
    quiz: {
      q: 'What powered the ALSEP stations?',
      options: ['Solar panels', 'A nuclear generator', 'Batteries charged by astronauts'],
      answer: 1,
    },
  },
  {
    id: 'lrv',
    world: 'moon',
    name: 'Lunar Roving Vehicles',
    voice: 'The Apollo 15 Rover',
    year: 1971,
    span: '1971 to 1972',
    status: 'Parked. Three buggies, keys not required.',
    where: 'Hadley Rille, Descartes, Taurus-Littrow',
    sites: [
      { label: 'Apollo 15 LRV', lat: 26.13, lon: 3.63 },
      { label: 'Apollo 16 LRV', lat: -8.97, lon: 15.5 },
      { label: 'Apollo 17 LRV', lat: 20.19, lon: 30.77 },
    ],
    model: { type: 'proc', kind: 'lrv' },
    modelNote: 'Simplified model built for this story',
    backdrop: 'moon',
    tagline: 'A car that folded up like origami and drove on another world.',
    facts: [
      { k: 'Rovers left', v: '3' },
      { k: 'Top speed', v: '~13 km/h' },
      { k: 'Apollo 17 drive', v: '~36 km' },
      { k: 'NSSDCA ID', v: '1971-063C' },
    ],
    science: [
      'Let astronauts sample geology kilometers from the landing site',
      'Apollo 15 crew reached Hadley Rille and found the Genesis Rock',
      'TV camera on the rover filmed lunar lift-offs for Earth',
    ],
    source: {
      label: 'NSSDCA: Apollo 15 LRV',
      url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
    },
    quiz: {
      q: 'What were the rover wheels made of?',
      options: ['Rubber', 'Woven wire mesh', 'Solid aluminum'],
      answer: 1,
    },
  },

  // ───────────── MARS ─────────────
  {
    id: 'viking',
    world: 'mars',
    name: 'Viking 1 & 2 Landers',
    voice: 'Viking 1 Lander',
    year: 1976,
    span: '1976 to 1982',
    status: 'Silent since Nov 1982',
    where: 'Chryse Planitia and Utopia Planitia',
    sites: [
      { label: 'Viking 1', lat: 22.27, lon: -47.95 },
      { label: 'Viking 2', lat: 47.64, lon: -134.29 },
    ],
    model: { type: 'glb', url: '/models/viking.glb', size: 3 },
    modelNote: 'NASA 3D model',
    backdrop: 'mars',
    tagline: 'The first American eyes on the surface of Mars.',
    facts: [
      { k: 'Viking 1 landed', v: 'Jul 20, 1976' },
      { k: 'Viking 2 landed', v: 'Sep 3, 1976' },
      { k: 'Viking 1 worked', v: '6+ years' },
      { k: 'Planned mission', v: '90 days' },
    ],
    science: [
      'First successful long-term operations on the Martian surface',
      'First search for life in Martian soil',
      'Years of daily Mars weather and seasonal data',
    ],
    source: { label: 'NASA Science: Viking 1', url: 'https://science.nasa.gov/mission/viking-1/' },
    quiz: {
      q: 'What did Viking 1 photograph first on Mars?',
      options: ['A sunset', 'Its own footpad', 'A dust devil'],
      answer: 1,
    },
  },
  {
    id: 'sojourner',
    world: 'mars',
    name: 'Sojourner Rover',
    voice: 'Sojourner',
    year: 1997,
    span: 'July to Sept 1997',
    status: 'Parked near the Pathfinder lander',
    where: 'Ares Vallis',
    sites: [{ label: 'Pathfinder / Sojourner', lat: 19.13, lon: -33.22 }],
    model: { type: 'proc', kind: 'sojourner' },
    modelNote: 'Simplified model built for this story',
    backdrop: 'mars',
    tagline: 'Small as a microwave oven. First wheels on Mars.',
    facts: [
      { k: 'Landed', v: 'Jul 4, 1997' },
      { k: 'Mass', v: '10.6 kg' },
      { k: 'Planned life', v: '7 sols' },
      { k: 'Actual life', v: '83 sols' },
    ],
    science: [
      'First rover on another planet',
      'Proved rocker-bogie wheels and airbag landings work',
      'Rock chemistry and shapes hinted at past floods',
    ],
    source: { label: 'NASA Science: Mars Pathfinder', url: 'https://science.nasa.gov/mission/mars-pathfinder/' },
    quiz: {
      q: 'How did the Pathfinder lander arrive on Mars?',
      options: ['With a sky crane', 'Bouncing on airbags', 'Gliding on wings'],
      answer: 1,
    },
  },
  {
    id: 'spirit',
    world: 'mars',
    name: 'Spirit Rover',
    voice: 'Spirit',
    year: 2004,
    span: '2004 to 2010',
    status: 'Stuck in sand at "Troy"',
    where: 'Gusev Crater',
    sites: [{ label: 'Spirit', lat: -14.57, lon: 175.47 }],
    model: { type: 'glb', url: '/models/mer.glb', size: 2.2 },
    modelNote: 'NASA 3D model (Mars Exploration Rover, twin of Opportunity)',
    backdrop: 'mars',
    tagline: 'Planned for 90 days. Kept going for six years.',
    facts: [
      { k: 'Landed', v: 'Jan 4, 2004' },
      { k: 'Last contact', v: 'Mar 22, 2010' },
      { k: 'Distance', v: '7.73 km' },
      { k: 'Planned life', v: '90 sols' },
    ],
    science: [
      'Found silica deposits from ancient hot springs',
      'Showed Gusev once had water-rich, possibly habitable spots',
      'Watched dust devils roll across Mars',
    ],
    source: {
      label: 'NASA Science: Spirit & Opportunity',
      url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    },
    quiz: {
      q: 'Why did Spirit drive backward?',
      options: ['To see better', 'A wheel stopped working', 'To save fuel'],
      answer: 1,
    },
  },
  {
    id: 'opportunity',
    world: 'mars',
    name: 'Opportunity Rover',
    voice: 'Opportunity',
    year: 2004,
    span: '2004 to 2018',
    status: 'Silent since the 2018 dust storm',
    where: 'Perseverance Valley, Endeavour Crater',
    sites: [{ label: 'Opportunity', lat: -2.2, lon: -5.4 }],
    model: { type: 'glb', url: '/models/mer.glb', size: 2.2 },
    modelNote: 'NASA 3D model (Mars Exploration Rover)',
    backdrop: 'mars',
    tagline: 'A marathon runner on Mars.',
    facts: [
      { k: 'Landed', v: 'Jan 25, 2004' },
      { k: 'Last contact', v: 'Jun 10, 2018' },
      { k: 'Distance', v: '45.16 km' },
      { k: 'Planned life', v: '90 sols' },
    ],
    science: [
      'Hematite "blueberries" proved liquid water once existed',
      'First off-world marathon (42.2 km) in 2015',
      'Found clay minerals at Endeavour crater, signs of milder water',
    ],
    source: {
      label: 'NASA Science: Spirit & Opportunity',
      url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    },
    quiz: {
      q: 'What ended Opportunity’s mission?',
      options: ['A crash', 'A planet-wide dust storm', 'Running out of fuel'],
      answer: 1,
    },
  },
  {
    id: 'phoenix',
    world: 'mars',
    name: 'Phoenix Lander',
    voice: 'Phoenix',
    year: 2008,
    span: 'May to Nov 2008',
    status: 'Buried in winter ice. Panels broken.',
    where: 'Vastitas Borealis, near the north pole',
    sites: [{ label: 'Phoenix', lat: 68.22, lon: -125.75 }],
    model: { type: 'glb', url: '/models/insight.glb', size: 3 },
    modelNote: 'NASA InSight model shown. InSight was built from the Phoenix design.',
    backdrop: 'mars',
    tagline: 'I dug, and I touched water.',
    facts: [
      { k: 'Landed', v: 'May 25, 2008' },
      { k: 'Last contact', v: 'Nov 2, 2008' },
      { k: 'Latitude', v: '68° N' },
      { k: 'Planned life', v: '90 sols' },
    ],
    science: [
      'First direct touch and confirmation of Martian water ice',
      'Detected snow falling from Martian clouds',
      'Discovered perchlorate salts in the soil',
    ],
    source: { label: 'NASA Science: InSight (Phoenix & InSight resource)', url: 'https://science.nasa.gov/mission/insight/' },
    quiz: {
      q: 'How did Phoenix prove the white chunks were ice?',
      options: ['They melted into puddles', 'They slowly vanished into vapor', 'They glowed in the dark'],
      answer: 1,
    },
  },
  {
    id: 'insight',
    world: 'mars',
    name: 'InSight Lander',
    voice: 'InSight',
    year: 2018,
    span: '2018 to 2022',
    status: 'Dusty and silent since Dec 2022',
    where: 'Elysium Planitia',
    sites: [{ label: 'InSight', lat: 4.5, lon: 135.62 }],
    model: { type: 'glb', url: '/models/insight.glb', size: 3 },
    modelNote: 'NASA 3D model',
    backdrop: 'mars',
    tagline: 'I put my ear to the ground and listened to Mars.',
    facts: [
      { k: 'Landed', v: 'Nov 26, 2018' },
      { k: 'Marsquakes', v: '1,319' },
      { k: 'Last contact', v: 'Dec 15, 2022' },
      { k: 'Panels', v: '2 × 2.2 m wide' },
    ],
    science: [
      'First seismometer to work on the surface of Mars',
      'Measured the size of Mars’ liquid core',
      'Mapped the layers of the Martian crust',
    ],
    source: { label: 'NASA Science: InSight', url: 'https://science.nasa.gov/mission/insight/' },
    quiz: {
      q: 'What did InSight mainly listen for?',
      options: ['Radio signals', 'Marsquakes', 'Wind music'],
      answer: 1,
    },
  },
  {
    id: 'ingenuity',
    world: 'mars',
    name: 'Ingenuity Helicopter',
    voice: 'Ingenuity',
    year: 2021,
    span: '2021 to 2024',
    status: 'Grounded. Rotor blades damaged.',
    where: 'Jezero Crater',
    sites: [{ label: 'Ingenuity (Valinor Hills)', lat: 18.44, lon: 77.45 }],
    model: { type: 'glb', url: '/models/ingenuity.glb', size: 1.4 },
    modelNote: 'NASA 3D model',
    backdrop: 'mars',
    tagline: 'Air on Mars is thinner than at the top of Everest. I flew anyway.',
    facts: [
      { k: 'First flight', v: 'Apr 19, 2021' },
      { k: 'Flights', v: '72 (planned 5)' },
      { k: 'Mass', v: '1.8 kg' },
      { k: 'Mission ended', v: 'Jan 25, 2024' },
    ],
    science: [
      'First powered, controlled flight on another planet',
      'Proved aerial scouting works for Mars rovers',
      'Mapped terrain ahead of Perseverance',
    ],
    source: {
      label: 'NASA Science: Ingenuity',
      url: 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/',
    },
    quiz: {
      q: 'How many flights did Ingenuity make?',
      options: ['5', '72', '300'],
      answer: 1,
    },
  },

  // ───────────── DEEP SPACE ─────────────
  {
    id: 'pioneer',
    world: 'deep',
    name: 'Pioneer 10 & 11',
    voice: 'Pioneer 10',
    year: 1972,
    span: '1972 to 2003',
    status: 'Drifting out of the solar system',
    where: 'Beyond the planets',
    sites: [],
    orbit: { body: 'Interstellar', r: 15, angle: 40, escape: true },
    model: { type: 'glb', url: '/models/pioneer.glb', size: 3 },
    modelNote: 'NASA 3D model',
    backdrop: 'void',
    tagline: 'I carry a message for whoever finds me.',
    facts: [
      { k: 'Pioneer 10 launch', v: 'Mar 2, 1972' },
      { k: 'Jupiter flyby', v: 'Dec 3, 1973' },
      { k: 'Last signal', v: 'Jan 23, 2003' },
      { k: 'Pioneer 11 at Saturn', v: 'Sep 1, 1979' },
    ],
    science: [
      'First crossing of the asteroid belt',
      'First close-up study of Jupiter and its radiation',
      'Pioneer 11: first flyby of Saturn',
    ],
    source: { label: 'NASA Science: Pioneer 10', url: 'https://science.nasa.gov/mission/pioneer-10/' },
    quiz: {
      q: 'What is attached to Pioneer 10 as a greeting?',
      options: ['A golden plaque', 'A flag', 'A music CD'],
      answer: 0,
    },
  },
  {
    id: 'near',
    world: 'deep',
    name: 'NEAR Shoemaker',
    voice: 'NEAR Shoemaker',
    year: 1996,
    span: '1996 to 2001',
    status: 'Resting on asteroid 433 Eros',
    where: 'Surface of 433 Eros',
    sites: [],
    orbit: { body: 'Eros', r: 5.4, angle: 210 },
    model: { type: 'glb', url: '/models/near.glb', size: 2.6 },
    modelNote: 'NASA 3D model',
    backdrop: 'eros',
    tagline: 'I was never built to land. I landed anyway.',
    facts: [
      { k: 'Launched', v: 'Feb 17, 1996' },
      { k: 'Orbit of Eros', v: 'Feb 14, 2000' },
      { k: 'Landed', v: 'Feb 12, 2001' },
      { k: 'Eros length', v: '~34 km' },
    ],
    science: [
      'First spacecraft to orbit an asteroid',
      'First to land on an asteroid',
      'Showed Eros is a solid, ancient body',
    ],
    source: { label: 'NASA Science: NEAR Shoemaker', url: 'https://science.nasa.gov/mission/near-shoemaker/' },
    quiz: {
      q: 'What was special about NEAR’s landing?',
      options: ['It was never designed to land', 'It used parachutes', 'Astronauts helped'],
      answer: 0,
    },
  },
  {
    id: 'dawn',
    world: 'deep',
    name: 'Dawn Spacecraft',
    voice: 'Dawn',
    year: 2007,
    span: '2007 to 2018',
    status: 'Silent orbit around Ceres',
    where: 'Orbiting dwarf planet Ceres',
    sites: [],
    orbit: { body: 'Ceres', r: 7.2, angle: 120 },
    model: { type: 'glb', url: '/models/dawn.glb', size: 3.4 },
    modelNote: 'NASA 3D model',
    backdrop: 'ceres',
    tagline: 'Two worlds, one spacecraft, a gentle blue engine.',
    facts: [
      { k: 'Launched', v: 'Sep 27, 2007' },
      { k: 'At Vesta', v: '2011 to 2012' },
      { k: 'At Ceres', v: '2015 to 2018' },
      { k: 'Propulsion', v: 'Ion engines' },
    ],
    science: [
      'First spacecraft to orbit two different worlds beyond Earth',
      'Found salt deposits from brine on Ceres',
      'Linked many Earth meteorites to Vesta',
    ],
    source: { label: 'NASA Science: Dawn', url: 'https://science.nasa.gov/mission/dawn/' },
    quiz: {
      q: 'What kind of engine did Dawn use?',
      options: ['Ion engine', 'Jet engine', 'Steam engine'],
      answer: 0,
    },
  },
  {
    id: 'kepler',
    world: 'deep',
    name: 'Kepler Space Telescope',
    voice: 'Kepler',
    year: 2009,
    span: '2009 to 2018',
    status: 'Drifting behind Earth around the Sun',
    where: 'Earth-trailing orbit',
    sites: [],
    orbit: { body: 'Earth trail', r: 3.4, angle: 300 },
    model: { type: 'glb', url: '/models/kepler.glb', size: 3.4 },
    modelNote: 'NASA 3D model',
    backdrop: 'earthTrail',
    tagline: 'I stared at one patch of sky and found thousands of worlds.',
    facts: [
      { k: 'Launched', v: 'Mar 6, 2009' },
      { k: 'Confirmed planets', v: '2,600+' },
      { k: 'Stars watched', v: '~150,000' },
      { k: 'Retired', v: 'Oct 30, 2018' },
    ],
    science: [
      'Discovered over 2,600 confirmed exoplanets',
      'Showed planets are common around stars',
      'K2 mission pioneered using sunlight to steady a spacecraft',
    ],
    source: { label: 'NASA Science: Kepler', url: 'https://science.nasa.gov/mission/kepler/' },
    quiz: {
      q: 'How did Kepler find planets?',
      options: ['Taking close-up photos', 'Watching stars dim', 'Listening for radio'],
      answer: 1,
    },
  },
]

export const ARTIFACTS: Artifact[] = RAW.map((a) => ({ ...a, mission: MISSIONS[a.id], chapters: MISSIONS[a.id].beats }))

export const WORLD_META: Record<World, { label: string; blurb: string }> = {
  moon: { label: 'The Moon', blurb: 'Landers, rovers and science stations from 1966 to 1972' },
  mars: { label: 'Mars', blurb: 'Fifty years of landers, rovers and one helicopter' },
  deep: { label: 'Deep Space', blurb: 'Probes still orbiting, resting on asteroids, or leaving the Sun behind' },
}

export const byId = (id: string) => ARTIFACTS.find((a) => a.id === id)!
