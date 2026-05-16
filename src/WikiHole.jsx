import { useState, useEffect, useRef, useCallback } from "react";

const SEED_ARTICLES = {
  // ── Original seeds ───────────────────────────────────────────────────────
  "tunguska event": { title:"Tunguska event", description:"1908 explosion over Siberia, Russia", extract:"On the morning of June 30, 1908, an enormous explosion flattened around 2,000 square kilometres of Siberian forest near the Tunguska River — the largest impact event in recorded human history. The blast, estimated at 10–15 megatons, was caused by a small asteroid or comet that disintegrated in the atmosphere before reaching the ground, leaving no crater. Witnesses reported a column of bluish light nearly as bright as the sun, followed by a shockwave that knocked people off their feet hundreds of miles away.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Tunguska_event_1.jpg/320px-Tunguska_event_1.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Tunguska_event", links:[{title:"Chelyabinsk meteor",description:"2013 Russian meteor airburst injuring 1,500 people"},{title:"Asteroid impact avoidance",description:"Methods to prevent catastrophic asteroid strikes"},{title:"Comet Shoemaker–Levy 9",description:"Comet that visibly collided with Jupiter in 1994"}] },
  "voynich manuscript": { title:"Voynich manuscript", description:"Mysterious illustrated 15th-century codex", extract:"The Voynich manuscript is a hand-written, illustrated book created in the early 15th century, composed in an unknown writing system that has defied decryption for over a century. Its pages depict fantastical plants that match no known species, naked figures bathing in green liquid, astronomical diagrams — all annotated in a flowing script no linguist or cryptographer has ever convincingly decoded. Whether it is an elaborate hoax, a lost language, or an encoded cipher remains one of history's most tantalising unsolved puzzles.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Voynich_manuscript_bathing_section_example.jpg/320px-Voynich_manuscript_bathing_section_example.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Voynich_manuscript", links:[{title:"Codex Seraphinianus",description:"Modern encyclopedia written in an invented language"},{title:"Linear A",description:"Undeciphered Bronze Age Minoan writing system"},{title:"Rohonc Codex",description:"Another mysterious undeciphered illustrated manuscript"}] },
  "dyatlov pass incident": { title:"Dyatlov Pass incident", description:"1959 deaths of nine Soviet ski hikers in the Urals", extract:"In February 1959, nine experienced Soviet ski hikers died mysteriously in the northern Ural Mountains under circumstances investigators described as 'a compelling unknown force.' The group's tent was ripped open from the inside; hikers fled into −30°C night in bare feet. Some bodies showed severe internal trauma with no external wounds, while one hiker's tongue was missing. The Soviet government classified the findings, fuelling decades of speculation.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Dyatlov-pass-img1.jpg/320px-Dyatlov-pass-img1.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Dyatlov_Pass_incident", links:[{title:"Kholat Syakhl",description:"The mountain where it occurred, meaning 'Dead Mountain' in Mansi"},{title:"Soviet secret cities",description:"Classified cities built for nuclear and military research"},{title:"Infrasound",description:"Low-frequency sound that can cause anxiety and hallucinations"}] },
  "mary celeste": { title:"Mary Celeste", description:"American ghost ship found abandoned in 1872", extract:"The Mary Celeste was discovered adrift in the Atlantic in December 1872, cargo intact, six-month food supply aboard, crew's belongings untouched — but not a soul on board. The only lifeboat was missing, suggesting the ten people aboard had abandoned ship in a hurry. There was no sign of violence, the ship was seaworthy, and the last log entry showed nothing unusual. The fate of the passengers and crew has never been definitively explained.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Mary_Celeste_painting.jpg/320px-Mary_Celeste_painting.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Mary_Celeste", links:[{title:"Flying Dutchman",description:"Legendary ghost ship condemned to sail forever"},{title:"Arthur Conan Doyle",description:"Author who wrote a fictionalised account of the Mary Celeste"},{title:"Bermuda Triangle",description:"Region associated with mysterious disappearances"}] },
  "dancing plague of 1518": { title:"Dancing plague of 1518", description:"Mass hysteria in Strasbourg where people danced uncontrollably", extract:"In July 1518, a woman stepped into a street in Strasbourg and began to dance — and couldn't stop. Within a month, around 400 people were dancing day and night, unable to control themselves. Authorities hired musicians to keep the dancers moving, believing they'd tire out. Instead, dozens reportedly died from exhaustion and heart attacks. Historians now believe it was mass psychogenic illness triggered by extreme stress and famine.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Chorea_sancti_viti_mg_0050.jpg/320px-Chorea_sancti_viti_mg_0050.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Dancing_plague_of_1518", links:[{title:"Mass psychogenic illness",description:"Collective spread of illness symptoms with no physical cause"},{title:"St. Vitus",description:"Patron saint invoked against the dancing plague"},{title:"Ergotism",description:"Poisoning from ergot fungus linked to strange historical behaviour"}] },
  "antikythera mechanism": { title:"Antikythera mechanism", description:"Ancient Greek analogue computer for astronomical calculations", extract:"The Antikythera mechanism is a 2,100-year-old Greek analogue computer, recovered from a Roman-era shipwreck in 1901, that could predict solar and lunar eclipses, track planet positions, and calculate the timing of the ancient Olympics. Built from at least 30 interlocking bronze gears, it represents a level of mechanical sophistication not seen again for over a thousand years. Its existence rewrites assumptions about ancient Greek technology.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/NAMA_Machine_d%27Anticyth%C3%A8re_1.jpg/320px-NAMA_Machine_d%27Anticyth%C3%A8re_1.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Antikythera_mechanism", links:[{title:"Antikythera shipwreck",description:"Roman-era wreck that yielded the mechanism and Greek bronze statues"},{title:"Orrery",description:"Mechanical clockwork model of the solar system"},{title:"Hero of Alexandria",description:"Ancient Greek engineer who built steam-powered automata"}] },
  "fermi paradox": { title:"Fermi paradox", description:"Contradiction between probability of alien life and lack of evidence", extract:"The Fermi paradox is the apparent contradiction between high probability estimates for extraterrestrial civilisations and the total lack of evidence for them. Physicist Enrico Fermi asked in 1950: 'Where is everybody?' Given the age of the universe, intelligent life should have had billions of years to spread across the galaxy — yet we detect nothing. Proposed explanations range from a universal 'Great Filter' to the unsettling possibility that we are genuinely alone.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Fermi_paradox", links:[{title:"Great Filter",description:"Hypothetical barrier that prevents civilisations from becoming interstellar"},{title:"Drake equation",description:"Formula estimating communicating extraterrestrial civilisations"},{title:"Zoo hypothesis",description:"Theory that aliens deliberately avoid contact with humanity"}] },
  "roanoke colony": { title:"Roanoke Colony", description:"16th-century English settlement that mysteriously vanished", extract:"The Roanoke Colony was the first English attempt at a permanent North American settlement, founded in 1585. When supply ships returned in 1590 after a three-year delay, all 115 colonists had vanished with no sign of struggle. The only clue was 'CROATOAN' carved into a post. The fate of the colonists — including Virginia Dare, the first English child born in the Americas — has never been conclusively determined.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Roanoke_Colony", links:[{title:"Virginia Dare",description:"First English child born in the Americas"},{title:"Walter Raleigh",description:"English explorer who sponsored the Roanoke expeditions"},{title:"Lost Colony DNA Project",description:"Genetic research to trace descendants of the Roanoke colonists"}] },
  "cicada 3301": { title:"Cicada 3301", description:"Mysterious organisation posting cryptographic internet puzzles", extract:"Cicada 3301 is a nickname given to an enigmatic organisation that posted extraordinarily complex cryptographic puzzles online beginning in January 2012. The puzzles spanned steganography, ancient book references, physical locations worldwide, and layers of encryption that took expert teams weeks to solve. Each puzzle led to the next, and those who reached the end were never heard from publicly again — fuelling speculation it's an intelligence agency, think tank, or elaborate art project.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Cicada_3301", links:[{title:"Steganography",description:"Practice of hiding secret messages within ordinary-looking files"},{title:"One-time pad",description:"Theoretically unbreakable encryption method"},{title:"ARG (alternate reality game)",description:"Interactive networked narrative using real-world clues"}] },
  "numbers station": { title:"Numbers station", description:"Shortwave radio stations broadcasting coded messages", extract:"Numbers stations are shortwave radio stations that broadcast formatted numbers or words read by a robotic voice — and no one officially admits to running them. Intelligence agencies are widely believed to operate them to communicate with field agents: a spy tunes in at a set time, hears their personal code, and decodes a one-time pad message that is mathematically unbreakable. These broadcasts have been heard since World War I, and many are still active today.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Numbers_station", links:[{title:"The Conet Project",description:"Archive of recorded numbers station broadcasts"},{title:"Shortwave radio",description:"Radio waves that travel globally by reflecting off the ionosphere"},{title:"UVB-76",description:"Mysterious Russian shortwave station broadcasting since 1976"}] },
  "black dahlia": { title:"Black Dahlia", description:"Unsolved 1947 murder of Elizabeth Short in Los Angeles", extract:"On January 15, 1947, the body of 22-year-old Elizabeth Short was found in a Los Angeles vacant lot, severed at the waist, completely drained of blood, and posed with surgical precision. Despite over 150 suspects investigated and dozens of false confessions, no one was ever charged. The surgical nature of the wounds has long suggested medical knowledge, and the deliberate staging implied someone who wanted the crime witnessed. It remains an open LAPD case.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Black_Dahlia", links:[{title:"Zodiac Killer",description:"Unidentified serial killer active in Northern California 1968–1969"},{title:"Los Angeles in the 1940s",description:"The city's postwar noir era of crime and glamour"},{title:"LAPD cold cases",description:"Unsolved historic cases still under investigation"}] },
  "mothman": { title:"Mothman", description:"Cryptid reportedly sighted in West Virginia in 1966–1967", extract:"The Mothman is a creature reported by over 100 witnesses in Point Pleasant, West Virginia between 1966 and 1967 — described as a large, man-shaped entity with enormous wings and glowing red eyes. The sightings were accompanied by UFO activity and poltergeist phenomena, and ended abruptly on December 15, 1967, the night the Silver Bridge collapsed killing 46 people — leading many to see the Mothman as a harbinger of disaster.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Mothman", links:[{title:"Silver Bridge collapse",description:"1967 West Virginia bridge disaster that killed 46 people"},{title:"John Keel",description:"Journalist who investigated and documented the Mothman sightings"},{title:"Point Pleasant, West Virginia",description:"Town that holds an annual Mothman Festival"}] },
  "taos hum": { title:"Taos Hum", description:"Persistent unexplained low-frequency sound in New Mexico", extract:"The Taos Hum is a persistent, invasive low-frequency noise heard by a small percentage of people in and around Taos, New Mexico — and its source has never been identified. Sufferers describe it as a diesel engine idling in the distance that never stops, often louder indoors, sometimes strong enough to cause nausea and sleep disruption. A 1997 Congressional investigation found no explanation. Theories range from military communications to spontaneous inner-ear emissions.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Taos_Hum", links:[{title:"The Hum",description:"Phenomenon of unexplained low-frequency noise reported worldwide"},{title:"HAARP",description:"High-frequency radio research programme"},{title:"Infrasound",description:"Sound below 20Hz — inaudible but physically felt"}] },
  "d. b. cooper": { title:"D. B. Cooper", description:"Unidentified hijacker who parachuted from a plane with $200,000", extract:"On November 24, 1971, a man using the alias Dan Cooper hijacked a Northwest Orient flight, extorted $200,000 in ransom, and parachuted from the rear of the aircraft into the Pacific Northwest night — never to be found. He is the only unsolved case of air piracy in commercial aviation history. A bundle of degraded ransom bills appeared on a Columbia River bank in 1980, but the man himself was never identified. The FBI suspended active investigation in 2016.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/D.B._Cooper_Sketch.jpg/240px-D.B._Cooper_Sketch.jpg", wikiUrl:"https://en.wikipedia.org/wiki/D._B._Cooper", links:[{title:"Skyjacking",description:"History of aircraft hijacking and countermeasures"},{title:"Northwest Orient Airlines",description:"The airline Cooper hijacked, later merged with Delta"},{title:"Frank Abagnale",description:"Con artist who inspired 'Catch Me If You Can'"}] },

  // ── Cryptids ─────────────────────────────────────────────────────────────
  "bigfoot": { title:"Bigfoot", description:"Legendary ape-like creature of North American wilderness", extract:"Bigfoot, also called Sasquatch, is a large, hairy, bipedal creature said to inhabit the forests of North America — one of the most recognised figures in cryptozoology. Thousands of sightings have been reported since the 19th century, and alleged footprints measuring up to 24 inches have been cast and studied. The most famous piece of evidence is the 1967 Patterson–Gimlin film, a short clip of a large, upright figure striding through a California forest that has never been conclusively proven a hoax. Mainstream science remains sceptical, attributing sightings to misidentification, folklore, and hoax.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Patterson%E2%80%93Gimlin_film_frame_352.jpg/240px-Patterson%E2%80%93Gimlin_film_frame_352.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Bigfoot", links:[{title:"Patterson–Gimlin film",description:"Famous 1967 footage allegedly showing Bigfoot"},{title:"Yeti",description:"Himalayan equivalent of Bigfoot, the 'Abominable Snowman'"},{title:"Cryptozoology",description:"Study of animals whose existence has not been proven"}] },
  "loch ness monster": { title:"Loch Ness Monster", description:"Legendary creature said to inhabit Loch Ness in Scotland", extract:"The Loch Ness Monster, affectionately known as 'Nessie,' is a cryptid allegedly inhabiting Loch Ness, a deep freshwater lake in the Scottish Highlands. Modern interest began in 1933 after a newspaper report described a couple witnessing 'an enormous animal rolling and plunging' on the lake's surface. The famous 1934 'Surgeon's Photograph' showing a long-necked creature was later revealed as a hoax using a toy submarine. DNA surveys of the loch in 2018 found no evidence of large reptiles, though the legend continues to draw over 500,000 tourists annually.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Loch_Ness_topographic_map-en.svg/320px-Loch_Ness_topographic_map-en.svg.png", wikiUrl:"https://en.wikipedia.org/wiki/Loch_Ness_Monster", links:[{title:"Plesiosauria",description:"Extinct marine reptiles often cited as a Nessie explanation"},{title:"Loch Ness",description:"The deep Scottish lake where sightings are reported"},{title:"Cryptid",description:"Animals rumoured to exist but unrecognised by science"}] },
  "chupacabra": { title:"Chupacabra", description:"Legendary blood-sucking creature of the Americas", extract:"The chupacabra — Spanish for 'goat-sucker' — is a legendary creature said to attack and drain the blood of livestock, particularly goats. Reports first emerged in Puerto Rico in 1995 following a wave of mysterious animal deaths with puncture wounds and drained blood. Two distinct descriptions have emerged: a reptilian bipedal creature with spines, and a hairless canine with a pronounced spinal ridge. Biologists who have examined alleged chupacabra carcasses have consistently identified them as coyotes, dogs, or other known animals suffering from mange.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Chupacabra", links:[{title:"Moca Vampire",description:"1975 Puerto Rico animal mutilation wave that preceded chupacabra reports"},{title:"Cattle mutilation",description:"Mysterious deaths of livestock with unusual injuries"},{title:"Mass hysteria",description:"How social panic can spread and generate eyewitness reports"}] },
  "jersey devil": { title:"Jersey Devil", description:"Legendary creature said to inhabit the Pine Barrens of New Jersey", extract:"The Jersey Devil is a legendary creature said to inhabit the Pine Barrens of southern New Jersey, described most commonly as a kangaroo-like biped with bat wings, a horse's head, and a forked tail. The legend dates to 1735, traditionally attributed to a woman named Mother Leeds who cursed her 13th child during a difficult birth. A major 'flap' of sightings in January 1909 caused widespread panic across the region, with schools closed and factories shuttered. It remains New Jersey's official state demon and a popular piece of American folklore.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Jersey_Devil", links:[{title:"Pine Barrens (New Jersey)",description:"The vast, mysterious forested region that is the Devil's alleged home"},{title:"1909 Jersey Devil panic",description:"The week of mass sightings that gripped the region"},{title:"Folklore of the United States",description:"Regional legends and mythical creatures across America"}] },
  "flatwoods monster": { title:"Flatwoods Monster", description:"1952 UFO-linked entity sighting in West Virginia", extract:"The Flatwoods Monster, also called the Braxton County Monster, was a creature allegedly encountered on September 12, 1952, in Flatwoods, West Virginia, by a group of locals who had gone to investigate a bright object they saw falling from the sky. They reported a 10-foot-tall figure with a spade-shaped head, glowing eyes, and a dark body that floated rather than walked, accompanied by a hissing sound and a sickening smell that caused nausea and burning sensations. The encounter lasted only seconds before the figure retreated into the darkness. Investigators later suggested a barn owl perched in a tree combined with misperception of the atmospheric conditions.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Flatwoods_Monster", links:[{title:"1952 Washington D.C. UFO incident",description:"Mass UFO sightings over the US capital in the same year"},{title:"Hopkinsville Goblins case",description:"1955 Kentucky encounter with small alien-like beings"},{title:"Close encounter",description:"Classification system for UFO and alien contact events"}] },
  "dover demon": { title:"Dover Demon", description:"Mysterious creature sighted in Dover, Massachusetts in 1977", extract:"The Dover Demon is a creature reportedly seen by four teenagers in Dover, Massachusetts over two nights in April 1977. Witnesses described a pale, hairless, spindly-limbed figure with a large, watermelon-shaped head, glowing orange or green eyes, and long fingers — standing only about four feet tall. No tracks were found and no further sightings occurred, yet the case attracted serious attention from paranormal investigators. Its origin remains unexplained, with theories ranging from a young moose calf to an extraterrestrial visitor.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Dover_Demon", links:[{title:"Cryptid",description:"Animals rumoured to exist but unrecognised by science"},{title:"New England folklore",description:"Legends and strange tales from the northeastern United States"},{title:"Alien abduction",description:"Reports of humans taken by extraterrestrial beings"}] },
  "skunk ape": { title:"Skunk Ape", description:"Bigfoot-like primate reported in the southeastern United States", extract:"The Skunk Ape is a hominid cryptid reportedly inhabiting the swamps and forests of the southeastern United States, particularly Florida — named for the powerful, rotten odour witnesses consistently describe. Reports date back decades, but the creature received widespread attention in 2000 when an anonymous woman sent two photographs to the Sarasota County Sheriff's Department showing what appeared to be a large, red-haired ape peering through vegetation behind her home. The Florida Fish and Wildlife Commission investigated and found no evidence, and most researchers believe the photos show an escaped orangutan.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Skunk_ape", links:[{title:"Bigfoot",description:"The North American equivalent creature of the Pacific Northwest"},{title:"Myakka City photographs",description:"The famous 2000 images submitted to police"},{title:"Florida folklore",description:"Legends and strange tales from the Sunshine State"}] },
  "thunderbird": { title:"Thunderbird (cryptozoology)", description:"Giant bird-like cryptid of North American lore", extract:"The Thunderbird is a term used in cryptozoology to describe enormous flying creatures reported in North America, distinct from the supernatural Thunderbird of Indigenous mythology. Reports describe birds with wingspans of 15 to 20 feet capable of carrying off large animals, and even children. The most dramatic modern account — a 1977 Illinois incident in which a large bird allegedly attempted to carry off a 10-year-old boy — was reported by multiple witnesses. Some researchers suggest surviving populations of Argentavis magnificens, an extinct condor-like bird with a 23-foot wingspan, could explain the sightings.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Thunderbird_(cryptozoology)", links:[{title:"Thunderbird (mythology)",description:"Sacred bird of power in many Indigenous North American traditions"},{title:"Argentavis",description:"Extinct giant condor with the largest wingspan of any known bird"},{title:"Giant animals in folklore",description:"How oral traditions preserve memories of real prehistoric megafauna"}] },
  "beast of gévaudan": { title:"Beast of Gévaudan", description:"18th-century French creature responsible for a wave of fatal attacks", extract:"The Beast of Gévaudan was a large carnivorous animal responsible for a series of fatal attacks in the Auvergne and Margeride regions of south-central France between 1764 and 1767. The creature killed between 60 and 100 people, preferring to target the face and throat, and terrorised the region for three years despite organised hunts involving thousands of men and the personal attention of King Louis XV. An enormous wolf was eventually shot in 1767 and the attacks ceased, but its unusual size and behaviour have kept debate alive for centuries — with theories ranging from a hyena to a lion to a prehistoric survivor.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/La_bete_du_gevaudan_1764.jpg/320px-La_bete_du_gevaudan_1764.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Beast_of_G%C3%A9vaudan", links:[{title:"Gévaudan",description:"The remote French region where the attacks occurred"},{title:"Jean Chastel",description:"The hunter who allegedly shot and killed the Beast"},{title:"Historical European wolf attacks",description:"Documented cases of wolf predation on humans in Europe"}] },
  "owlman": { title:"Owlman", description:"Winged humanoid creature sighted near Mawnan, Cornwall", extract:"The Owlman, also called the Owlman of Mawnan, is a creature allegedly seen near the church of Mawnan Smith in Cornwall, England, beginning in April 1976. Witnesses — mostly young women and children — described a large, grey, owl-like humanoid that hovered above the church tower with pointed ears, glowing red eyes, and black pincer-like claws. Further sightings were reported in 1978 and 1995. Paranormal researcher Tony 'Doc' Shiels collected the original reports, leading some sceptics to question whether the incidents were a hoax — but no definitive explanation has been offered.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Owlman", links:[{title:"Mothman",description:"Similar winged humanoid reported in West Virginia"},{title:"Mawnan Smith",description:"The small Cornish village at the centre of the sightings"},{title:"Cornish folklore",description:"The rich tradition of legends and mysteries from Cornwall"}] },

  // ── Sea Creatures ────────────────────────────────────────────────────────
  "kraken": { title:"Kraken", description:"Legendary giant sea monster of Scandinavian folklore", extract:"The Kraken is a legendary sea monster of enormous size said to dwell off the coasts of Norway and Greenland, first described in detail by Norwegian author Erik Pontoppidan in 1752 as a creature so large it was sometimes mistaken for an island. Sailors described it rising from the depths to drag ships under with its vast tentacles. The legend is now widely accepted to have been inspired by real encounters with giant squid — animals that can reach 43 feet in length and were unknown to science until the 19th century. The word 'kraken' remains in scientific nomenclature in the genus name Architeuthis.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Colossal_octopus_by_Pierre_Denys_de_Montfort.jpg/240px-Colossal_octopus_by_Pierre_Denys_de_Montfort.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Kraken", links:[{title:"Giant squid",description:"Real deep-sea cephalopod that likely inspired the Kraken legend"},{title:"Architeuthis",description:"The scientific genus of the giant squid"},{title:"Sea monster",description:"Legendary creatures of the ocean across cultures worldwide"}] },
  "megalodon": { title:"Megalodon", description:"Extinct giant shark, the largest fish to ever live", extract:"Megalodon was an extinct species of giant shark that lived approximately 23 to 3.6 million years ago, reaching an estimated length of 50–60 feet — making it the largest fish to ever live. Known almost entirely from fossil teeth up to 7 inches long, it is believed to have been an apex predator that hunted large whales. A persistent modern legend holds that megalodon may still survive in the deep ocean, fuelled by occasional large, unworn teeth found in seafloor sediments. The scientific consensus is that megalodon is definitively extinct, as its whale prey remain common and visible near the surface.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Megalodon_scale.svg/320px-Megalodon_scale.svg.png", wikiUrl:"https://en.wikipedia.org/wiki/Megalodon", links:[{title:"Lamniformes",description:"The order of sharks that includes Megalodon and the great white"},{title:"Deep sea",description:"The vast unexplored zone below 200 metres where undiscovered life may exist"},{title:"Coelacanth",description:"'Living fossil' fish thought extinct for 65 million years until 1938"}] },
  "sea serpent": { title:"Sea serpent", description:"Legendary enormous snake-like creature of the ocean", extract:"Sea serpents are large snake-like creatures that have been reported by sailors across cultures for thousands of years — from ancient Mesopotamian mythology to medieval European maps marked 'here be dragons.' Hundreds of sightings were reported in the 18th and 19th centuries by credible witnesses including naval officers and scientists, often describing an animal 50–100 feet long with a series of humps visible above the surface. Modern cryptozoologists speculate candidates including giant oarfish, basking sharks, and undiscovered species of large eel. No confirmed specimen has ever been captured.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Sea_serpent_Olaus_Magnus_1555.jpg/320px-Sea_serpent_Olaus_Magnus_1555.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Sea_serpent", links:[{title:"Oarfish",description:"The world's longest bony fish, often proposed as a sea serpent explanation"},{title:"Cadborosaurus",description:"Alleged sea serpent of the Pacific coast of North America"},{title:"Leviathan",description:"Monstrous sea creature from biblical and ancient Near Eastern mythology"}] },
  "lusca": { title:"Lusca", description:"Legendary half-shark half-octopus creature of the Caribbean", extract:"The Lusca is a legendary sea creature of Caribbean folklore, said to inhabit the deep underwater caves and blue holes of the Bahamas. Described as a massive half-shark, half-octopus hybrid up to 75 feet in length, it is blamed for the mysterious drowning deaths and disappearances that occur in the region's treacherous underwater passages. Blue holes — vertical underwater caves that plunge hundreds of feet into the seafloor — create powerful tidal suction currents that can trap divers, and some researchers believe sightings of the Lusca may describe encounters with giant octopuses drawn to these rich ecosystems.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Lusca", links:[{title:"Blue hole",description:"Deep underwater sinkholes that dot the Bahamas and Caribbean"},{title:"Giant Pacific octopus",description:"The largest confirmed octopus species, reaching 16 feet"},{title:"Caribbean folklore",description:"The rich tradition of mythological creatures from the islands"}] },
  "bunyip": { title:"Bunyip", description:"Legendary creature of Australian Aboriginal mythology", extract:"The bunyip is a large mythical creature in Aboriginal Australian folklore said to lurk in swamps, creeks, riverbeds, and waterholes. Early European settlers recorded Aboriginal descriptions of a fearsome water-dwelling monster, and in the 1840s and 50s a wave of alleged bunyip sightings and mysterious bone discoveries gripped the Australian press. Proposed identities include the Diprotodon — a giant extinct wombat-like marsupial that died out around 25,000 years ago — with some researchers suggesting Aboriginal oral traditions may preserve genuine cultural memory of megafauna that once shared the continent.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Bunyip", links:[{title:"Diprotodon",description:"Giant extinct marsupial that may have inspired the bunyip legend"},{title:"Australian Aboriginal mythology",description:"The rich cosmological traditions of Australia's first peoples"},{title:"Megafauna of Australia",description:"The giant prehistoric animals that roamed Australia and then vanished"}] },

  // ── Paranormal Entities ──────────────────────────────────────────────────
  "shadow people": { title:"Shadow people", description:"Paranormal dark shadow-like figures seen in peripheral vision", extract:"Shadow people are a paranormal phenomenon in which witnesses perceive dark, shadow-like figures in human form — typically seen in peripheral vision, in a darkened room, or at the edge of sleep. Reports are strikingly consistent across cultures and centuries: a featureless, completely black humanoid silhouette that moves with unnatural speed and disappears the moment it is directly observed. Sleep researchers have linked many accounts to hypnagogic hallucinations occurring during the transition between wakefulness and sleep, while paranormal investigators classify them as a distinct category of entity separate from traditional ghosts.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Shadow_person", links:[{title:"Sleep paralysis",description:"Condition where waking sleepers experience hallucinations and immobility"},{title:"Hat Man",description:"A specific recurring shadow person figure wearing a wide-brimmed hat"},{title:"Hypnagogia",description:"The hallucinatory state at the threshold of sleep"}] },
  "men in black": { title:"Men in Black", description:"Mysterious suited figures who allegedly silence UFO witnesses", extract:"Men in Black (MIB) are alleged government agents or mysterious strangers who visit and intimidate UFO witnesses, claiming to be from official agencies and demanding silence about what was seen. Reports began in the early 1950s, initiated by UFO researcher Albert Bender who claimed three 'sinister men in dark suits' had visited and threatened him into shutting down his organisation. The figures are consistently described as oddly pale or robotic, wearing perfectly pressed black suits, driving black Cadillacs, and possessing intimate knowledge of sightings before they are reported — leading some researchers to conclude they are not human at all.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Men_in_black_(conspiracy_theory)", links:[{title:"Albert Bender",description:"The UFO researcher whose MIB encounter started the modern phenomenon"},{title:"Government UFO programs",description:"Documented secret programmes investigating unidentified aerial phenomena"},{title:"Black helicopter",description:"Another staple of government surveillance conspiracy theories"}] },
  "spring heeled jack": { title:"Spring Heeled Jack", description:"Victorian-era leaping devil figure that terrorised England", extract:"Spring Heeled Jack was a mysterious figure in Victorian England said to be capable of extraordinary leaps, breathing blue and white flames, and possessing clawed hands and glowing red eyes. The legend began in 1837 when attacks on women in London were attributed to a strange leaping figure, and sightings spread across England for decades — reportedly witnessed by hundreds of people including police officers and military personnel. Whether a specific individual in a bizarre costume, a collective urban legend, or something stranger, Spring Heeled Jack became one of the defining mysterious figures of the Victorian era and an early archetype for the superhuman villain.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Spring_heeled_Jack_1_The_Terror_of_London.jpg/240px-Spring_heeled_Jack_1_The_Terror_of_London.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Spring_Heeled_Jack", links:[{title:"Victorian occultism",description:"The explosion of spiritualism and supernatural belief in the 19th century"},{title:"Jack the Ripper",description:"The unidentified serial killer who terrorised London in 1888"},{title:"Penny dreadful",description:"The cheap Victorian horror serials that spread and sensationalised such legends"}] },
  "black-eyed children": { title:"Black-eyed children", description:"Urban legend about eerie children with completely black eyes", extract:"Black-eyed children (or BEKs — black-eyed kids) are an urban legend and reported paranormal phenomenon describing pale children or teenagers who appear at doors or car windows late at night, asking to be let in or given a ride. The defining feature is their eyes: described as completely black, with no visible iris or white. The legend traces primarily to a 1996 account by journalist Brian Bethel, who described two boys whose insistent, hypnotic requests he barely resisted. Reports surged after internet forums spread the story, with consistent details — the children's odd speech patterns, the overpowering feeling of dread, and the absolute insistence that they must be invited in.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Black-eyed_children", links:[{title:"Brian Bethel",description:"The journalist whose account launched the modern BEK phenomenon"},{title:"Urban legend",description:"How modern folklore spreads and evolves through shared storytelling"},{title:"Creepypasta",description:"Internet horror stories that blur the line between fiction and reported fact"}] },
  "slender man": { title:"Slender Man", description:"Fictional internet-born horror character that became real folklore", extract:"Slender Man is a fictional horror character originating in a 2009 Something Awful forum thread by Eric Knudsen, depicted as an unnaturally tall, thin figure in a black suit with no face and long, grasping arms — often found lurking near children. Within years, Slender Man had transcended his fictional origins to be reported as a genuine paranormal entity by thousands of people worldwide who believed in his literal existence. In 2014, two 12-year-old girls in Wisconsin stabbed a classmate 19 times, telling police they did it to appease Slender Man. The case became a landmark study in how internet folklore can become dangerously real.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Slender_Man", links:[{title:"Creepypasta",description:"Internet horror stories and the communities that create them"},{title:"2014 Slender Man stabbing",description:"The Wisconsin attack that showed the real-world power of internet folklore"},{title:"Tulpa",description:"The concept of a thought-form given reality through collective belief"}] },

  // ── Mythological but widely reported ─────────────────────────────────────
  "kappa (folklore)": { title:"Kappa (folklore)", description:"Japanese water demon that drags victims into rivers", extract:"The kappa is a water creature from Japanese folklore said to inhabit rivers, ponds, and lakes — depicted as a humanoid with a turtle's shell, scaly skin, a beak, and a water-filled dish on top of its head that is the source of its supernatural power. Kappa are said to drag horses, cattle, and humans into the water to drown them, have a particular fondness for cucumbers, and can be repelled by bowing — which causes them to bow back and spill the water from their head-dish, rendering them helpless. Despite being categorised as supernatural, the Kappa is listed as a potentially real creature in some Japanese government documents from the Edo period.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Kappa_Tanuki.jpg/240px-Kappa_Tanuki.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Kappa_(folklore)", links:[{title:"Yōkai",description:"The broad category of supernatural entities in Japanese folklore"},{title:"Japanese river mythology",description:"The role of water spirits and river gods in Japanese belief"},{title:"Tanuki",description:"The magical shape-shifting raccoon dog of Japanese folklore"}] },
  "wendigo": { title:"Wendigo", description:"Cannibalistic monster from Algonquian folklore", extract:"The Wendigo is a mythological creature from the folklore of the Algonquian peoples of North America — a malevolent, cannibalistic spirit associated with winter, famine, and the cold north. It is typically described as an emaciated giant with a heart of ice, an insatiable hunger, and the ability to possess human beings. 'Wendigo psychosis' is a culture-bound syndrome in which individuals develop a compulsive craving to eat human flesh, documented in Indigenous communities during times of severe starvation, though its classification as a genuine psychiatric condition remains debated. The creature has become one of the most prominent figures in modern horror fiction.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Wendigo", links:[{title:"Windigo psychosis",description:"The culture-bound syndrome of compulsive cannibalism"},{title:"Algonquian peoples",description:"The Indigenous nations of the northeastern woodlands who created the legend"},{title:"Cannibalism in folklore",description:"How extreme taboo becomes mythologised across cultures"}] },
  "skinwalker": { title:"Skinwalker", description:"Navajo legend of a witch that can transform into animals", extract:"A skinwalker is a type of harmful witch in Navajo belief who has obtained the power to transform into, possess, or disguise themselves as an animal. Unlike the werewolf of European tradition, skinwalkers are not cursed but have deliberately pursued dark power — in Navajo tradition, a person becomes a skinwalker by committing an act of pure evil, often killing a close family member. The topic is treated with extreme seriousness in Navajo culture, and many practitioners refuse to discuss it in detail for fear of inviting harm. The concept has become widely known outside Indigenous communities through its association with Skinwalker Ranch in Utah, site of decades of reported paranormal activity.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Skin-walker", links:[{title:"Skinwalker Ranch",description:"Utah property famous for decades of reported UFOs and anomalous phenomena"},{title:"Navajo Nation",description:"The largest Native American nation and its rich ceremonial traditions"},{title:"Shapeshifting",description:"The mythological ability to change physical form across world cultures"}] },
  "el silbón": { title:"El Silbón", description:"Legendary whistling ghost of the Venezuelan and Colombian llanos", extract:"El Silbón ('The Whistler') is one of the most feared figures in Venezuelan and Colombian folklore — a towering, skeletal apparition dressed in rags and carrying a sack of his father's bones. The legend tells of a young man who murdered his father, was cursed and flogged, and now wanders the llanos (grasslands) forever, whistling a mournful, haunting tune. Paradoxically, when the whistling sounds close, the entity is said to be far away — but when the tune sounds distant, El Silbón is right beside you. He is said to prey specifically on drunkards and womanisers, counting their bones before killing them.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/El_Silb%C3%B3n", links:[{title:"Venezuelan folklore",description:"The rich tradition of legends and supernatural beings from Venezuela"},{title:"La Llorona",description:"The weeping ghost woman who haunts rivers across Latin American folklore"},{title:"Los Llanos",description:"The vast tropical grasslands that are El Silbón's domain"}] },
  "strigoi": { title:"Strigoi", description:"Romanian vampire-like spirit that rises from the dead", extract:"Strigoi are malevolent souls from Romanian mythology believed to rise from the dead and plague the living — one of the primary inspirations for the modern vampire archetype. Romanian tradition distinguishes between the strigoi mort (undead strigoi) and the strigoi viu (living witches who can send out their soul at night), and the specific rituals required to prevent a person from becoming strigoi after death were taken extremely seriously in rural communities until the 20th century. An 2004 case in Romania made international news when a family exhumed a relative's body and cut out its heart, burning it and drinking the ashes mixed with water — a traditional 'strigoi removal' — to cure illnesses they blamed on the deceased.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Strigoi", links:[{title:"Vampire folklore",description:"How the vampire myth developed across Eastern European cultures"},{title:"Vlad the Impaler",description:"The historical Romanian ruler who inspired Bram Stoker's Dracula"},{title:"Romanian mythology",description:"The pre-Christian beliefs and supernatural traditions of Romania"}] },

  // ── Strange real animals ─────────────────────────────────────────────────
  "oarfish": { title:"Oarfish", description:"Enormous deep-sea fish that inspired sea serpent legends", extract:"The oarfish is the world's longest bony fish, reaching confirmed lengths of up to 36 feet with unverified reports of specimens twice that size. Living at depths between 200 and 1,000 metres, oarfish are rarely seen alive — most encounters occur when dying or dead individuals wash ashore or are found floating near the surface. Their enormous, ribbon-like silver bodies, crimson dorsal fins, and serpentine movement are the leading scientific candidate for historical sea serpent sightings worldwide. In Japan, the oarfish is known as the 'Messenger from the Sea God's Palace' and its appearance is traditionally believed to foretell earthquakes.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Oarfish_2010.jpg/320px-Oarfish_2010.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Oarfish", links:[{title:"Sea serpent",description:"Legendary enormous snake-like sea monsters likely inspired by oarfish"},{title:"Deep sea",description:"The largely unexplored zone below 200 metres"},{title:"Bioluminescence",description:"The production of light by living organisms, common in deep-sea creatures"}] },
  "giant squid": { title:"Giant squid", description:"Enormous deep-sea cephalopod, the inspiration for the Kraken", extract:"The giant squid is a deep-ocean-dwelling cephalopod that can reach lengths of up to 43 feet, making it one of the largest living invertebrates on Earth. Despite its enormous size, the giant squid remained almost entirely theoretical to science until 2004, when Japanese researchers obtained the first photographs of a living specimen in the wild — and the first footage wasn't captured until 2012. The creatures live at depths of 300 to 1,000 metres and have the largest eyes of any living animal, up to 10 inches across, adapted for seeing in near-total darkness. Sperm whales bear circular scars from giant squid suckers, evidence of epic deep-sea battles invisible to humans.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Giant_squid_attacks_French_naval_vessel.jpg/320px-Giant_squid_attacks_French_naval_vessel.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Giant_squid", links:[{title:"Kraken",description:"The legendary sea monster the giant squid inspired"},{title:"Sperm whale",description:"The only predator of the giant squid, bearing the scars of their battles"},{title:"Colossal squid",description:"The even larger and rarer relative of the giant squid"}] },
  "goblin shark": { title:"Goblin shark", description:"Rare deep-sea shark with a bizarre protruding jaw", extract:"The goblin shark is a rare deep-sea shark species found at depths greater than 330 feet, notable for its distinctive profile: a long, flattened snout that protrudes from the top of its head like a blade, and jaws that can rapidly extend forward to snap prey in a slingshot-like motion. Living specimens are seldom encountered, making it one of the least-studied shark species. Its lineage stretches back 125 million years, earning it the nickname 'living fossil.' The goblin shark's flesh appears pink or violet because its skin is so translucent that blood vessels show through, giving it an otherworldly, unsettling appearance.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/GoblinShark2.jpg/320px-GoblinShark2.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Goblin_shark", links:[{title:"Deep sea fish",description:"The remarkable and often bizarre fish that inhabit the ocean's dark zones"},{title:"Frilled shark",description:"Another ancient, rarely seen deep-sea shark resembling a sea serpent"},{title:"Living fossil",description:"Species that have remained unchanged for millions of years"}] },
  "barreleye fish": { title:"Barreleye", description:"Deep-sea fish with a transparent head and rotating tubular eyes", extract:"The barreleye, also known as the spook fish, is a small deep-sea fish with a remarkable and deeply unsettling feature: its head is completely transparent, containing two large, tubular eyes that glow green and can rotate within the fluid-filled dome to look upward, forward, or even backward. For decades scientists thought the eyes always pointed upward, only realising in 2009 — when a submersible with cameras capable of observing intact specimens — that the fish could rotate them to face forward. The transparent dome is believed to collect and amplify the faint bioluminescent light of the deep ocean, helping the fish spot the silhouettes of prey above.", imageUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Barreleye.jpg/320px-Barreleye.jpg", wikiUrl:"https://en.wikipedia.org/wiki/Barreleye", links:[{title:"Deep sea",description:"The vast, largely unexplored zone that contains most of Earth's living space"},{title:"Bioluminescence",description:"How and why so many deep-sea creatures produce their own light"},{title:"Hydromedusa",description:"The jellyfish whose tentacles barreleyes have been observed sheltering near"}] },
  "patagonian toothfish": { title:"Patagonian toothfish", description:"Deep-water fish marketed as 'Chilean sea bass'", extract:"The Patagonian toothfish is a large, slow-growing deep-water fish inhabiting the cold waters around South America and subantarctic islands, reaching lengths of up to 7 feet and weights exceeding 220 pounds. It was virtually unknown to consumers until the 1977 marketing rebranding that gave it the more palatable name 'Chilean sea bass,' turning it into a restaurant delicacy almost overnight — and triggering one of the most dramatic episodes of illegal fishing in history. At its peak, illegal vessels were harvesting ten times the legal limit, and Interpol issued black alerts for pirate fishing vessels operating in the Southern Ocean. The fish itself lives up to 50 years and only begins reproducing at age 10.", imageUrl:null, wikiUrl:"https://en.wikipedia.org/wiki/Patagonian_toothfish", links:[{title:"Illegal, unreported and unregulated fishing",description:"The global crisis of unregulated fishing destroying ocean ecosystems"},{title:"Southern Ocean",description:"The wild, remote waters surrounding Antarctica"},{title:"Fish marketing",description:"How renaming ugly or unpopular fish transforms their commercial value"}] },
};

const SEED_KEYS = Object.keys(SEED_ARTICLES);

// ── Category map for browsing ────────────────────────────────────────────────
const CATEGORIES = {
  "🔍 Mysteries": ["tunguska event","voynich manuscript","dyatlov pass incident","mary celeste","dancing plague of 1518","antikythera mechanism","fermi paradox","roanoke colony","cicada 3301","numbers station","black dahlia","taos hum","d. b. cooper"],
  "🦎 Cryptids": ["bigfoot","loch ness monster","chupacabra","jersey devil","flatwoods monster","dover demon","skunk ape","thunderbird","beast of gévaudan","owlman"],
  "🌊 Sea Creatures": ["kraken","megalodon","sea serpent","lusca","bunyip","oarfish","giant squid","goblin shark","barreleye","patagonian toothfish"],
  "👁 Paranormal": ["mothman","shadow people","men in black","spring heeled jack","black-eyed children","slender man"],
  "🧿 Mythology": ["kappa (folklore)","wendigo","skinwalker","el silbón","strigoi"],
};

const LOADING_MSGS = ["falling deeper…","following the thread…","chasing the rabbit…","going down the hole…"];

// ── Utils ────────────────────────────────────────────────────────────────────
async function withRetry(fn, retries=4, delay=1500) {
  for (let i=0; i<retries; i++) {
    try { return await fn(); }
    catch(e) { if(!e.message?.includes("429")||i===retries-1) throw e; await new Promise(r=>setTimeout(r,delay*(i+1))); }
  }
}
function extractJSON(text) {
  let s=text.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  try{return JSON.parse(s);}catch(_){}
  const ai=s.indexOf("["),oi=s.indexOf("{");
  if(ai!==-1&&(oi===-1||ai<oi)){const e=s.lastIndexOf("]");if(e!==-1)try{return JSON.parse(s.slice(ai,e+1));}catch(_){}}
  if(oi!==-1){const e=s.lastIndexOf("}");if(e!==-1)try{return JSON.parse(s.slice(oi,e+1));}catch(_){}}
  throw new Error("Cannot parse JSON");
}
function timeAgo(ts) {
  const d=Date.now()-ts,m=60000,h=3600000,day=86400000;
  if(d<m)return"just now";if(d<h)return`${Math.floor(d/m)}m ago`;
  if(d<day)return`${Math.floor(d/h)}h ago`;if(d<day*7)return`${Math.floor(d/day)}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Storage ──────────────────────────────────────────────────────────────────
const ART="wikihole:";
async function saveArticle(t,a){try{await window.storage.set(ART+t.toLowerCase(),JSON.stringify(a));}catch(_){}}
async function loadArticle(t){try{const r=await window.storage.get(ART+t.toLowerCase());return r?JSON.parse(r.value):null;}catch(_){return null;}}
async function loadAllCachedTitles(){try{const r=await window.storage.list(ART);return(r?.keys||[]).map(k=>k.replace(ART,""));}catch(_){return[];}}
const SES="trail:session:";
async function saveSession(s){try{await window.storage.set(SES+s.id,JSON.stringify(s));}catch(_){}}
async function loadAllSessions(){
  try{const r=await window.storage.list(SES);if(!r?.keys?.length)return[];
  const items=await Promise.all(r.keys.map(async k=>{const v=await window.storage.get(k);return v?JSON.parse(v.value):null;}));
  return items.filter(Boolean).sort((a,b)=>b.updatedAt-a.updatedAt);}catch(_){return[];}
}
function makeSessionId(){return"s"+Date.now();}
const SRS_PFX="srs:card:";
function makeCardId(q){return encodeURIComponent(q.slice(0,50)).replace(/[^a-zA-Z0-9]/g,"").slice(0,24)+"_"+q.length;}
async function saveCard(c){try{await window.storage.set(SRS_PFX+c.id,JSON.stringify(c));}catch(_){}}
async function loadAllCards(){
  try{const r=await window.storage.list(SRS_PFX);if(!r?.keys?.length)return[];
  const items=await Promise.all(r.keys.map(async k=>{const v=await window.storage.get(k);return v?JSON.parse(v.value):null;}));
  return items.filter(Boolean);}catch(_){return[];}
}
function applyRating(card,rating){
  const now=Date.now();let{interval=1,streak=0,ease=2.5,totalReviews=0,correctReviews=0}=card;totalReviews++;
  if(rating==="again"){interval=1;streak=0;ease=Math.max(ease-0.2,1.3);}
  else if(rating==="hard"){interval=Math.max(Math.round(interval*1.2),interval+1);streak++;ease=Math.max(ease-0.15,1.3);correctReviews++;}
  else{interval=Math.max(Math.round(interval*ease),interval+2);streak++;ease=Math.min(ease+0.1,4);correctReviews++;}
  return{...card,interval,streak,ease,mastered:streak>=3,totalReviews,correctReviews,nextReview:now+interval*864e5,lastReviewed:now};
}
const isDue=c=>!c.nextReview||c.nextReview<=Date.now();
function nextReviewLabel(i){return i<=1?"tomorrow":i<7?`${i}d`:i<30?`${Math.round(i/7)}w`:`${Math.round(i/30)}mo`;}

// ── API ──────────────────────────────────────────────────────────────────────
async function fetchWikiArticle(topic) {
  return withRetry(async()=>{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:800,
        system:"Wikipedia assistant. Reply with one JSON object only. No markdown, no prose.",
        messages:[{role:"user",content:`JSON for "${topic}": {"title":"...","description":"one line","extract":"3-4 engaging sentences","imageUrl":"wikimedia URL or null","wikiUrl":"https://en.wikipedia.org/wiki/...","links":[{"title":"...","description":"..."},{"title":"...","description":"..."},{"title":"...","description":"..."}]}`}]})});
    if(!res.ok)throw new Error(`API error ${res.status}`);
    const d=await res.json();if(d.error)throw new Error(d.error.message);
    const t=d.content?.filter(b=>b.type==="text").pop()?.text;if(!t)throw new Error("Empty");
    return extractJSON(t);
  });
}
async function fetchQuizCards(articles) {
  const count=Math.min(articles.length*2,8);
  const ctx=articles.map(a=>`"${a.title}": ${a.extract}`).join("\n\n");
  return withRetry(async()=>{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2000,
        system:"Quiz generator. Return valid JSON array only. No markdown.",
        messages:[{role:"user",content:`${count} questions from:\n\n${ctx}\n\nJSON array:[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"...","source":"Title"}]`}]})});
    if(!res.ok)throw new Error(`API error ${res.status}`);
    const d=await res.json();if(d.error)throw new Error(d.error.message);
    const t=d.content?.filter(b=>b.type==="text").pop()?.text;if(!t)throw new Error("Empty");
    const p=extractJSON(t);if(!Array.isArray(p))throw new Error("Not array");return p;
  },4,2000);
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({w="100%",h=14,mb=6,radius=4}){return <div style={{width:w,height:h,borderRadius:radius,background:"#ece8e2",marginBottom:mb,animation:"shimmer 1.4s ease infinite"}}/>;}
function ArticleSkeleton(){return(<div style={{marginTop:22}}><Skel w={140} h={11} mb={10}/><Skel w="80%" h={32} mb={8} radius={6}/><Skel w="55%" h={32} mb={20} radius={6}/><Skel h={14} mb={7}/><Skel h={14} mb={7}/><Skel w="90%" h={14} mb={7}/><Skel w="70%" h={14} mb={28}/><div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>{[1,2,3].map(i=><Skel key={i} h={62} radius={12} mb={0}/>)}</div></div>);}

// ── App ──────────────────────────────────────────────────────────────────────
export default function WikiHole() {
  const [trail,setTrail]               = useState([]);
  const [currentIndex,setCurrentIndex] = useState(0);
  const [fetching,setFetching]         = useState(false);
  const [loading,setLoading]           = useState(true);
  const [loadingMsg,setLoadingMsg]     = useState("falling deeper…");
  const [error,setError]               = useState(null);
  const [animKey,setAnimKey]           = useState(0);
  const [isOnline,setIsOnline]         = useState(navigator.onLine);
  const [cachedKeys,setCachedKeys]     = useState(new Set());
  const [prefetched,setPrefetched]     = useState({});
  const [imgError,setImgError]         = useState(false);
  const [sessions,setSessions]         = useState([]);
  const [currentSessionId,setCurrentSessionId] = useState(null);
  const [allCards,setAllCards]         = useState([]);
  const [view,setView]                 = useState("article"); // article|trails|discover|quiz|review
  const [sessionQueue,setSessionQueue] = useState([]);
  const [sessionIndex,setSessionIndex] = useState(0);
  const [revealed,setRevealed]         = useState(false);
  const [selected,setSelected]         = useState(null);
  const [sessionCorrect,setSessionCorrect] = useState(0);
  const [sessionTotal,setSessionTotal]     = useState(0);
  const [finished,setFinished]             = useState(false);
  const [quizLoading,setQuizLoading]       = useState(false);
  const [quizError,setQuizError]           = useState(null);
  const [activeQuizSessionId,setActiveQuizSessionId] = useState(null);
  const [discoverSearch,setDiscoverSearch] = useState("");

  const memCache=useRef({});const prefetchPaused=useRef(false);const trailRef=useRef(null);

  useEffect(()=>{
    const on=()=>setIsOnline(true),off=()=>setIsOnline(false);
    window.addEventListener("online",on);window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);
  useEffect(()=>{loadAllCachedTitles().then(t=>setCachedKeys(new Set(t)));}, []);
  useEffect(()=>{loadAllCards().then(setAllCards);}, []);
  useEffect(()=>{loadAllSessions().then(setSessions);}, []);

  const persistSession=useCallback(async(id,trailData,idx,quizCardIds)=>{
    if(!id)return;
    const s={id,name:trailData[0]?.title||"Untitled",trailTitles:trailData.map(a=>a.title),currentIndex:idx,quizCardIds:quizCardIds||[],startedAt:parseInt(id.slice(1)),updatedAt:Date.now()};
    await saveSession(s);setSessions(prev=>[s,...prev.filter(x=>x.id!==id)].sort((a,b)=>b.updatedAt-a.updatedAt));
  },[]);

  const getArticle=useCallback(async(topic)=>{
    const key=topic.toLowerCase();
    if(SEED_ARTICLES[key])return SEED_ARTICLES[key];
    if(memCache.current[key])return memCache.current[key];
    const stored=await loadArticle(topic);
    if(stored){memCache.current[key]=Promise.resolve(stored);return stored;}
    if(!navigator.onLine)throw new Error("offline");
    if(!import.meta.env.VITE_ANTHROPIC_API_KEY)throw new Error("seed-only");
    const p=fetchWikiArticle(topic).then(async a=>{await saveArticle(topic,a);setCachedKeys(prev=>new Set([...prev,key]));return a;}).catch(e=>{delete memCache.current[key];throw e;});
    memCache.current[key]=p;return p;
  },[]);

  const prefetchLinks=useCallback((article)=>{
    (article.links||[]).forEach(link=>{if(prefetchPaused.current)return;getArticle(link.title).then(()=>setPrefetched(p=>({...p,[link.title.toLowerCase()]:true}))).catch(()=>{});});
  },[getArticle]);

  const isFast=topic=>!!SEED_ARTICLES[topic.toLowerCase()]||cachedKeys.has(topic.toLowerCase())||!!prefetched[topic.toLowerCase()];

  const startWith=async(topic)=>{
    setError(null);setImgError(false);setView("article");
    setLoadingMsg(LOADING_MSGS[Math.floor(Math.random()*LOADING_MSGS.length)]);
    memCache.current={};setPrefetched({});const newId=makeSessionId();
    if(isFast(topic))setLoading(true);else setFetching(true);
    try{
      const a=await getArticle(topic);setTrail([a]);setCurrentIndex(0);setAnimKey(k=>k+1);
      setCurrentSessionId(newId);await persistSession(newId,[a],0,[]);prefetchLinks(a);
    }catch(e){setError(e.message==="offline"?"You're offline.":e.message==="seed-only"?"This topic isn't in the seed library yet. Tap 🔭 to explore the 60+ articles that are available.":`Error: ${e.message}`);}
    finally{setLoading(false);setFetching(false);}
  };

  const diveInto=async(title)=>{
    if(!isFast(title)&&!isOnline){setError("Offline and not cached.");return;}
    setError(null);setImgError(false);setLoadingMsg(LOADING_MSGS[Math.floor(Math.random()*LOADING_MSGS.length)]);
    if(isFast(title))setLoading(true);else setFetching(true);
    try{
      const a=await getArticle(title);const newTrail=[...trail.slice(0,currentIndex+1),a];const newIdx=currentIndex+1;
      setTrail(newTrail);setCurrentIndex(newIdx);setAnimKey(k=>k+1);
      const es=sessions.find(s=>s.id===currentSessionId);
      await persistSession(currentSessionId,newTrail,newIdx,es?.quizCardIds||[]);prefetchLinks(a);
      setTimeout(()=>{if(trailRef.current)trailRef.current.scrollLeft=trailRef.current.scrollWidth;window.scrollTo({top:0,behavior:"smooth"});},100);
    }catch(e){setError(`Error: ${e.message}`);}
    finally{setLoading(false);setFetching(false);}
  };

  const jumpTo=i=>{setCurrentIndex(i);setAnimKey(k=>k+1);setImgError(false);window.scrollTo({top:0,behavior:"smooth"});if(trail[i])prefetchLinks(trail[i]);const es=sessions.find(s=>s.id===currentSessionId);persistSession(currentSessionId,trail,i,es?.quizCardIds||[]);};
  const restoreSession=async session=>{
    setLoading(true);setError(null);setImgError(false);setView("article");setLoadingMsg("restoring your trail…");
    try{const arts=await Promise.all(session.trailTitles.map(t=>getArticle(t).catch(()=>null)));const valid=arts.filter(Boolean);const idx=Math.min(session.currentIndex,valid.length-1);setTrail(valid);setCurrentIndex(idx);setAnimKey(k=>k+1);setCurrentSessionId(session.id);valid.forEach(a=>{memCache.current[a.title.toLowerCase()]=Promise.resolve(a);});prefetchLinks(valid[idx]);}
    catch(e){setError(`Restore failed: ${e.message}`);}finally{setLoading(false);}
  };

  const dueCards=allCards.filter(isDue),dueCount=dueCards.length;
  const getSessionMastery=sid=>{const c=allCards.filter(x=>x.sessionId===sid);return{total:c.length,mastered:c.filter(x=>x.mastered).length};};
  const startReview=()=>{prefetchPaused.current=true;setSessionQueue([...dueCards].sort(()=>Math.random()-0.5));setSessionIndex(0);setRevealed(false);setSelected(null);setSessionCorrect(0);setSessionTotal(0);setFinished(false);setQuizError(null);setActiveQuizSessionId(null);setView("review");};
  const startNewQuiz=async sessionId=>{
    prefetchPaused.current=true;setQuizLoading(true);setQuizError(null);setView("quiz");setActiveQuizSessionId(sessionId);
    const tgt=sessions.find(s=>s.id===sessionId);const titles=tgt?.trailTitles||trail.map(a=>a.title);
    try{
      const arts=(await Promise.all(titles.map(t=>getArticle(t).catch(()=>null)))).filter(Boolean);const rawQ=await fetchQuizCards(arts);const artMap=Object.fromEntries(arts.map(a=>[a.title,a.extract]));const newCards=[];
      for(const q of rawQ){const id=makeCardId(q.question);if(!allCards.find(c=>c.id===id)){const card={id,question:q.question,options:q.options,answer:q.answer,explanation:q.explanation,source:q.source,extract:artMap[q.source]||"",sessionId,interval:1,streak:0,ease:2.5,mastered:false,totalReviews:0,correctReviews:0,nextReview:Date.now(),createdAt:Date.now()};await saveCard(card);newCards.push(card);}}
      const updated=[...allCards,...newCards];setAllCards(updated);
      if(tgt){const us={...tgt,quizCardIds:[...(tgt.quizCardIds||[]),...newCards.map(c=>c.id)],updatedAt:Date.now()};await saveSession(us);setSessions(p=>p.map(s=>s.id===sessionId?us:s));}
      const queue=[...newCards,...allCards.filter(c=>c.sessionId===sessionId&&isDue(c))].sort(()=>Math.random()-0.5);
      if(!queue.length){setQuizError("No new questions — dive deeper first.");setQuizLoading(false);return;}
      setSessionQueue(queue);setSessionIndex(0);setRevealed(false);setSelected(null);setSessionCorrect(0);setSessionTotal(0);setFinished(false);
    }catch(e){setQuizError(`Quiz failed: ${e.message}`);}finally{setQuizLoading(false);}
  };
  const handleAnswer=letter=>{if(revealed)return;setSelected(letter);setRevealed(true);setSessionTotal(t=>t+1);if(letter===sessionQueue[sessionIndex].answer)setSessionCorrect(c=>c+1);};
  const handleRating=async rating=>{
    const card=sessionQueue[sessionIndex],updated=applyRating(card,rating);await saveCard(updated);setAllCards(p=>[...p.filter(c=>c.id!==updated.id),updated]);
    let q=sessionQueue;if(rating==="again"){q=[...sessionQueue,{...card,_retry:true}];setSessionQueue(q);}
    const ni=sessionIndex+1;if(ni>=q.length){setFinished(true);return;}setSessionIndex(ni);setRevealed(false);setSelected(null);window.scrollTo({top:0,behavior:"smooth"});
  };
  const goBack=()=>{prefetchPaused.current=false;setView("article");loadAllCards().then(setAllCards);};

  useEffect(()=>{startWith(SEED_KEYS[Math.floor(Math.random()*SEED_KEYS.length)]);}, []);

  const current=trail[currentIndex];const depth=currentIndex;
  const isLinkOffline=t=>!!SEED_ARTICLES[t.toLowerCase()]||cachedKeys.has(t.toLowerCase())||!!prefetched[t.toLowerCase()];
  const noApiKey=!import.meta.env.VITE_ANTHROPIC_API_KEY;
  const sq=sessionQueue[sessionIndex],isCorrect=sq&&selected===sq.answer;
  const optStyle=letter=>{if(!revealed)return{bg:"#fff",border:"#e2ddd6",color:"#1c1810"};if(letter===sq.answer)return{bg:"#f0faf2",border:"#4a9a60",color:"#2a6a40"};if(letter===selected)return{bg:"#fff5f5",border:"#d05050",color:"#a03030"};return{bg:"#fafafa",border:"#ece8e2",color:"#bbb"};};
  const showSkeleton=fetching&&!current;

  // Discover filtering
  const filteredDiscover = discoverSearch.trim()
    ? SEED_KEYS.filter(k => k.includes(discoverSearch.toLowerCase()) || SEED_ARTICLES[k].title.toLowerCase().includes(discoverSearch.toLowerCase()) || SEED_ARTICLES[k].description.toLowerCase().includes(discoverSearch.toLowerCase()))
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lora:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f5f2ec;}
        ::-webkit-scrollbar{width:3px;height:3px;}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes pop{from{opacity:0;transform:scale(0.97);}to{opacity:1;transform:scale(1);}}
        @keyframes shimmer{0%,100%{opacity:0.5;}50%{opacity:1;}}
        .card-in{animation:fadeUp 0.4s ease both;}.pop-in{animation:pop 0.25s ease both;}
        .hole-btn{width:100%;background:#fff;border:1.5px solid #e2ddd6;border-radius:12px;padding:14px 16px;cursor:pointer;text-align:left;transition:all 0.18s;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);}
        .hole-btn:hover:not(:disabled){border-color:#b8832a;transform:translateX(4px);box-shadow:0 2px 8px rgba(184,131,42,0.12);}
        .hole-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .discover-btn{width:100%;background:#fff;border:1.5px solid #e2ddd6;border-radius:10px;padding:12px 14px;cursor:pointer;text-align:left;transition:all 0.15s;display:flex;align-items:center;gap:10px;box-shadow:0 1px 2px rgba(0,0,0,0.04);}
        .discover-btn:hover{border-color:#b8832a;background:#fffdf8;}
        .session-card{width:100%;background:#fff;border:1.5px solid #e2ddd6;border-radius:14px;padding:18px;text-align:left;transition:all 0.2s;box-shadow:0 1px 4px rgba(0,0,0,0.04);}
        .session-card:hover{border-color:#b8832a;box-shadow:0 3px 12px rgba(184,131,42,0.1);transform:translateY(-1px);}
        .opt-btn{width:100%;border-radius:10px;padding:13px 15px;cursor:pointer;font-family:'Lora',Georgia,serif;font-size:15px;line-height:1.5;transition:all 0.15s;display:flex;align-items:flex-start;gap:10px;border-width:1.5px;border-style:solid;text-align:left;}
        .opt-btn:hover:not(:disabled){transform:translateX(3px);}.opt-btn:disabled{cursor:default;}
        .rating-btn{flex:1;padding:11px 8px;border-radius:10px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.04em;border:1.5px solid;transition:all 0.18s;text-align:center;}
        .new-btn{background:transparent;border:1.5px solid #b8832a;color:#b8832a;padding:6px 14px;border-radius:8px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.05em;transition:all 0.18s;}
        .new-btn:hover:not(:disabled){background:#b8832a;color:#fff;}.new-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .gold-btn{background:#b8832a;color:#fff;border:none;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.04em;transition:background 0.18s;display:flex;align-items:center;gap:5px;white-space:nowrap;}
        .gold-btn:hover:not(:disabled){background:#9a6e22;}.gold-btn:disabled{opacity:0.45;cursor:not-allowed;}
        .ghost-btn{background:transparent;border:1.5px solid #b8832a;color:#b8832a;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.04em;transition:all 0.18s;}
        .ghost-btn:hover:not(:disabled){background:#b8832a;color:#fff;}.ghost-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .crumb{background:transparent;border:1px solid #ddd8d0;color:#999;padding:4px 12px;border-radius:20px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;white-space:nowrap;flex-shrink:0;transition:all 0.18s;}
        .crumb:hover{border-color:#b8832a88;color:#b8832a;}.crumb.active{border-color:#b8832a;color:#b8832a;background:#b8832a14;}
        .wiki-link{display:inline-flex;align-items:center;gap:5px;font-family:'DM Mono',monospace;font-size:11px;color:#b8832a;text-decoration:none;border-bottom:1px solid #b8832a55;transition:all 0.15s;}
        .wiki-link:hover{color:#8a6020;}
        .search-input{width:100%;padding:10px 14px;border:1.5px solid #e2ddd6;border-radius:10px;font-family:'DM Mono',monospace;font-size:12px;background:#fff;color:#2c2820;outline:none;transition:border-color 0.18s;}
        .search-input:focus{border-color:#b8832a;}
        .search-input::placeholder{color:#bbb;}
      `}</style>

      <div style={{minHeight:"100vh",background:"#f5f2ec",maxWidth:660,margin:"0 auto",fontFamily:"'Lora',Georgia,serif",color:"#2c2820"}}>

        {!isOnline&&<div style={{background:"#fdf3e0",borderBottom:"1px solid #e8d8a0",padding:"8px 20px",display:"flex",alignItems:"center",gap:8}}><span>📵</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#a07820"}}>offline — {cachedKeys.size} cached</span></div>}

        {/* Header */}
        <header style={{position:"sticky",top:0,zIndex:20,background:"#f5f2ecf2",backdropFilter:"blur(12px)",borderBottom:"1px solid #e2ddd6",padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={goBack} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:22,color:"#b8832a"}}>wikihole</span>
            </button>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,background:"#eeeae2",border:"1px solid #e0dbd2",padding:"2px 9px",borderRadius:20,letterSpacing:"0.06em",
              color:view==="trails"||view==="discover"?"#888":view!=="article"?"#b8832a":fetching?"#b8832a":depth===0?"#ccc":"#b8832a"}}>
              {view==="trails"?"trails":view==="discover"?"discover":view==="quiz"||view==="review"?"study":fetching?"loading…":depth===0?"surface":`${depth} deep`}
            </span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:isOnline?"#4a9a60":"#cc8820"}}/>
            {(view==="article"||view==="trails"||view==="discover")&&(<>
              {dueCount>0&&<button className="gold-btn" onClick={startReview}>↩ {dueCount}</button>}
              <button className="ghost-btn" onClick={()=>setView(v=>v==="discover"?"article":"discover")} style={{padding:"7px 10px"}}>🔭</button>
              <button className="ghost-btn" onClick={()=>setView(v=>v==="trails"?"article":"trails")} style={{padding:"7px 10px"}}>🕳</button>
              {view==="article"&&<button className="new-btn" disabled={fetching||loading||!isOnline} onClick={()=>startWith(SEED_KEYS[Math.floor(Math.random()*SEED_KEYS.length)])}>↺</button>}
            </>)}
            {(view==="quiz"||view==="review")&&<button className="new-btn" onClick={goBack}>← back</button>}
          </div>
        </header>

        {/* Breadcrumbs */}
        {view==="article"&&trail.length>1&&(
          <div ref={trailRef} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",overflowX:"auto",scrollbarWidth:"none",borderBottom:"1px solid #e8e4dc"}}>
            {trail.map((a,i)=>(
              <button key={i} className={`crumb${i===currentIndex?" active":""}`} onClick={()=>jumpTo(i)}>
                {i>0&&<span style={{marginRight:4,opacity:0.35}}>›</span>}
                {a.title.length>22?a.title.slice(0,22)+"…":a.title}
              </button>
            ))}
          </div>
        )}

        <main style={{padding:"0 20px 60px"}}>

          {/* ── DISCOVER VIEW ── */}
          {view==="discover"&&(
            <div className="card-in">
              <div style={{marginTop:24,marginBottom:16}}>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:"#1c1810",marginBottom:4}}>Discover</h2>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#aaa",marginBottom:16}}>{SEED_KEYS.length} articles · all instant load</p>
                <input className="search-input" placeholder="search articles…" value={discoverSearch} onChange={e=>setDiscoverSearch(e.target.value)}/>
              </div>

              {filteredDiscover ? (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {filteredDiscover.length===0
                    ? <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#bbb",textAlign:"center",padding:"24px 0"}}>no results</p>
                    : filteredDiscover.map(key=>{
                        const a=SEED_ARTICLES[key];
                        return(
                          <button key={key} className="discover-btn" onClick={()=>startWith(a.title)}>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1c1810",marginBottom:2}}>{a.title}</p>
                              <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#999",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.description}</p>
                            </div>
                            <span style={{color:"#b8832a",fontSize:16,flexShrink:0}}>→</span>
                          </button>
                        );
                      })
                  }
                </div>
              ) : (
                Object.entries(CATEGORIES).map(([cat,keys])=>(
                  <div key={cat} style={{marginBottom:28}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#b8832a",letterSpacing:"0.1em",marginBottom:10}}>{cat}</p>
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {keys.map(key=>{
                        const a=SEED_ARTICLES[key];if(!a)return null;
                        return(
                          <button key={key} className="discover-btn" onClick={()=>startWith(a.title)}>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1c1810",marginBottom:2}}>{a.title}</p>
                              <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#999",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.description}</p>
                            </div>
                            <span style={{color:"#b8832a",fontSize:16,flexShrink:0}}>→</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TRAILS VIEW ── */}
          {view==="trails"&&(
            <div className="card-in">
              <div style={{marginTop:24,marginBottom:20,display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:"#1c1810"}}>Your Rabbit Holes</h2>
                <button className="gold-btn" disabled={!isOnline} onClick={()=>{setView("discover");}}>+ New</button>
              </div>
              {sessions.length===0?(
                <div style={{textAlign:"center",padding:"48px 20px",color:"#bbb"}}><div style={{fontSize:36,marginBottom:12}}>🕳</div><p style={{fontFamily:"'DM Mono',monospace",fontSize:12,letterSpacing:"0.08em"}}>no trails yet — start exploring</p></div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {sessions.map(s=>{
                    const m=getSessionMastery(s.id),pct=m.total?Math.round((m.mastered/m.total)*100):0,isCur=s.id===currentSessionId;
                    return(
                      <div key={s.id} className="session-card" style={{borderColor:isCur?"#b8832a":"#e2ddd6",background:isCur?"#fffbf3":"#fff"}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:10}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:"#1c1810",lineHeight:1.2}}>{s.name}</h3>
                              {isCur&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#b8832a",background:"#b8832a18",border:"1px solid #b8832a44",padding:"1px 6px",borderRadius:4,flexShrink:0}}>current</span>}
                            </div>
                            <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#aaa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {s.trailTitles.map((t,i)=>(i>0?" › ":"")+(t.length>18?t.slice(0,18)+"…":t)).join("")}
                            </p>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb",marginBottom:3}}>{timeAgo(s.updatedAt)}</div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a"}}>{s.trailTitles.length-1} deep</div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:m.total?10:0}}>
                          {Array.from({length:Math.min(s.trailTitles.length,12)}).map((_,i)=>(
                            <div key={i} style={{width:4,height:4,borderRadius:"50%",background:i===s.currentIndex?"#b8832a":i<s.trailTitles.length?"#d8d0c4":"#eee"}}/>
                          ))}
                        </div>
                        {m.total>0&&(
                          <div style={{marginBottom:12}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#bbb",letterSpacing:"0.06em"}}>QUIZ MASTERY</span>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:pct===100?"#4a9a60":"#b8832a"}}>{m.mastered}/{m.total} {pct===100?"✓":`${pct}%`}</span>
                            </div>
                            <div style={{height:3,background:"#ece8e2",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?"#4a9a60":"#b8832a",borderRadius:2}}/></div>
                          </div>
                        )}
                        <div style={{display:"flex",gap:8}}>
                          <button className="gold-btn" style={{fontSize:10}} onClick={()=>restoreSession(s)}>Resume →</button>
                          <button className="ghost-btn" style={{fontSize:10}} disabled={!isOnline} onClick={()=>restoreSession(s).then(()=>startNewQuiz(s.id))}>✦ Quiz</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ARTICLE VIEW ── */}
          {view==="article"&&(
            loading?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:18}}>
                <div style={{width:28,height:28,border:"2px solid #e0dbd2",borderTop:"2px solid #b8832a",borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#aaa",letterSpacing:"0.1em"}}>{loadingMsg}</p>
              </div>
            ):error?(
              <div style={{margin:"36px 0",padding:"20px",background:"#fff5f5",border:"1px solid #f0c8c8",borderRadius:12,textAlign:"center"}}>
                <p style={{color:"#c05050",marginBottom:14,lineHeight:1.6}}>{error}</p>
                {isOnline&&<button className="new-btn" onClick={()=>setView("discover")}>browse topics</button>}
              </div>
            ):showSkeleton?<ArticleSkeleton/>
            :current?(
              <div key={animKey} className="card-in">
                {current.imageUrl&&!imgError&&(
                  <div style={{margin:"22px 0 0",borderRadius:14,overflow:"hidden",height:210,background:"#e8e4dc",position:"relative",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
                    <img src={current.imageUrl} alt={current.title} onError={()=>setImgError(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 55%, rgba(245,242,236,0.65))"}}/>
                  </div>
                )}
                <div style={{marginTop:22}}>
                  {current.description&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#b8832a",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>{current.description}</p>}
                  <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,5.5vw,36px)",fontWeight:700,lineHeight:1.15,letterSpacing:"-0.02em",color:"#1c1810",marginBottom:14}}>{current.title}</h1>
                  <p style={{fontSize:16,lineHeight:1.85,color:"#4a4438"}}>{current.extract}</p>
                  {current.wikiUrl&&(<div style={{marginTop:14}}><a href={current.wikiUrl} target="_blank" rel="noopener noreferrer" className="wiki-link"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>Read full article on Wikipedia</a></div>)}
                  {(()=>{const m=getSessionMastery(currentSessionId);if(!m.total)return null;const pct=Math.round((m.mastered/m.total)*100);return(<div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}><div style={{flex:1,height:3,background:"#e8e4dc",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?"#4a9a60":"#b8832a",borderRadius:2,transition:"width 0.4s"}}/></div><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:pct===100?"#4a9a60":"#b8832a",whiteSpace:"nowrap"}}>{m.mastered}/{m.total} mastered</span></div>);})()}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,margin:"30px 0 14px"}}>
                  <div style={{flex:1,height:1,background:"#e2ddd6"}}/><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb",letterSpacing:"0.14em"}}>🕳 RABBIT HOLES</span><div style={{flex:1,height:1,background:"#e2ddd6"}}/>
                </div>
                {(current.links||[]).length>0?(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {current.links.map((link,i)=>{const offline=isLinkOffline(link.title),unavail=(!isOnline&&!offline)||(noApiKey&&!offline);return(
                      <button key={i} className="hole-btn" disabled={fetching||loading||unavail} onClick={()=>diveInto(link.title)}>
                        <div><p style={{fontFamily:"'Playfair Display',serif",fontSize:15.5,fontWeight:700,color:unavail?"#bbb":"#1c1810",marginBottom:link.description?3:0}}>{link.title}</p>{link.description&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:unavail?"#ccc":"#999"}}>{link.description}</p>}</div>
                        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>{offline&&!unavail&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#4a9a60"}}>ready</span>}{!isOnline&&!offline&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#ccc"}}>offline</span>}{noApiKey&&!offline&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#ccc"}}>seed only</span>}<span style={{color:unavail?"#ddd":"#b8832a",fontSize:18}}>→</span></div>
                      </button>
                    );})}
                  </div>
                ):(
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#bbb",textAlign:"center",padding:"20px 0"}}>dead end — try a new hole</p>
                )}
                <div style={{marginTop:24,display:"flex",gap:8}}>
                  <button className="ghost-btn" style={{flex:1,justifyContent:"center",display:"flex"}} disabled={!isOnline||fetching} onClick={()=>startNewQuiz(currentSessionId)}>✦ Quiz</button>
                  <button className="ghost-btn" style={{flex:1,justifyContent:"center",display:"flex"}} onClick={()=>setView("discover")}>🔭 Discover</button>
                </div>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#ccc",textAlign:"center",marginTop:28}}>{SEED_KEYS.length} instant articles · {allCards.length} cards</p>
                {depth>0&&<div style={{display:"flex",justifyContent:"center",gap:5,marginTop:12}}>{Array.from({length:Math.min(depth+1,10)}).map((_,i)=>(<div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===depth?"#b8832a":"#ddd8d0"}}/>))}</div>}
              </div>
            ):null
          )}

          {/* ── QUIZ / REVIEW ── */}
          {(view==="quiz"||view==="review")&&(
            quizLoading?(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:18}}><div style={{width:28,height:28,border:"2px solid #e0dbd2",borderTop:"2px solid #b8832a",borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/><p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#aaa",letterSpacing:"0.1em"}}>crafting your quiz…</p></div>)
            :quizError?(<div style={{margin:"36px 0",padding:"20px",background:"#fff5f5",border:"1px solid #f0c8c8",borderRadius:12,textAlign:"center"}}><p style={{color:"#c05050",marginBottom:14,lineHeight:1.6}}>{quizError}</p><div style={{display:"flex",gap:10,justifyContent:"center"}}><button className="gold-btn" onClick={()=>startNewQuiz(activeQuizSessionId||currentSessionId)}>Retry</button><button className="new-btn" onClick={goBack}>Back</button></div></div>)
            :finished?(
              <div className="pop-in" style={{marginTop:40,textAlign:"center"}}>
                <div style={{fontSize:52,marginBottom:14}}>{sessionCorrect===sessionTotal?"🏆":sessionCorrect/sessionTotal>=0.7?"🎉":sessionCorrect/sessionTotal>=0.4?"📚":"🕳️"}</div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:700,color:"#1c1810",marginBottom:6}}>{sessionCorrect} / {sessionTotal}</h2>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#999",letterSpacing:"0.06em",marginBottom:24}}>{sessionCorrect===sessionTotal?"perfect":sessionCorrect/sessionTotal>=0.7?"well done":"keep digging"}</p>
                {activeQuizSessionId&&(()=>{const m=getSessionMastery(activeQuizSessionId);if(!m.total)return null;const pct=Math.round((m.mastered/m.total)*100),s=sessions.find(x=>x.id===activeQuizSessionId);return(<div style={{textAlign:"left",marginBottom:24,padding:"16px",background:"#fffbf3",border:"1.5px solid #e8d8a0",borderRadius:12}}><p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a",letterSpacing:"0.08em",marginBottom:8}}>HOLE MASTERY · {s?.name}</p><div style={{height:5,background:"#ece8e2",borderRadius:3,marginBottom:8}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?"#4a9a60":"#b8832a",borderRadius:3,transition:"width 0.5s"}}/></div><p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:pct===100?"#4a9a60":"#b8832a"}}>{m.mastered}/{m.total} mastered ({pct}%)</p></div>);})()}
                {dueCount>0&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#b8832a",marginBottom:20}}>{dueCount} card{dueCount!==1?"s":""} due</p>}
                <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                  {dueCount>0&&<button className="gold-btn" onClick={startReview}>↩ Review</button>}
                  <button className="ghost-btn" onClick={()=>setView("trails")}>🕳 Trails</button>
                  <button className="new-btn" onClick={goBack}>Back</button>
                </div>
              </div>
            ):sq?(
              <div className="pop-in" style={{marginTop:24}}>
                <div style={{marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a",letterSpacing:"0.08em"}}>{sessionIndex+1} / {sessionQueue.length}{sq._retry&&<span style={{color:"#cc8820",marginLeft:6}}>· again</span>}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#999"}}>{sessionCorrect} correct · {sq.streak||0}🔥</span>
                  </div>
                  <div style={{height:3,background:"#e8e4dc",borderRadius:2}}><div style={{height:"100%",background:"#b8832a",borderRadius:2,width:`${(sessionIndex/sessionQueue.length)*100}%`,transition:"width 0.3s"}}/></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb"}}>from: {sq.source}</span>
                  {sq.mastered&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#4a9a60",background:"#f0faf2",border:"1px solid #b0d8b8",padding:"1px 6px",borderRadius:4}}>mastered</span>}
                  {sq.streak>=2&&!sq.mastered&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#b8832a",background:"#fffbf3",border:"1px solid #e8d8a0",padding:"1px 6px",borderRadius:4}}>{sq.streak} in a row</span>}
                </div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(17px,4vw,23px)",fontWeight:700,lineHeight:1.35,color:"#1c1810",marginBottom:20}}>{sq.question}</h2>
                <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:18}}>
                  {(sq.options||[]).map((opt,i)=>{const letter=opt.charAt(0),s=optStyle(letter);return(
                    <button key={i} className="opt-btn" disabled={revealed} onClick={()=>handleAnswer(letter)} style={{background:s.bg,borderColor:s.border,color:s.color}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:s.border,flexShrink:0,marginTop:2,fontWeight:500}}>{letter}</span><span>{opt.slice(3)}</span>
                    </button>
                  );})}
                </div>
                {revealed&&(<div className="pop-in">
                  <div style={{padding:"13px 15px",borderRadius:10,marginBottom:14,background:isCorrect?"#f0faf2":"#fff5f5",border:`1.5px solid ${isCorrect?"#9acca8":"#e8b0b0"}`}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:"0.08em",marginBottom:6,color:isCorrect?"#4a9a60":"#c05050"}}>{isCorrect?"✓ CORRECT":`✗ INCORRECT — answer: ${sq.answer}`}</p>
                    <p style={{fontSize:14,lineHeight:1.6,color:"#4a4438"}}>{sq.explanation}</p>
                  </div>
                  {!isCorrect&&sq.extract&&(<div style={{padding:"13px 15px",borderRadius:10,marginBottom:14,background:"#fffbf3",border:"1.5px solid #e8d8a0"}}><p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a",letterSpacing:"0.08em",marginBottom:8}}>📖 FROM THE ARTICLE</p><p style={{fontSize:14,lineHeight:1.7,color:"#5a4a28",fontStyle:"italic"}}>"{sq.extract}"</p></div>)}
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb",marginBottom:10,textAlign:"center"}}>How well did you know this?</p>
                  <div style={{display:"flex",gap:8}}>
                    {isCorrect?(
                      <><button className="rating-btn" onClick={()=>handleRating("hard")} style={{background:"#fff",borderColor:"#e2ddd6",color:"#666"}}><div style={{fontWeight:500,marginBottom:2}}>Struggled</div><div style={{fontSize:9,color:"#bbb"}}>+{nextReviewLabel(Math.max(Math.round((sq.interval||1)*1.2),(sq.interval||1)+1))}</div></button>
                      <button className="rating-btn" onClick={()=>handleRating("easy")} style={{background:"#f0faf2",borderColor:"#9acca8",color:"#2a6a40"}}><div style={{fontWeight:500,marginBottom:2}}>Easy ✓</div><div style={{fontSize:9,color:"#7ab890"}}>+{nextReviewLabel(Math.max(Math.round((sq.interval||1)*(sq.ease||2.5)),(sq.interval||1)+2))}</div></button></>
                    ):(
                      <button className="rating-btn" onClick={()=>handleRating("again")} style={{background:"#fff5f5",borderColor:"#e8b0b0",color:"#c05050",flex:1}}><div style={{fontWeight:500,marginBottom:2}}>Review again</div><div style={{fontSize:9,color:"#d08080"}}>comes back tomorrow</div></button>
                    )}
                  </div>
                </div>)}
              </div>
            ):null
          )}
        </main>
      </div>
    </>
  );
}
