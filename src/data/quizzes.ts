// Extra mission-check questions (the first question per machine lives in artifacts.ts).
// Every answer is stated in that machine's story.
export type Q = { q: string; options: string[]; answer: number; why?: string }

export const EXTRA: Record<string, Q[]> = {
  surveyor: [
    { q: 'Why did Surveyor 3 bounce when it landed?', options: ['Its legs were springy', 'Its radar was confused, so the engines kept firing', 'It hit a boulder'], answer: 1, why: 'Reflections off bright rocks confused the radar, so the engines did not shut off in time.' },
    { q: 'What did Surveyor prove about the Moon?', options: ['It is covered in deep fluffy dust', 'The ground is firm enough to land on', 'It is made of ice'], answer: 1, why: 'The soil was firm underneath, strong enough for spacecraft and astronauts.' },
  ],
  eagle: [
    { q: 'What did Eagle’s ascent stage use as its launch pad?', options: ['The descent stage left behind', 'A tower built by the astronauts', 'The command module'], answer: 0, why: 'The top half lifted off from the bottom half, which stayed on the Moon.' },
    { q: 'What do lasers bounced off the Apollo 11 mirror show?', options: ['The Moon is getting closer', 'The Moon drifts away about 3.8 cm a year', 'The Moon is spinning faster'], answer: 1 },
  ],
  alsep: [
    { q: 'What happened to Apollo 12’s rocket just after launch?', options: ['It lost an engine', 'It was struck by lightning', 'It turned back to Earth'], answer: 1, why: 'Lightning hit the Saturn V twice, but the crew and ground team saved the mission.' },
    { q: 'What did moonquake data reveal?', options: ['The Moon is hollow', 'The Moon has a crust, mantle and small core', 'The Moon has an ocean inside'], answer: 1 },
  ],
  lrv: [
    { q: 'Which famous rock did the Apollo 15 crew find using the rover?', options: ['The Genesis Rock', 'The Blue Marble', 'Plymouth Rock'], answer: 0 },
    { q: 'How did the rover fit inside the Lunar Module?', options: ['It was built on the Moon', 'It folded in half', 'It was inflated like a balloon'], answer: 1 },
  ],
  viking: [
    { q: 'What was Viking’s biology lab searching for?', options: ['Gold', 'Signs of life in the soil', 'Liquid oceans'], answer: 1 },
    { q: 'How long did Viking 1 keep working on Mars?', options: ['90 days', 'More than 6 years', '2 weeks'], answer: 1, why: 'It was planned for 90 days and worked for over six years.' },
  ],
  sojourner: [
    { q: 'Sojourner was planned to work 7 days. How long did it last?', options: ['3 days', '83 days', '500 days'], answer: 1 },
    { q: 'Which design did Sojourner test that every later Mars rover uses?', options: ['Rocker-bogie wheels', 'Tank treads', 'Walking legs'], answer: 0 },
  ],
  spirit: [
    { q: 'What did Spirit’s dragging wheel uncover?', options: ['Ice', 'Nearly pure silica from ancient hot springs', 'A meteorite'], answer: 1 },
    { q: 'Why did Spirit’s mission end?', options: ['It got stuck in soft sand', 'It fell off a cliff', 'A dust devil flipped it'], answer: 0 },
  ],
  opportunity: [
    { q: 'What were the “blueberries” Opportunity found?', options: ['Frozen water', 'Hematite spheres that form in water', 'Seeds'], answer: 1 },
    { q: 'What record did Opportunity set in 2015?', options: ['Fastest rover', 'First marathon distance on another world', 'Deepest hole on Mars'], answer: 1 },
  ],
  phoenix: [
    { q: 'Where on Mars did Phoenix land?', options: ['Near the equator', 'Near the north pole', 'Inside Olympus Mons'], answer: 1 },
    { q: 'What photographed Phoenix hanging under its parachute?', options: ['The Hubble Space Telescope', 'The Mars Reconnaissance Orbiter', 'A camera on Phoenix itself'], answer: 1 },
  ],
  insight: [
    { q: 'How many marsquakes did InSight record?', options: ['13', '1,319', 'About a million'], answer: 1 },
    { q: 'What surprised scientists about Mars’ core?', options: ['It is bigger than expected', 'It is solid ice', 'Mars has no core'], answer: 0 },
  ],
  ingenuity: [
    { q: 'How did Ingenuity travel to Mars?', options: ['On its own rocket', 'Folded under the Perseverance rover', 'Carried by astronauts'], answer: 1 },
    { q: 'Why must Ingenuity’s rotors spin so fast?', options: ['Mars air is very thin', 'Mars gravity is stronger than Earth’s', 'To blow dust off the rover'], answer: 0, why: 'Martian air is only about 1 percent as thick as Earth’s.' },
  ],
  pioneer: [
    { q: 'Pioneer 10 was the first spacecraft to fly past which planet?', options: ['Saturn', 'Jupiter', 'Neptune'], answer: 1 },
    { q: 'Which missions followed the path Pioneer opened?', options: ['Voyager 1 and 2', 'Apollo 11 and 12', 'Viking 1 and 2'], answer: 0 },
  ],
  near: [
    { q: 'What was the first asteroid ever orbited by a spacecraft?', options: ['Bennu', '433 Eros', 'Vesta'], answer: 1 },
    { q: 'Which later NASA mission brought asteroid samples home?', options: ['OSIRIS-REx', 'Kepler', 'Pioneer 11'], answer: 0 },
  ],
  dawn: [
    { q: 'What were the bright spots on Ceres?', options: ['City lights', 'Salt left by salty water', 'Lava volcanoes'], answer: 1 },
    { q: 'Which two worlds did Dawn orbit?', options: ['Mars and Phobos', 'Vesta and Ceres', 'Jupiter and Io'], answer: 1 },
  ],
  kepler: [
    { q: 'About how many planets did Kepler confirm?', options: ['26', 'More than 2,600', 'About 2 million'], answer: 1 },
    { q: 'How did engineers steady Kepler after two reaction wheels failed?', options: ['Using the gentle pressure of sunlight', 'Sending astronauts to fix it', 'Docking it to a satellite'], answer: 0 },
  ],
}

export const PASS_MARK = 2
