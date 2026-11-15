// Full mission timelines: launch on Earth to where each machine rests today.
export type Phase = 'Launch' | 'Cruise' | 'Arrival' | 'Mission' | 'Discovery' | 'Legacy' | 'Today'
export type SceneKind = 'launch' | 'cruise' | 'entry' | 'orbit' | 'flyby' | 'stage' | 'interior' | 'transit'
export type Act =
  | 'idle' | 'land' | 'bounce' | 'liftoff' | 'laser' | 'quake' | 'deploy' | 'drive' | 'driveBack' | 'driveIn'
  | 'stuck' | 'dust' | 'rest' | 'dig' | 'snow' | 'frost' | 'fly' | 'crash' | 'skycrane' | 'airbag' | 'drift'
  | 'ion' | 'coast' | 'sunlight' | 'dropoff'
export type Body = 'moon' | 'mars' | 'vesta' | 'ceres' | 'eros' | 'jupiter' | 'sun'
export type RocketKind = 'saturnv' | 'atlas-centaur' | 'titan3e' | 'delta2' | 'delta2h' | 'atlasv'
export type Craft = 'self' | 'aeroshell' | 'apollo' | 'lm'

export type Beat = {
  phase: Phase
  title: string
  text: string
  date?: string
  scene: SceneKind
  act?: Act
  body?: Body
  cam?: [number, number, number]
  highlight?: string
}

export type Mission = {
  rocket: RocketKind
  rocketName: string
  site: string
  craft: Craft // what flies during cruise
  dest: Body
  beats: Beat[]
}

const C1: [number, number, number] = [40, 70, 1]
const C2: [number, number, number] = [130, 78, 0.8]
const C3: [number, number, number] = [220, 62, 1.1]
const C4: [number, number, number] = [305, 66, 1.4]

export const MISSIONS: Record<string, Mission> = {
  surveyor: {
    rocket: 'atlas-centaur', rocketName: 'Atlas-Centaur', site: 'Cape Kennedy, Florida', craft: 'self', dest: 'moon',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Apr 17, 1967', title: 'The big question',
        text: "In the 1960s nobody knew if the Moon was solid ground or deep, fluffy dust that would swallow a spacecraft. NASA had to find out before sending astronauts. On April 17, 1967, an Atlas-Centaur rocket launched me from Cape Kennedy to get the answer." },
      { phase: 'Cruise', scene: 'cruise', date: 'Apr 17 to 20, 1967', title: 'Straight to the Moon',
        text: "I did not stop in orbit. My Centaur stage aimed me directly at the Moon, and for about 65 hours I coasted through space, folded up and quiet, with one small course correction along the way." },
      { phase: 'Arrival', scene: 'stage', act: 'bounce', cam: C1, date: 'Apr 20, 1967', title: 'Touchdown, and a bounce',
        text: "Radar measured my height while my rocket engines slowed me down. Reflections off bright rocks confused the radar, so my engines did not shut off in time. I bounced twice before settling into a small crater in the Ocean of Storms." },
      { phase: 'Mission', scene: 'stage', act: 'dig', cam: C2, title: 'Digging in',
        text: "I carried a scoop on an arm, a first for the Moon. Controllers on Earth used it to dig trenches, squeeze the soil and drop it. My TV camera sent back 6,315 pictures of my new home." },
      { phase: 'Discovery', scene: 'stage', act: 'idle', cam: C3, title: 'The answer', highlight: 'The surface can hold a lander',
        text: "The soil behaved like damp sand: soft on top, firmer underneath. Strong enough to hold a spacecraft, and strong enough to hold astronauts. The way was clear for Apollo." },
      { phase: 'Legacy', scene: 'stage', act: 'idle', cam: C2, date: 'Nov 1969', title: 'Visitors from Earth',
        text: "In November 1969, Apollo 12 landed about 180 meters away. Astronauts Pete Conrad and Alan Bean walked over and cut off my camera to carry home, so engineers could study what 31 months on the Moon does to metal, glass and wires." },
      { phase: 'Today', scene: 'stage', act: 'rest', cam: C4, title: 'Where I am now',
        text: "I still stand in my crater, missing a few parts. My brothers Surveyor 1, 5, 6 and 7 are out there too. Surveyor 6 even made the first lift-off from the Moon, a short hop of a few meters. We were the scouts. Apollo followed." },
    ],
  },

  eagle: {
    rocket: 'saturnv', rocketName: 'Saturn V', site: 'Kennedy Space Center, Florida', craft: 'apollo', dest: 'moon',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Jul 16, 1969', title: 'Riding the giant', highlight: '111 meters tall',
        text: "July 16, 1969. I was folded inside the Saturn V, the most powerful rocket that had ever flown. Above me sat the command module Columbia, carrying Neil Armstrong, Buzz Aldrin and Michael Collins." },
      { phase: 'Cruise', scene: 'cruise', date: 'Jul 16 to 19, 1969', title: 'Three days to the Moon',
        text: "After leaving Earth orbit, Columbia turned around, docked with me and pulled me free of the rocket. Together we coasted for three days across 384,000 km of space." },
      { phase: 'Arrival', scene: 'orbit', body: 'moon', date: 'Jul 20, 1969', title: 'Undocking',
        text: "On July 20, Armstrong and Aldrin floated into me. We undocked from Columbia, Collins stayed in orbit, and I fired my descent engine to begin falling toward the Sea of Tranquility." },
      { phase: 'Arrival', scene: 'stage', act: 'land', cam: C2, title: '"The Eagle has landed"', highlight: 'Jul 20, 1969 · 20:17 UTC',
        text: "The computer flashed alarms and the planned spot was full of boulders. Armstrong took manual control, flew me over the rocks, and touched down with fuel running very low. Then came the words: Houston, Tranquility Base here. The Eagle has landed." },
      { phase: 'Mission', scene: 'stage', act: 'idle', cam: C1, title: 'One small step',
        text: "Six and a half hours later, Armstrong climbed down my ladder and stepped onto the Moon. The two astronauts collected rocks, set up experiments and planted a flag, all within sight of me." },
      { phase: 'Mission', scene: 'stage', act: 'liftoff', cam: C3, date: 'Jul 21, 1969', title: 'I became a launch pad',
        text: "After 21 and a half hours on the surface, the astronauts climbed into my top half, the ascent stage. It fired its own engine and lifted off, using me as its launch pad. I stayed behind." },
      { phase: 'Discovery', scene: 'stage', act: 'laser', cam: C4, title: 'A mirror for lasers', highlight: 'The Moon drifts away 3.8 cm a year',
        text: "Near me the crew left a laser retroreflector. Observatories on Earth still fire lasers at it today. The timing shows the Moon is slowly drifting away from Earth, about 3.8 centimeters every year." },
      { phase: 'Legacy', scene: 'stage', act: 'idle', cam: C2, title: 'What the rocks told us', highlight: '21.5 kg of Moon rock',
        text: "Apollo 11's rocks gave the first clues that the young Moon was covered by an ocean of molten rock. Samples from later missions showed the Moon is about 4.5 billion years old. Five more crews landed after us." },
      { phase: 'Today', scene: 'stage', act: 'rest', cam: C4, title: 'Where I am now',
        text: "I still stand in the Sea of Tranquility. A plaque on my leg reads: Here men from the planet Earth first set foot upon the Moon, July 1969 A.D. We came in peace for all mankind." },
    ],
  },

  alsep: {
    rocket: 'saturnv', rocketName: 'Saturn V (Apollo 12)', site: 'Kennedy Space Center, Florida', craft: 'apollo', dest: 'moon',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Nov 14, 1969', title: 'Struck by lightning', highlight: 'Hit by lightning twice',
        text: "November 14, 1969. I was packed inside the Lunar Module of Apollo 12. Just after liftoff our Saturn V was struck by lightning, twice! Power alarms lit up, but a quick fix from the ground and the crew saved the mission." },
      { phase: 'Cruise', scene: 'cruise', date: 'Nov 14 to 18, 1969', title: 'A pinpoint target',
        text: "Apollo 12 had a special target: land right next to an old robot, Surveyor 3, which had been sitting on the Moon for two and a half years." },
      { phase: 'Arrival', scene: 'orbit', body: 'moon', date: 'Nov 19, 1969', title: 'Right on target',
        text: "Pete Conrad and Alan Bean steered their Lunar Module, Intrepid, down just 180 meters from Surveyor 3. It proved astronauts could land exactly where they planned." },
      { phase: 'Mission', scene: 'stage', act: 'idle', cam: C1, title: 'A lab you leave behind',
        text: "Astronauts could only stay a short time. So they set me up: instruments wired to a central station with a radio, powered by a small nuclear generator that turned heat into electricity." },
      { phase: 'Mission', scene: 'stage', act: 'quake', cam: C2, title: 'Listening to moonquakes', highlight: 'The Moon rang like a bell',
        text: "My seismometer could feel tiny vibrations. When the crew crashed their used ascent stage into the Moon on purpose, I felt the Moon ring like a bell for almost an hour. Over eight years our network recorded thousands of moonquakes." },
      { phase: 'Discovery', scene: 'interior', body: 'moon', title: 'Inside the Moon', highlight: 'Crust · Mantle · Core',
        text: "Quake waves bend and slow down as they pass through different layers. Our data showed the Moon has a crust, a mantle and a small core, like Earth, but it is cold and quiet inside." },
      { phase: 'Today', scene: 'stage', act: 'rest', cam: C4, date: 'Sep 30, 1977', title: 'Switched off, still useful',
        text: "On September 30, 1977, NASA switched all five stations off to save money. We are silent now. But the laser mirrors left at Apollo 11, 14 and 15 need no power, and observatories still aim lasers at them today." },
    ],
  },

  lrv: {
    rocket: 'saturnv', rocketName: 'Saturn V (Apollo 15)', site: 'Kennedy Space Center, Florida', craft: 'apollo', dest: 'moon',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Jul 26, 1971', title: 'A car on a rocket', highlight: 'First car on another world',
        text: "July 26, 1971. Apollo 15 launched on a Saturn V, with me folded flat against the side of the Lunar Module Falcon. I was the first car ever sent to another world." },
      { phase: 'Cruise', scene: 'cruise', date: 'Jul 26 to 30, 1971', title: 'The boldest landing yet',
        text: "Four days later Dave Scott and Jim Irwin flew Falcon down between the Apennine Mountains and a winding canyon called Hadley Rille, the most daring landing site of Apollo so far." },
      { phase: 'Arrival', scene: 'stage', act: 'deploy', cam: C1, title: 'Unfolding like origami',
        text: "I was stored folded in half with my wheels tucked in. The astronauts pulled on straps and I unfolded, swung down and dropped to the ground, ready to roll." },
      { phase: 'Mission', scene: 'stage', act: 'drive', cam: C2, title: 'Wheels made of wire',
        text: "Rubber tires would fail in the Moon's extreme heat and cold, so my wheels were woven from zinc-coated piano wire with titanium treads. Each wheel had its own electric motor, powered by two batteries." },
      { phase: 'Discovery', scene: 'stage', act: 'drive', cam: C3, title: 'Going farther', highlight: 'Genesis Rock: about 4 billion years old',
        text: "Walking in spacesuits is tiring. With me, crews could drive kilometers away to mountains and canyon edges. On the slopes of Mount Hadley Delta the crew found the Genesis Rock, a piece of the Moon's ancient crust." },
      { phase: 'Legacy', scene: 'stage', act: 'drive', cam: C2, title: 'Road trips on the Moon', highlight: '~90 km driven by 3 rovers',
        text: "Apollo 16 and 17 brought rovers too. Gene Cernan and Harrison Schmitt drove about 36 km on Apollo 17. Rovers let astronauts reach far more places and bring back far more kinds of rock." },
      { phase: 'Today', scene: 'stage', act: 'rest', cam: C4, title: 'Where I am now',
        text: "At the end of each mission the crew parked the rover a short distance away and pointed its TV camera at the lander, so people on Earth could watch the lift-off live. Three of us are still parked on the Moon." },
    ],
  },

  viking: {
    rocket: 'titan3e', rocketName: 'Titan IIIE-Centaur', site: 'Cape Canaveral, Florida', craft: 'aeroshell', dest: 'mars',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Aug 20, 1975', title: 'Two spacecraft in one',
        text: "August 20, 1975. A Titan IIIE-Centaur launched me from Cape Canaveral. I was really two spacecraft: an orbiter, and me, the lander, sealed inside a protective shell. Viking 2 followed three weeks later." },
      { phase: 'Cruise', scene: 'cruise', date: 'Aug 1975 to Jun 1976', title: 'Ten months, totally clean',
        text: "Our curving path around the Sun took ten months. I had been heat-sterilized before launch so no Earth germs could fool my search for life on Mars." },
      { phase: 'Arrival', scene: 'orbit', body: 'mars', date: 'Jun 19, 1976', title: 'Looking for a safe spot',
        text: "We reached Mars orbit in June 1976. The planned landing site looked too rough in orbiter photos, so scientists searched for weeks. My landing date slipped from July 4 to July 20." },
      { phase: 'Arrival', scene: 'entry', date: 'Jul 20, 1976', title: 'Through the fire',
        text: "I separated from the orbiter and plunged into the thin Martian air inside my heat shield. A parachute opened, then three engines with 18 small nozzles each fired, spreading their blast so they would not disturb the soil I came to study." },
      { phase: 'Arrival', scene: 'stage', act: 'land', cam: C2, title: 'The first picture', highlight: 'First photo from the surface of Mars',
        text: "I touched down seven years to the day after Apollo 11. Within minutes I sent back the first photo ever taken on the surface of Mars: my own footpad on rocky ground." },
      { phase: 'Mission', scene: 'stage', act: 'dig', cam: C1, title: 'Searching for life',
        text: "My robotic arm scooped soil into a tiny automated biology lab. My instruments fed it nutrients to see if anything living would breathe out gas." },
      { phase: 'Discovery', scene: 'stage', act: 'idle', cam: C3, title: 'Puzzling answers', highlight: 'The life results are still debated',
        text: "Some tests reacted, but other instruments found no organic material. Most scientists decided strange soil chemistry, not life, caused the reactions. The debate inspired every Mars mission since." },
      { phase: 'Legacy', scene: 'stage', act: 'idle', cam: C2, title: 'Weather station Mars', highlight: '6+ years on a 90 day mission',
        text: "I reported Martian weather for over six years while my orbiter mapped the whole planet. Viking taught NASA how to land on Mars, and set the plan for later missions: follow the water." },
      { phase: 'Today', scene: 'stage', act: 'rest', cam: C4, date: 'Nov 1982', title: 'Where I am now',
        text: "In November 1982 a faulty command pointed my antenna away from Earth, and we never spoke again. My twin went quiet in 1980. We both still stand exactly where we touched down." },
    ],
  },

  sojourner: {
    rocket: 'delta2', rocketName: 'Delta II', site: 'Cape Canaveral, Florida', craft: 'aeroshell', dest: 'mars',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Dec 4, 1996', title: 'Faster, better, cheaper',
        text: "December 4, 1996. A Delta II launched Mars Pathfinder, a mission meant to prove NASA could reach Mars quickly and cheaply. Tucked on one of the lander's petals was me, a rover the size of a microwave oven." },
      { phase: 'Cruise', scene: 'cruise', date: 'Dec 1996 to Jul 1997', title: 'Straight in',
        text: "We flew for seven months. Unlike Viking, Pathfinder did not stop in orbit first. It flew straight into the Martian atmosphere at about 26,000 km/h." },
      { phase: 'Arrival', scene: 'entry', date: 'Jul 4, 1997', title: 'Heat shield, chute, rockets, airbags',
        text: "A heat shield took the fire. A parachute opened. Then, seconds before impact, giant airbags inflated around the lander like a bunch of grapes and small rockets fired to slow us down." },
      { phase: 'Arrival', scene: 'stage', act: 'airbag', cam: C1, title: 'Bouncing in', highlight: '~15 bounces',
        text: "We hit the ground and bounced about 15 times, some bounces as high as a building, before rolling to a stop. Then the airbags deflated, the petals opened, and Mars was all around us." },
      { phase: 'Mission', scene: 'stage', act: 'driveIn', cam: C2, date: 'Jul 6, 1997', title: 'First wheels on Mars',
        text: "I drove down a ramp onto the dirt. I weighed 10.6 kg and moved about 1 centimeter per second, and my six wheels used a rocker-bogie suspension that let me climb over rocks." },
      { phase: 'Discovery', scene: 'stage', act: 'drive', cam: C3, title: 'Rocks with names', highlight: 'Rounded rocks: ancient floods',
        text: "Scientists named the rocks around me: Barnacle Bill, Yogi, Scooby-Doo. My APXS instrument read their chemistry. Many looked rounded and stacked by water, a sign that huge floods once rushed through this valley." },
      { phase: 'Legacy', scene: 'stage', act: 'idle', cam: C2, title: 'Every rover since', highlight: 'Rocker-bogie: on every Mars rover since',
        text: "My rocker-bogie wheels and Pathfinder's airbag landing were reused. Spirit, Opportunity, Curiosity and Perseverance all roll on the same idea I tested first." },
      { phase: 'Today', scene: 'stage', act: 'rest', cam: C4, date: 'Sep 27, 1997', title: 'Where I am now',
        text: "My lander relayed my messages home. When it went silent on September 27, 1997, I could no longer talk to Earth. My mission was planned for 7 days. I lasted 83. I am parked near the lander, now named the Carl Sagan Memorial Station." },
    ],
  },

  spirit: {
    rocket: 'delta2', rocketName: 'Delta II', site: 'Cape Canaveral, Florida', craft: 'aeroshell', dest: 'mars',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Jun 10, 2003', title: 'Twin number one',
        text: "June 10, 2003. A Delta II launched me from Cape Canaveral. My twin Opportunity followed a month later. We were robot geologists, sent to find out if water once flowed on Mars." },
      { phase: 'Cruise', scene: 'cruise', date: 'Jun 2003 to Jan 2004', title: '487 million kilometers',
        text: "Mars and Earth are never that far apart in a straight line, but spacecraft must curve around the Sun. My path stretched about 487 million km over seven months." },
      { phase: 'Arrival', scene: 'entry', date: 'Jan 4, 2004', title: 'Six minutes of terror',
        text: "I hit the atmosphere at about 19,300 km/h. Heat shield, parachute, rockets, then airbags, all in about six minutes, with no help from Earth. The radio signal took ten minutes to reach home." },
      { phase: 'Arrival', scene: 'stage', act: 'airbag', cam: C1, title: 'Bouncing into Gusev',
        text: "I bounced to a stop in Gusev Crater, a giant crater scientists thought once held a lake. I rolled off my lander with cameras, a rock grinder and tools to read the chemistry of stones." },
      { phase: 'Mission', scene: 'stage', act: 'drive', cam: C2, title: 'Climbing a mountain',
        text: "The plains around me were mostly volcanic rock. So I drove over 2 km to the Columbia Hills and climbed all the way to the top of Husband Hill. A rover climbing a mountain on Mars!" },
      { phase: 'Mission', scene: 'stage', act: 'driveBack', cam: C3, date: '2006', title: 'Driving backward',
        text: "In 2006 my right front wheel stopped turning. So I drove backward, dragging it. That turned out to be lucky: the dragging wheel scraped up bright white soil that was almost pure silica." },
      { phase: 'Discovery', scene: 'stage', act: 'idle', cam: C2, title: 'A hot water clue', highlight: 'Silica: signs of ancient hot springs',
        text: "Silica like that forms in hot springs or steam vents. On Earth such places are full of microbes. My discoveries at Home Plate showed Mars once had spots that might have been habitable." },
      { phase: 'Today', scene: 'stage', act: 'stuck', cam: C4, date: 'Mar 22, 2010', title: 'Stuck at Troy', highlight: '7.73 km on a 90 day mission',
        text: "In 2009 I broke through a crust into soft sand at a place called Troy and could not get out. I could not tilt my solar panels toward the winter Sun. My last message came March 22, 2010." },
    ],
  },

  opportunity: {
    rocket: 'delta2h', rocketName: 'Delta II Heavy', site: 'Cape Canaveral, Florida', craft: 'aeroshell', dest: 'mars',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Jul 7, 2003', title: 'Twin number two',
        text: "July 7, 2003. A Delta II Heavy launched me one month after my twin Spirit. I was headed for Meridiani Planum, where orbiters had spotted hematite, a mineral that often forms in water." },
      { phase: 'Cruise', scene: 'cruise', date: 'Jul 2003 to Jan 2004', title: 'Following my sister',
        text: "Spirit landed three weeks before me. While I flew, I listened to the news: my twin was safe on the other side of Mars." },
      { phase: 'Arrival', scene: 'entry', date: 'Jan 25, 2004', title: 'Heat, chute, airbags',
        text: "Heat shield, parachute, retrorockets, airbags. Same recipe as Spirit, aimed at a smooth plain halfway around the planet." },
      { phase: 'Arrival', scene: 'stage', act: 'airbag', cam: C1, title: 'Hole in one',
        text: "I bounced and rolled straight into a small crater, Eagle crater. Right in front of me was layered bedrock, exactly what scientists had dreamed of. They called it an interplanetary hole in one." },
      { phase: 'Discovery', scene: 'stage', act: 'idle', cam: C2, title: 'Blueberries', highlight: 'Hematite spheres: water was here',
        text: "The ground was covered in tiny gray balls nicknamed blueberries. They are hematite, which forms in water. Together with the layered rocks, they proved liquid water once soaked this place." },
      { phase: 'Mission', scene: 'stage', act: 'drive', cam: C3, title: 'The marathon', highlight: '45.16 km driven',
        text: "Engineers hoped I would drive about 600 meters. I kept going for years, to Victoria crater and then giant Endeavour crater. In 2015 I passed a full marathon distance, the first ever on another world." },
      { phase: 'Legacy', scene: 'stage', act: 'idle', cam: C2, title: 'Where to look next',
        text: "My discoveries helped convince scientists that ancient Mars had liquid water at its surface. That shaped where Curiosity and Perseverance were sent to search for signs of past life." },
      { phase: 'Today', scene: 'stage', act: 'dust', cam: C4, date: 'Jun 10, 2018', title: 'The dust storm',
        text: "In June 2018 a dust storm covered the whole planet and blocked out the Sun. My solar panels could not make power. After more than 1,000 attempts to wake me, the team said goodbye in February 2019. I rest in Perseverance Valley." },
    ],
  },

  phoenix: {
    rocket: 'delta2', rocketName: 'Delta II', site: 'Cape Canaveral, Florida', craft: 'aeroshell', dest: 'mars',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Aug 4, 2007', title: 'Rising from the ashes',
        text: "August 4, 2007. A Delta II launched me from Cape Canaveral. My name comes from a bird that rises from ashes: I was built from a lander cancelled years earlier and lessons learned from one that was lost." },
      { phase: 'Cruise', scene: 'cruise', date: 'Aug 2007 to May 2008', title: 'Racing to the arctic',
        text: "For ten months I flew toward the far north of Mars, where the Mars Odyssey orbiter had detected lots of hydrogen just under the ground. Hydrogen there usually means ice." },
      { phase: 'Arrival', scene: 'entry', date: 'May 25, 2008', title: 'Photographed while falling',
        text: "I fell through the atmosphere inside my heat shield and opened my parachute. High above, the Mars Reconnaissance Orbiter snapped a photo of me hanging under it, the first picture of a spacecraft landing on another world." },
      { phase: 'Arrival', scene: 'stage', act: 'land', cam: C1, title: 'Legs, not airbags',
        text: "I landed on three legs using pulsing rocket engines, the first to do so on Mars since Viking. Around me: polygon-shaped cracks everywhere, like frozen ground in Earth's arctic." },
      { phase: 'Mission', scene: 'stage', act: 'dig', cam: C2, title: 'Disappearing chunks', highlight: 'Water ice confirmed',
        text: "My robotic arm dug trenches. Bright white chunks appeared, and days later they had vanished, turning straight into vapor. Only ice does that. My oven then heated a sample and confirmed it: water." },
      { phase: 'Discovery', scene: 'stage', act: 'snow', cam: C3, title: 'Snow and salts', highlight: 'Snow falling from Martian clouds',
        text: "My laser saw snow falling from clouds, turning to vapor before it reached the ground. I also found perchlorate salts in the soil, which help water stay liquid in the cold." },
      { phase: 'Legacy', scene: 'stage', act: 'idle', cam: C2, title: 'Water for explorers',
        text: "Finding shallow ice changed how scientists picture Mars today, and where future astronauts might find water to drink or turn into rocket fuel." },
      { phase: 'Today', scene: 'stage', act: 'frost', cam: C4, date: 'Nov 2, 2008', title: 'Winter came',
        text: "I was built for one Martian summer. When winter came the Sun stayed down, and I went silent on November 2, 2008. Orbiter photos later showed heavy ice had broken my solar panels." },
    ],
  },

  insight: {
    rocket: 'atlasv', rocketName: 'Atlas V 401', site: 'Vandenberg, California', craft: 'aeroshell', dest: 'mars',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'May 5, 2018', title: 'From the West Coast', highlight: 'First interplanetary launch from the US West Coast',
        text: "May 5, 2018. An Atlas V lifted me off from Vandenberg in California. Two briefcase-sized satellites called MarCO came along, the first tiny CubeSats ever sent to another planet." },
      { phase: 'Cruise', scene: 'cruise', date: 'May to Nov 2018', title: '485 million kilometers',
        text: "For six and a half months I traveled about 485 million km. The MarCO twins flew behind me, ready to relay my landing signal home." },
      { phase: 'Arrival', scene: 'entry', date: 'Nov 26, 2018', title: 'Seven minutes of terror',
        text: "I hit the atmosphere at about 19,800 km/h. In under seven minutes, heat shield, parachute and twelve descent engines slowed me to walking speed." },
      { phase: 'Arrival', scene: 'stage', act: 'land', cam: C1, title: 'A doctor for a planet',
        text: "Other missions studied the surface. I came to study the inside. I landed on a flat, boring plain, chosen on purpose: flat, quiet ground is best for listening." },
      { phase: 'Mission', scene: 'stage', act: 'quake', cam: C2, title: 'The seismometer', highlight: '1,319 marsquakes',
        text: "My arm set my seismometer on the ground under a dome to block the wind. It was so sensitive it could detect motions smaller than an atom. I recorded 1,319 marsquakes, including a big magnitude 5 in 2022." },
      { phase: 'Discovery', scene: 'interior', body: 'mars', title: 'An X-ray of Mars', highlight: 'Bigger liquid core than expected',
        text: "Quake waves change as they pass through different layers. By timing them, scientists measured Mars' crust and mantle and found its liquid metal core is bigger than expected." },
      { phase: 'Legacy', scene: 'stage', act: 'quake', cam: C3, title: 'How rocky planets form',
        text: "That first map of the inside of another rocky planet helps explain how planets like Earth formed and cooled. I even felt meteorites smash into Mars." },
      { phase: 'Today', scene: 'stage', act: 'dust', cam: C4, date: 'Dec 15, 2022', title: 'Productive and serene',
        text: "Dust slowly covered my round solar panels until December 2022, when I sent my last message. My final words to Earth: Don't worry about me, my time here has been both productive and serene." },
    ],
  },

  ingenuity: {
    rocket: 'atlasv', rocketName: 'Atlas V 541', site: 'Cape Canaveral, Florida', craft: 'aeroshell', dest: 'mars',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Jul 30, 2020', title: 'A hitchhiker',
        text: "July 30, 2020. An Atlas V launched the Perseverance rover from Cape Canaveral. Folded under its belly was me: a 1.8 kg helicopter, an experiment that might not work at all." },
      { phase: 'Cruise', scene: 'cruise', date: 'Jul 2020 to Feb 2021', title: 'Seven months',
        text: "We traveled about 470 million km. Along the way the rover topped up my batteries and checked that I was healthy." },
      { phase: 'Arrival', scene: 'entry', date: 'Feb 18, 2021', title: 'Seven minutes of terror',
        text: "Our spacecraft plunged into the Martian air. A supersonic parachute opened, and the rover's computer compared camera images with maps to pick a safe spot by itself." },
      { phase: 'Arrival', scene: 'stage', act: 'skycrane', cam: [40, 70, 2.4], title: 'Sky crane',
        text: "A rocket-powered sky crane hovered above the floor of Jezero Crater, an ancient lake bed, and lowered Perseverance on cables. Then it cut the cords and flew off to crash far away." },
      { phase: 'Mission', scene: 'stage', act: 'dropoff', cam: [60, 68, 2.2], date: 'Apr 3, 2021', title: 'Dropped off',
        text: "The rover lowered me to the ground and drove away so my solar panel could see the Sun. I had to survive my first freezing night alone, at about minus 90 degrees Celsius." },
      { phase: 'Mission', scene: 'stage', act: 'fly', cam: C2, date: 'Apr 19, 2021', title: 'Wright brothers moment', highlight: 'First powered flight on another world',
        text: "Air on Mars is about 1 percent as thick as Earth's, so my rotors spin about 2,400 times a minute. I rose 3 meters, hovered and landed. A scrap of fabric from the Wright brothers' 1903 Flyer rides under my solar panel." },
      { phase: 'Discovery', scene: 'stage', act: 'fly', cam: C3, title: 'Scout', highlight: '72 flights · 5 planned',
        text: "I was planned for 5 test flights in 30 days. I made 72 flights over almost 3 years, scouting routes and photographing places ahead of Perseverance. Future Mars missions now plan to bring helicopters." },
      { phase: 'Today', scene: 'stage', act: 'crash', cam: C4, date: 'Jan 18, 2024', title: 'Grounded',
        text: "On my 72nd flight, over smooth featureless sand, my rotor blades were damaged during landing. I can never fly again. I stand on a sand ripple in Jezero, a monument to the first flight on another world." },
    ],
  },

  pioneer: {
    rocket: 'atlas-centaur', rocketName: 'Atlas-Centaur', site: 'Cape Kennedy, Florida', craft: 'self', dest: 'jupiter',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Mar 2, 1972', title: 'Fastest ever', highlight: 'Passed the Moon in 11 hours',
        text: "March 2, 1972. An Atlas-Centaur with an extra kick stage launched me so fast that I crossed the Moon's orbit just 11 hours later. Nothing had ever left Earth faster." },
      { phase: 'Cruise', scene: 'cruise', date: '1972 to 1973', title: 'Through the belt',
        text: "Some scientists feared the asteroid belt would be too crowded to cross. I flew straight through it, unharmed, and opened the road for every outer-planet explorer after me." },
      { phase: 'Arrival', scene: 'flyby', body: 'jupiter', date: 'Dec 3, 1973', title: 'Jupiter up close', highlight: 'First spacecraft at Jupiter',
        text: "I became the first spacecraft to fly past Jupiter. Its radiation was far stronger than expected and nearly fried my electronics, but I sent home the first close-up pictures of the giant planet." },
      { phase: 'Discovery', scene: 'stage', act: 'idle', cam: [10, 85, 0.9], title: 'A message on board',
        text: "Bolted to me is a gold-coated plaque showing a man and a woman, a map of our Sun's position using pulsars, and a drawing of our solar system with my path. A greeting, in case anyone ever finds me." },
      { phase: 'Legacy', scene: 'flyby', body: 'jupiter', title: 'Opening the way',
        text: "Because of us, Voyager 1 and 2 knew they could cross the asteroid belt and survive Jupiter's radiation. My twin Pioneer 11 used Jupiter's gravity to swing on to Saturn in 1979, the first visit there." },
      { phase: 'Today', scene: 'stage', act: 'drift', cam: C4, date: 'Jan 23, 2003', title: 'Drifting to the stars',
        text: "My nuclear power slowly faded. Earth heard my last faint signal on January 23, 2003. I am drifting toward the star Aldebaran and will pass it in about 2 million years." },
    ],
  },

  near: {
    rocket: 'delta2', rocketName: 'Delta II', site: 'Cape Canaveral, Florida', craft: 'self', dest: 'eros',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Feb 17, 1996', title: 'First of a new kind',
        text: "February 17, 1996. A Delta II launched me from Cape Canaveral. I was the first mission of NASA's Discovery Program: smaller, faster, cheaper. My target was asteroid 433 Eros." },
      { phase: 'Cruise', scene: 'cruise', date: '1996 to 1998', title: 'A detour past Mathilde',
        text: "In June 1997 I flew past asteroid Mathilde, a dark rock so light it must be full of holes. Then I swung back past Earth for a gravity boost toward Eros." },
      { phase: 'Arrival', scene: 'orbit', body: 'eros', date: 'Feb 14, 2000', title: 'Missed, then made it', highlight: 'First spacecraft to orbit an asteroid',
        text: "In December 1998 my engine shut down early during the burn to enter orbit and I flew right past Eros. The team regrouped, and on Valentine's Day 2000 I became the first spacecraft to orbit an asteroid." },
      { phase: 'Discovery', scene: 'orbit', body: 'eros', title: 'Mapping a rock',
        text: "For a year I circled Eros, a potato-shaped rock about 34 km long, measuring its shape, gravity and chemistry. It is one solid, ancient piece of the early solar system covered in boulders and dust." },
      { phase: 'Mission', scene: 'stage', act: 'land', cam: C2, date: 'Feb 12, 2001', title: 'A bonus landing', highlight: 'First landing on an asteroid',
        text: "I was never built to land. But the team tried a slow descent anyway, and I touched down at about 6 km/h. I still worked! My gamma-ray sensor read the ground for two more weeks." },
      { phase: 'Legacy', scene: 'stage', act: 'idle', cam: C3, title: 'Asteroid explorers',
        text: "What I learned helped plan later missions that touched asteroids and brought samples home, like Japan's Hayabusa and NASA's OSIRIS-REx." },
      { phase: 'Today', scene: 'stage', act: 'rest', cam: C4, date: 'Feb 28, 2001', title: 'Where I am now',
        text: "My last contact was February 28, 2001. I still sit on Eros, riding along as it loops around the Sun, sometimes passing closer to Earth than Mars ever does." },
    ],
  },

  dawn: {
    rocket: 'delta2h', rocketName: 'Delta II Heavy', site: 'Cape Canaveral, Florida', craft: 'self', dest: 'ceres',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Sep 27, 2007', title: 'A two-world mission',
        text: "September 27, 2007. A Delta II Heavy launched me on a mission no spacecraft had tried: orbit one world beyond Earth, leave it, and orbit another." },
      { phase: 'Cruise', scene: 'cruise', date: '2007 to 2011', title: 'The patient engine',
        text: "My ion engines push with the force of a sheet of paper resting on your hand. Tiny, but they can run for years. In 2009 I swung past Mars for a boost. Over time that gentle push added up to more speed change than any spacecraft before me." },
      { phase: 'Arrival', scene: 'orbit', body: 'vesta', date: 'Jul 2011', title: 'Vesta', highlight: 'A peak more than twice as tall as Everest',
        text: "I arrived at giant asteroid Vesta and found a huge crater at its south pole with a central peak about 22 km high, more than twice as tall as Mount Everest. Many meteorites found on Earth were blasted from that impact." },
      { phase: 'Discovery', scene: 'orbit', body: 'ceres', date: 'Mar 2015', title: 'Ceres and the bright spots', highlight: 'Bright spots: salt left by brine',
        text: "Then I left Vesta and spiraled to dwarf planet Ceres. I spotted dazzling bright spots in Occator crater. They are salt deposits left by salty water seeping up from below." },
      { phase: 'Legacy', scene: 'orbit', body: 'ceres', title: 'Leftovers from planet building', highlight: 'First to orbit two worlds beyond Earth',
        text: "Vesta and Ceres are leftovers from when planets formed. Studying both showed how water and heat shaped baby planets, and that Ceres may still hide salty liquid deep inside." },
      { phase: 'Today', scene: 'stage', act: 'coast', cam: C4, date: 'Nov 1, 2018', title: 'Silent orbit',
        text: "I ran out of the fuel that pointed my antenna and fell silent on November 1, 2018. I was left in a high orbit so I would not crash into Ceres for decades, keeping its surface clean for future explorers." },
    ],
  },

  kepler: {
    rocket: 'delta2', rocketName: 'Delta II', site: 'Cape Canaveral, Florida', craft: 'self', dest: 'sun',
    beats: [
      { phase: 'Launch', scene: 'launch', date: 'Mar 6, 2009', title: 'Planet hunter',
        text: "March 6, 2009. A Delta II launched me into the night sky from Cape Canaveral. I carried the biggest camera NASA had sent to space at the time, built from 42 light sensors." },
      { phase: 'Cruise', scene: 'cruise', date: '2009', title: 'Trailing the Earth',
        text: "Instead of circling Earth, I followed it around the Sun, slowly drifting behind. Far from Earth's glare, I could stare at the same stars without interruption." },
      { phase: 'Mission', scene: 'transit', title: 'Watching for blinks', highlight: '~150,000 stars watched at once',
        text: "I watched about 150,000 stars at once. When a planet passes in front of its star, the star dims a tiny bit. Watch the light curve: that little dip is a planet." },
      { phase: 'Discovery', scene: 'transit', title: 'Planets everywhere', highlight: '2,600+ planets confirmed',
        text: "Before me, we knew a few hundred planets around other stars. I found more than 2,600. Most stars have planets, and many may have Earth-sized worlds where liquid water could exist." },
      { phase: 'Mission', scene: 'stage', act: 'sunlight', cam: C3, date: '2013', title: 'Balancing on sunlight',
        text: "In 2013 two of my four reaction wheels failed and I could not point steadily. Engineers balanced me using the gentle pressure of sunlight. My second life, called K2, kept finding planets for years." },
      { phase: 'Legacy', scene: 'transit', title: 'We are not rare',
        text: "Thanks to my data we now think there are more planets than stars in our galaxy. TESS and the James Webb Space Telescope now study the worlds I helped find." },
      { phase: 'Today', scene: 'stage', act: 'drift', cam: C4, date: 'Oct 30, 2018', title: 'Retired',
        text: "I ran out of fuel and was retired on October 30, 2018. I orbit the Sun, slowly falling behind Earth. Scientists are still finding new planets in my data." },
    ],
  },
}
