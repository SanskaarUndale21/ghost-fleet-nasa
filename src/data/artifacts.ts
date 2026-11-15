export type World = 'moon' | 'mars' | 'deep'
export type ProcKind = 'lrv' | 'surveyor' | 'alsep' | 'sojourner'
export type ModelSpec =
  | { type: 'glb'; url: string; size?: number; rotY?: number; rotX?: number }
  | { type: 'proc'; kind: ProcKind }
export type Site = { label: string; lat: number; lon: number }
export type Chapter = { title: string; text: string; cam: [number, number, number] } // azimuth deg, polar deg, distance x
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
  chapters: Chapter[]
  facts: { k: string; v: string }[]
  science: string[]
  source: { label: string; url: string }
  quiz: { q: string; options: string[]; answer: number }
}

const LM = 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C'

export const ARTIFACTS: Artifact[] = [
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
    chapters: [
      {
        title: 'The big question',
        text: "In the 1960s, some scientists worried the Moon was covered in deep, fluffy dust that would swallow a spacecraft whole. Nobody knew for sure. My job was simple and scary: land softly, using rocket engines and radar, and find out what the surface was really like.",
        cam: [30, 70, 1],
      },
      {
        title: 'Touchdown, and a bounce',
        text: "I landed on April 20, 1967. My engines did not shut off in time, so I actually bounced twice before settling down in a small crater. Then I got to work: my scoop dug trenches and my TV camera sent back more than 6,000 pictures. The ground was firm. Astronauts could land here.",
        cam: [120, 60, 0.8],
      },
      {
        title: 'Visitors!',
        text: "Two and a half years later, Apollo 12 landed about 180 meters from me. Astronauts Pete Conrad and Alan Bean walked over, took photos, and cut off my camera to carry home. Scientists wanted to see what two years on the Moon does to metal, glass and wires.",
        cam: [220, 75, 1.1],
      },
      {
        title: 'Where I am now',
        text: "I am still standing in my crater in the Ocean of Storms, missing a few pieces. My brothers Surveyor 1, 5, 6 and 7 are out there too. Surveyor 6 even did the first lift-off from the Moon, a tiny 3 meter hop. We were the scouts. Apollo followed.",
        cam: [300, 55, 1.4],
      },
    ],
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
    model: { type: 'glb', url: '/models/apollo-lm.glb', size: 3.2 },
    modelNote: 'NASA 3D model (full LM shown; only the lower half stayed)',
    backdrop: 'moon',
    tagline: 'I was the launch pad they left behind.',
    chapters: [
      {
        title: 'Two halves, one job',
        text: "A Lunar Module is really two spacecraft stacked together. The top part, the ascent stage, carries astronauts. I am the bottom part, the descent stage: a gold-wrapped frame with four legs, a big rocket engine and fuel tanks. My job was to lower Neil Armstrong and Buzz Aldrin gently onto the Moon.",
        cam: [40, 70, 1],
      },
      {
        title: '"The Eagle has landed"',
        text: "On July 20, 1969 the computer was flashing alarms and the planned landing spot was full of boulders. Armstrong took manual control and flew me over the rocks, touching down with only about 25 seconds of fuel left before an abort call. Then came the words: Houston, Tranquility Base here. The Eagle has landed.",
        cam: [140, 80, 0.9],
      },
      {
        title: 'Launch pad',
        text: "After 21 and a half hours on the surface, the astronauts climbed back into the top half. It fired its own engine and lifted off, using me as its launch pad. Bolted to my leg is a plaque: Here men from the planet Earth first set foot upon the Moon, July 1969 A.D. We came in peace for all mankind.",
        cam: [250, 60, 1.2],
      },
      {
        title: 'Where I am now',
        text: "I still stand in the Sea of Tranquility. Near me is a laser retroreflector the crew set up. Scientists on Earth still bounce lasers off it today to measure that the Moon is slowly drifting away from us, about 3.8 centimeters every year.",
        cam: [320, 65, 1.5],
      },
    ],
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
    chapters: [
      {
        title: 'A lab you leave behind',
        text: "Astronauts could only stay on the Moon for a few days. So each Apollo crew from Apollo 12 onward set up an ALSEP: a set of instruments wired to a central station with a radio, powered by a small nuclear generator that made electricity from heat.",
        cam: [30, 65, 1],
      },
      {
        title: 'Listening to moonquakes',
        text: "My seismometer was so sensitive it could feel an astronaut's footsteps. When the crews crashed their used rocket stages into the Moon on purpose, I recorded the Moon ringing like a bell for over an hour. Over 8 years our network logged thousands of moonquakes.",
        cam: [120, 55, 0.8],
      },
      {
        title: 'What we learned',
        text: "Our data showed the Moon has a crust, a mantle and a small core, like Earth, but it is cold and quiet inside. We measured heat leaking from the Moon, the solar wind hitting the surface, and the thin wisps of gas around it.",
        cam: [210, 70, 1.1],
      },
      {
        title: 'Where I am now',
        text: "On September 30, 1977, NASA switched all five stations off to save money. We are silent now. But the laser mirrors left at Apollo 11, 14 and 15 need no power, and observatories still aim lasers at them more than 50 years later.",
        cam: [300, 60, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'Packed like origami',
        text: "I had to fit in a tiny wedge-shaped bay on the side of the Lunar Module. So engineers designed me to fold in half with my wheels tucked in. Astronauts pulled on straps and I unfolded and dropped to the ground, ready to roll.",
        cam: [40, 65, 1],
      },
      {
        title: 'Wheels made of wire',
        text: "Rubber tires would fail in the Moon's extreme heat and cold, so my wheels were woven from zinc-coated piano wire with titanium treads. Each wheel had its own electric motor, powered by two batteries. I weighed only about 210 kg on Earth but could carry twice my own weight.",
        cam: [110, 80, 0.7],
      },
      {
        title: 'Going farther',
        text: "Walking in bulky spacesuits is tiring. With me, crews could drive kilometers away, reaching mountains and canyon edges. The three rovers drove about 90 km in total. Apollo 15 astronauts used me to reach Hadley Rille and find the famous Genesis Rock, a piece of the Moon's early crust.",
        cam: [200, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "At the end of each mission, the crew parked the rover a short distance away and pointed its TV camera back at the lander, so people on Earth could watch the lift-off live. Then we were left behind. Three of us are still parked on the Moon.",
        cam: [300, 70, 1.4],
      },
    ],
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
      { label: 'Viking 2', lat: 47.64, lon: 134.29 },
    ],
    model: { type: 'glb', url: '/models/viking.glb', size: 3 },
    modelNote: 'NASA 3D model',
    backdrop: 'mars',
    tagline: 'The first American eyes on the surface of Mars.',
    chapters: [
      {
        title: 'Searching for life',
        text: "In 1976 nobody had ever successfully worked on the surface of Mars for long. I carried a tiny automated biology lab. My robotic arm scooped soil, and my instruments fed it nutrients to see if anything living would breathe out gas.",
        cam: [30, 70, 1],
      },
      {
        title: 'First picture',
        text: "I landed on July 20, 1976, seven years to the day after Apollo 11. Within minutes I sent back the first photo from the Martian surface: my own footpad sitting on rocky ground. Soon after came color images showing a rusty red landscape under a pinkish sky.",
        cam: [140, 75, 0.8],
      },
      {
        title: 'Puzzling answers',
        text: "Some of the biology tests reacted, but other instruments found no organic material in the soil. Most scientists decided the reactions came from strange chemistry, not life. The debate inspired every Mars mission since. I also worked as a weather station for over six years.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "A software command sent by mistake in November 1982 pointed my antenna away from Earth, and we never spoke again. My twin, Viking 2, went quiet in 1980 in Utopia Planitia. We are both still standing exactly where we touched down.",
        cam: [310, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'Bouncing in',
        text: "My ride, the Pathfinder lander, did not use legs. It wrapped itself in giant airbags and bounced across Mars about 15 times before rolling to a stop on July 4, 1997. Then the petals opened and I drove down a ramp onto Mars. The first rover on another planet!",
        cam: [40, 70, 1],
      },
      {
        title: 'Tiny but mighty',
        text: "I weighed about 10.6 kg and moved about 1 centimeter per second. My six wheels used a rocker-bogie suspension that let me climb over rocks. Every rover since, including Curiosity and Perseverance, uses this same design.",
        cam: [120, 80, 0.7],
      },
      {
        title: 'Rocks with names',
        text: "Scientists named the rocks around me: Barnacle Bill, Yogi, Scooby-Doo. I pressed my APXS instrument against them to find out what they were made of. Some looked like they had been rounded by water, a hint that ancient floods once rushed through this valley.",
        cam: [210, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "My lander relayed my messages to Earth. When it went silent on September 27, 1997, I could no longer talk home. My mission was planned for 7 days. I lasted 83. I am parked a few meters from the lander, now called the Carl Sagan Memorial Station.",
        cam: [300, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'A geologist on wheels',
        text: "I landed in Gusev Crater on January 4, 2004. Scientists picked this crater because it looked like an old lake bed. I carried cameras, a rock grinder and tools to read the chemistry of stones, like a field geologist who never needs to sleep.",
        cam: [40, 70, 1],
      },
      {
        title: 'Driving backward',
        text: "In 2006 my right front wheel stopped turning. So I drove backward, dragging the broken wheel. It turned out to be lucky: the wheel scraped up bright white soil that was almost pure silica.",
        cam: [130, 80, 0.8],
      },
      {
        title: 'Hot water clue',
        text: "That silica forms where hot springs or steam vents once existed. Hot water plus minerals is the kind of place where life on Earth thrives. My discoveries at a spot called Home Plate showed Mars once had environments that might have been habitable.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "In 2009 I broke through a crust into soft sand at a place called Troy and got stuck. I could not tilt my solar panels toward the winter Sun. My last message came March 22, 2010. I drove 7.73 km in a mission planned for 90 days.",
        cam: [300, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'Hole in one',
        text: "On January 25, 2004 I bounced in on airbags and rolled straight into a small crater, called Eagle crater. Right in front of me was layered bedrock, exactly what scientists had dreamed of seeing. Planetary scientists called it an interplanetary hole in one.",
        cam: [40, 70, 1],
      },
      {
        title: 'Blueberries',
        text: "The ground was covered in tiny gray spheres scientists nicknamed blueberries. They are made of hematite, a mineral that usually forms in water. With the layered rocks, they proved liquid water once soaked this place.",
        cam: [130, 80, 0.7],
      },
      {
        title: 'The marathon',
        text: "Engineers had hoped I would drive about 600 meters. I kept going year after year, crossing plains to giant Victoria and Endeavour craters. In 2015 I passed a full marathon distance, the first time anything had driven that far on another world.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "In June 2018 a planet-wide dust storm blocked out the Sun. My solar panels could not make power. My last signal came June 10, 2018. After more than 1,000 attempts to wake me, the team said goodbye in February 2019. I rest in Perseverance Valley.",
        cam: [300, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'Rising from the ashes',
        text: "My name comes from a bird that rises from ashes, because I was built from parts of earlier missions that were cancelled or lost. I landed with rocket engines near the Martian north pole on May 25, 2008, where orbiters had spotted signs of ice.",
        cam: [40, 70, 1],
      },
      {
        title: 'Disappearing chunks',
        text: "My robotic arm dug trenches. Bright white chunks appeared, and a few days later they had vanished. They had turned straight into vapor. That only happens with ice. Later my oven heated a soil sample and confirmed it: water ice.",
        cam: [130, 75, 0.8],
      },
      {
        title: 'Snow and salts',
        text: "My laser saw snow falling from clouds, though it turned to vapor before reaching the ground. I also found perchlorate salts in the soil, which can keep water liquid at very low temperatures, and which change how we search for life.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "I was built for one Martian summer. When winter came, the Sun stayed down, and I went silent on November 2, 2008. Orbiter photos later showed heavy ice had broken my solar panels. I still sit on the arctic plains.",
        cam: [300, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'A doctor for a planet',
        text: "Other missions studied the surface of Mars. I was sent to study its insides. I landed on November 26, 2018 on a flat, boring plain, chosen on purpose: flat ground is the best place to listen quietly.",
        cam: [40, 70, 1],
      },
      {
        title: 'The seismometer',
        text: "My arm lifted my seismometer off my deck and set it on the ground, under a dome to block wind. It was so sensitive it could detect motions smaller than an atom. I recorded 1,319 marsquakes, including a huge magnitude 5 quake in 2022.",
        cam: [120, 70, 0.8],
      },
      {
        title: 'X-ray of Mars',
        text: "Earthquake waves change as they pass through different layers. By studying them, scientists measured the thickness of Mars' crust and found that its liquid metal core is bigger than expected. Meteorite impacts even shook my sensors.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "Dust slowly covered my round solar panels. My power dropped until December 2022, when I sent my last message. My final tweet said: Don't worry about me, my time here has been both productive and serene.",
        cam: [300, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'Hitchhiker',
        text: "I rode to Mars folded under the belly of the Perseverance rover. I weigh only 1.8 kg. Air on Mars is about 1 percent as thick as Earth's, so my two rotors had to spin about 2,400 times every minute just to lift me.",
        cam: [40, 70, 1],
      },
      {
        title: 'Wright brothers moment',
        text: "On April 19, 2021 I rose 3 meters, hovered, and landed. The first powered, controlled flight on another planet. A tiny piece of fabric from the Wright brothers' 1903 Flyer is attached under my solar panel.",
        cam: [130, 80, 0.8],
      },
      {
        title: 'Scout',
        text: "I was planned for 5 test flights in 30 days. I made 72 flights over almost 3 years, flying ahead to scout routes and photograph places for Perseverance. Future Mars missions now plan to bring helicopters.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "On my 72nd flight in January 2024, my rotor blades were damaged during landing over smooth, featureless sand. I can never fly again. I stand on a sand ripple in Jezero, still sending weather data for a while, a stationary monument.",
        cam: [300, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'Through the belt',
        text: "I launched on March 2, 1972. Some scientists feared the asteroid belt would be too crowded to cross. I flew straight through it, unharmed, and opened the path for every outer planet explorer after me.",
        cam: [40, 70, 1],
      },
      {
        title: 'Jupiter up close',
        text: "In December 1973 I became the first spacecraft to fly past Jupiter. Its radiation was far stronger than expected and nearly fried my electronics. My twin, Pioneer 11, later became the first to visit Saturn in 1979.",
        cam: [130, 80, 0.8],
      },
      {
        title: 'The plaque',
        text: "Bolted to me is a gold-coated plaque showing a man and a woman, a map of our Sun's position using pulsars, and a drawing of our solar system with my path. It is a greeting, in case anyone ever finds me.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "My nuclear power slowly faded. Earth heard my last faint signal on January 23, 2003. I am drifting toward the star Aldebaran and will pass it in about 2 million years. Pioneer 11 went silent in 1995 and is heading toward the constellation Aquila.",
        cam: [300, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'Rendezvous',
        text: "I launched February 17, 1996 to meet a near-Earth asteroid called Eros, a potato-shaped rock about 34 km long. On Valentine's Day 2000 I became the first spacecraft ever to orbit an asteroid.",
        cam: [40, 70, 1],
      },
      {
        title: 'Mapping a rock',
        text: "For a year I circled Eros, photographing it, measuring its shape, gravity and chemistry. It turned out to be one solid, ancient piece of rock from the early solar system, covered in boulders and dust.",
        cam: [130, 80, 0.8],
      },
      {
        title: 'Bonus landing',
        text: "With my mission done, the team tried something wild: a slow, controlled descent. On February 12, 2001 I touched down at about 6 kilometers per hour. I still worked! My gamma-ray sensor read the ground for two more weeks.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "My last contact came February 28, 2001. I still sit on the surface of Eros, riding along as it loops around the Sun, sometimes passing closer to Earth than Mars does.",
        cam: [300, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'The patient engine',
        text: "I launched on September 27, 2007. My ion engines push with the force of a sheet of paper resting on your hand. Tiny, but they never stop. Over years, that gentle push added up to more speed change than any spacecraft before me.",
        cam: [40, 70, 1],
      },
      {
        title: 'Vesta',
        text: "In 2011 I arrived at Vesta, a giant asteroid. I found a huge crater at its south pole with a mountain about twice as tall as Mount Everest. Many meteorites found on Earth came from that impact.",
        cam: [130, 80, 0.8],
      },
      {
        title: 'Ceres and the bright spots',
        text: "Then I did what no spacecraft had done: left one world and orbited a second. At dwarf planet Ceres in 2015 I spotted dazzling bright spots in Occator crater. They are salt deposits left by salty water seeping up from below.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "I ran out of the hydrazine fuel that pointed my antenna and solar panels, and fell silent on November 1, 2018. I was left in a high orbit so I would not crash into Ceres for decades, keeping its icy surface clean for future explorers.",
        cam: [300, 65, 1.4],
      },
    ],
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
    chapters: [
      {
        title: 'Watching for blinks',
        text: "I launched March 6, 2009. My camera watched about 150,000 stars at once. When a planet passes in front of its star, the star dims a tiny bit. I was searching for those little blinks.",
        cam: [40, 70, 1],
      },
      {
        title: 'Planets everywhere',
        text: "Before me, we knew of only a few hundred planets around other stars. I found more than 2,600 confirmed planets. My data showed that most stars have planets, and many may have Earth-sized worlds in zones where liquid water could exist.",
        cam: [130, 80, 0.8],
      },
      {
        title: 'Balancing on sunlight',
        text: "In 2013 two of my four reaction wheels failed and I could not point steadily. Engineers had a clever idea: use the gentle pressure of sunlight to balance me. My second life, called K2, kept discovering planets for years.",
        cam: [220, 60, 1.1],
      },
      {
        title: 'Where I am now',
        text: "I ran out of fuel and was retired on October 30, 2018. I orbit the Sun, slowly falling behind Earth. My data is still being studied, and new planets are still being found in it.",
        cam: [300, 65, 1.4],
      },
    ],
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

export const WORLD_META: Record<World, { label: string; blurb: string }> = {
  moon: { label: 'The Moon', blurb: 'Landers, rovers and science stations from 1966 to 1972' },
  mars: { label: 'Mars', blurb: 'Fifty years of landers, rovers and one helicopter' },
  deep: { label: 'Deep Space', blurb: 'Probes still orbiting, resting on asteroids, or leaving the Sun behind' },
}

export const byId = (id: string) => ARTIFACTS.find((a) => a.id === id)!
