// Every link scraped from the challenge Resources tab (via spaceappschallenge.org GraphQL API)
export type ResourceLink = { title: string; url: string; note: string; group: string }

export const CHALLENGE_URL =
  'https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/'

export const RESOURCES: ResourceLink[] = [
  {
    group: 'Catalog',
    title: 'NASA Space Science Data Coordinated Archive (NSSDCA)',
    url: 'https://nssdc.gsfc.nasa.gov/',
    note: "NASA's definitive public catalog of spacecraft and instruments, final resting places and status.",
  },
  {
    group: 'The Moon',
    title: 'Apollo Lunar Modules',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C',
    note: "Descent stages (like Apollo 11's Eagle) left behind as launch pads.",
  },
  {
    group: 'The Moon',
    title: 'Lunar Roving Vehicles (LRVs)',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C',
    note: 'Three electric moon buggies driven by astronauts. Parked permanently on the Moon.',
  },
  {
    group: 'The Moon',
    title: 'ALSEP Scientific Packages',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C',
    note: 'Seismometers, retroreflectors and more, left to do science after astronauts departed.',
  },
  {
    group: 'The Moon',
    title: 'Surveyor Landers',
    url: 'https://science.nasa.gov/mission/surveyor-3/',
    note: '1960s robotic probes sent to prove soft landings were possible.',
  },
  {
    group: 'Mars',
    title: 'Sojourner Rover',
    url: 'https://science.nasa.gov/mission/mars-pathfinder/',
    note: 'First rover on Mars (1997), delivered by the Pathfinder lander.',
  },
  {
    group: 'Mars',
    title: 'Spirit & Opportunity',
    url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    note: 'Twin rovers that operated for years. Both now inactive.',
  },
  {
    group: 'Mars',
    title: 'Viking 1 & 2 Landers',
    url: 'https://science.nasa.gov/mission/viking-1/',
    note: 'First U.S. landers to successfully operate on Mars (1976).',
  },
  {
    group: 'Mars',
    title: 'Phoenix & InSight Landers',
    url: 'https://science.nasa.gov/mission/insight/',
    note: 'Phoenix dug for water ice; InSight listened for marsquakes. Both lost power.',
  },
  {
    group: 'Mars',
    title: 'Ingenuity Helicopter',
    url: 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/',
    note: 'First aircraft on another planet. Rotor damage made it a stationary artifact.',
  },
  {
    group: 'Deep Space',
    title: 'Dawn Spacecraft',
    url: 'https://science.nasa.gov/mission/dawn/',
    note: 'Mapped Vesta and Ceres. Unpowered orbit around Ceres.',
  },
  {
    group: 'Deep Space',
    title: 'NEAR Shoemaker',
    url: 'https://science.nasa.gov/mission/near-shoemaker/',
    note: 'First to orbit and land on an asteroid, 433 Eros.',
  },
  {
    group: 'Deep Space',
    title: 'Pioneer 10 & 11',
    url: 'https://science.nasa.gov/mission/pioneer-10/',
    note: 'Early outer-planet probes, now drifting out of the solar system.',
  },
  {
    group: 'Deep Space',
    title: 'Kepler Space Telescope',
    url: 'https://science.nasa.gov/mission/kepler/',
    note: 'Exoplanet hunter, out of fuel, drifting in an Earth-trailing orbit.',
  },
]

export const ASSET_CREDITS = [
  { title: 'NASA 3D Resources (models + planet textures)', url: 'https://github.com/nasa/NASA-3D-Resources' },
  { title: 'Solar System Scope textures: Earth, Mars, Jupiter, Milky Way (CC BY 4.0)', url: 'https://www.solarsystemscope.com/textures/' },
  { title: 'NASA SVS CGI Moon Kit (Moon map)', url: 'https://svs.gsfc.nasa.gov/4720' },
]
