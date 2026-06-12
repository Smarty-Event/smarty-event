export interface Speaker {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
}

export interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  benefits?: string;
}

export interface EventDetail {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  banner?: string;
  category: string;
  capacity: number;
  speakers: Speaker[];
  sessions: Session[];
  ticketTypes: TicketType[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  banner: string;
  category: string;
  capacity: number;
  ticketTypes: Array<{
    price: number;
    currency: string;
  }>;
}

export const FALLBACK_EVENTS_DETAIL: Record<string, EventDetail> = {
  // Technology (5 events)
  "demo-stellar-summit": {
    id: "demo-stellar-summit",
    title: "Stellar Global Summit 2026",
    description: "Join developers, node operators, and blockchain enthusiasts from across the globe to discuss the future of the Stellar network, Smart Contracts (Soroban), and cross-border payment rails. Explore real-world integrations, meet industry leaders, and contribute to standardizing payment structures on the decentralized horizon.",
    startDate: "2026-09-12T09:00:00.000Z",
    endDate: "2026-09-13T17:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    category: "Technology",
    capacity: 500,
    speakers: [
      {
        id: "spk-1",
        name: "Jed McCaleb",
        bio: "Co-founder of Stellar Development Foundation. Pioneer in consensus systems and distributed payment ledgers.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
      },
      {
        id: "spk-2",
        name: "Dr. Karen Martinez",
        bio: "Principal Research Lead on Smart Contract compilers and decentralized security frameworks.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-1",
        title: "Opening Keynote: Stellar Protocol Roadmap",
        description: "An overview of core development efforts, protocol updates, and network performance targets.",
        startTime: "2026-09-12T10:00:00.000Z",
        endTime: "2026-09-12T11:30:00.000Z"
      },
      {
        id: "sess-2",
        title: "Hands-on Soroban Smart Contracts",
        description: "A technical coding workshop deploying Rust-based smart contracts onto the local standalone node.",
        startTime: "2026-09-12T13:00:00.000Z",
        endTime: "2026-09-12T15:00:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-vip",
        name: "VIP Backstage Pass",
        price: 15000,
        currency: "USDC",
        quantity: 50,
        sold: 12,
        benefits: '["Priority Seating", "Speaker Lounge Access", "Stellar Swag Box", "On-Chain NFT Attendee Badge"]'
      },
      {
        id: "tkt-ga",
        name: "General Admission",
        price: 4500,
        currency: "USDC",
        quantity: 450,
        sold: 140,
        benefits: '["Keynote Access", "Sponsor Booth Access", "Event Drinks Included"]'
      }
    ]
  },
  "demo-ai-symposium": {
    id: "demo-ai-symposium",
    title: "Global AI & Machine Learning Symposium",
    description: "A comprehensive deep dive into generative models, neural architectures, and ethical AI deployment. Meet leading researchers from top institutions and see live demonstrations of next-generation autonomous systems.",
    startDate: "2026-11-05T09:00:00.000Z",
    endDate: "2026-11-06T18:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    category: "Technology",
    capacity: 300,
    speakers: [
      {
        id: "spk-ai1",
        name: "Dr. Arthur Pendelton",
        bio: "ML Research Director focusing on multi-modal transformers and sparse self-attention models.",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
      },
      {
        id: "spk-ai2",
        name: "Sarah Chen",
        bio: "AI Ethics Lead advocating for algorithmic transparency, unbiased training data, and safety guardrails.",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-ai1",
        title: "The Next Frontier: Beyond Transformer Models",
        description: "Exploring state-space models, neural network scaling limits, and alternative optimization strategies.",
        startTime: "2026-11-05T10:00:00.000Z",
        endTime: "2026-11-05T11:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-ai-vip",
        name: "VIP All-Access Pass",
        price: 20000,
        currency: "USDC",
        quantity: 30,
        sold: 5,
        benefits: '["Reserved Front Row Seat", "Speakers Luncheon Ticket", "Research Access Library"]'
      },
      {
        id: "tkt-ai-ga",
        name: "Conference Pass",
        price: 8000,
        currency: "USDC",
        quantity: 270,
        sold: 95,
        benefits: '["Access to All Keynotes", "Demo Floor Entry", "Digital Certificate of Attendance"]'
      }
    ]
  },
  "demo-soroban-hackathon": {
    id: "demo-soroban-hackathon",
    title: "Soroban Smart Contracts Hackathon",
    description: "48 hours of intense hacking and building Rust-based smart contracts on the Soroban/Stellar network. Win bounties, receive mentoring from SDF developers, and launch your dApp on the Testnet.",
    startDate: "2026-09-25T18:00:00.000Z",
    endDate: "2026-09-27T18:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    category: "Technology",
    capacity: 200,
    speakers: [
      {
        id: "spk-hack1",
        name: "Marcus Aurel",
        bio: "Stellar Developer Advocate specializing in Rust integration and high-performance WebAssembly builds.",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-hack1",
        title: "Kickoff: Rules, Bounties, and Developer Setup",
        description: "Official hackathon guidelines, API keys distribution, and environment config walkthrough.",
        startTime: "2026-09-25T18:30:00.000Z",
        endTime: "2026-09-25T19:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-hkr",
        name: "Hacker Registration",
        price: 0,
        currency: "USDC",
        quantity: 150,
        sold: 112,
        benefits: '["Hacker Spot", "Hardware Lab Access", "Free Pizza & Energy Drinks", "Commemorative NFT Badge"]'
      },
      {
        id: "tkt-obs",
        name: "Observer Pass",
        price: 2000,
        currency: "USDC",
        quantity: 50,
        sold: 15,
        benefits: '["Opening Ceremony Admission", "Final Pitch Session Entry", "Networking Reception Access"]'
      }
    ]
  },
  "demo-cybersecurity-summit": {
    id: "demo-cybersecurity-summit",
    title: "Decentralized Security & Trust Summit",
    description: "Explore zero-knowledge proofs, secure multi-party computation, and defensive cryptography for next-generation systems. Learn how to secure smart contracts and defend protocols from complex attacks.",
    startDate: "2026-10-15T09:00:00.000Z",
    endDate: "2026-10-16T17:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    category: "Technology",
    capacity: 400,
    speakers: [
      {
        id: "spk-sec1",
        name: "Alan Turing III",
        bio: "Applied Cryptographer working on practical implementations of Zero-Knowledge proofs for asset routing.",
        avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-sec1",
        title: "Cryptographic Defenses Against Smart Contract Exploits",
        description: "Analyzing formal verification practices and automated security linting tools for dApp deployers.",
        startTime: "2026-10-15T10:00:00.000Z",
        endTime: "2026-10-15T11:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-sec-prof",
        name: "Professional Pass",
        price: 12000,
        currency: "USDC",
        quantity: 300,
        sold: 68,
        benefits: '["Full Access to Keynotes & Workshops", "Post-Event PDF Slide Deck", "Access to Secure Chat Group"]'
      },
      {
        id: "tkt-sec-stud",
        name: "Student Discount Pass",
        price: 3000,
        currency: "USDC",
        quantity: 100,
        sold: 45,
        benefits: '["Keynote Access Only", "Must present student ID card at gate check-in"]'
      }
    ]
  },
  "demo-iot-future": {
    id: "demo-iot-future",
    title: "Next-Gen IoT and Edge Networks Expo",
    description: "Bringing together hardware engineers and software developers to showcase edge computing, decentralized device identity, and low-power mesh networks. Witness live automated factory and smart city simulations.",
    startDate: "2026-12-02T09:00:00.000Z",
    endDate: "2026-12-03T18:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    category: "Technology",
    capacity: 250,
    speakers: [
      {
        id: "spk-iot1",
        name: "Linus Edge",
        bio: "Principal Hardware Architect focusing on microcontroller security and mesh networking protocols.",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-iot1",
        title: "Mesh Networks and Device Autonomy",
        description: "Exploring peer-to-peer telemetry, trustless message signing on microcontrollers, and edge caching.",
        startTime: "2026-12-02T11:00:00.000Z",
        endTime: "2026-12-02T12:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-iot-ind",
        name: "Industry Pass",
        price: 9500,
        currency: "USDC",
        quantity: 180,
        sold: 32,
        benefits: '["Full Conference Entrance", "Hardware Toolkit Box", "Lunch Catered"]'
      },
      {
        id: "tkt-iot-exh",
        name: "Exhibition Only Pass",
        price: 1500,
        currency: "USDC",
        quantity: 70,
        sold: 22,
        benefits: '["Demo Hall Access", "No Seminar Admission"]'
      }
    ]
  },

  // Music (5 events)
  "demo-web3-music": {
    id: "demo-web3-music",
    title: "Decentralized Beats Music Fest",
    description: "An open-air music festival where entry tickets are custom non-fungible Stellar assets. Enjoy live music, virtual merchandise shops, and interactive performance stages in an immersive cyber-organic forest setup.",
    startDate: "2026-10-24T18:00:00.000Z",
    endDate: "2026-10-25T02:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    category: "Music",
    capacity: 1500,
    speakers: [
      {
        id: "spk-dj",
        name: "DJ Horizon",
        bio: "Crypto-music producer blending classic deep house rhythms with modular synthesis layers.",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-music",
        title: "Main Stage: DJ Horizon Sunset Session",
        description: "Opening sunset electronic synth set with live projection mappings.",
        startTime: "2026-10-24T18:30:00.000Z",
        endTime: "2026-10-24T20:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-music-ga",
        name: "Festival Ticket",
        price: 1500,
        currency: "USDC",
        quantity: 1500,
        sold: 430,
        benefits: '["Entrance Admission", "Free Drink Voucher"]'
      }
    ]
  },
  "demo-cyberpunk-rave": {
    id: "demo-cyberpunk-rave",
    title: "Neon Horizon Cyberpunk Rave",
    description: "Step into a neon-drenched environment featuring immersive laser arrays, synthwave melodies, and heavy bass lines. Each attendee receives an animated NFT dynamic ticket.",
    startDate: "2026-10-31T20:00:00.000Z",
    endDate: "2026-11-01T04:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
    category: "Music",
    capacity: 600,
    speakers: [
      {
        id: "spk-rave1",
        name: "Synth Bandit",
        bio: "Cyber-aesthetic producer blending analog synths and aggressive futuristic synthwave beats.",
        avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-rave1",
        title: "Synth Bandit Main Set",
        description: "2 hours of continuous electronic audio-visual journey.",
        startTime: "2026-10-31T22:00:00.000Z",
        endTime: "2026-11-01T00:00:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-rave-vip",
        name: "VIP Balcony Pass",
        price: 7500,
        currency: "USDC",
        quantity: 100,
        sold: 34,
        benefits: '["Elevated VIP Lounge Area", "Complimentary Glowing Swag Set", "Artist Meet & Greet"]'
      },
      {
        id: "tkt-rave-ga",
        name: "General Admission",
        price: 2500,
        currency: "USDC",
        quantity: 500,
        sold: 210,
        benefits: '["Access to Main Dancefloor", "On-Chain NFT Collectible Event Ticket"]'
      }
    ]
  },
  "demo-jazz-flow": {
    id: "demo-jazz-flow",
    title: "Acoustic & Jazz Flow Blockchain Lounge",
    description: "An intimate evening of smooth jazz, acoustic soul, and networking inside a warm, classic lounge environment. Tickets are strictly limited to ensure a cozy ambiance.",
    startDate: "2026-11-14T19:00:00.000Z",
    endDate: "2026-11-14T23:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80",
    category: "Music",
    capacity: 100,
    speakers: [
      {
        id: "spk-jazz1",
        name: "Miles Davis Jr.",
        bio: "Acclaimed trumpet soloist continuing the legacy of classic improvisational hard-bop jazz.",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-jazz1",
        title: "Improvisational Jazz Quartet",
        description: "Smooth trumpet sessions accompanied by keys, upright bass, and vintage drums.",
        startTime: "2026-11-14T20:00:00.000Z",
        endTime: "2026-11-14T22:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-jazz-prem",
        name: "Premium Seat",
        price: 6000,
        currency: "USDC",
        quantity: 40,
        sold: 28,
        benefits: '["Table Seating Close to Stage", "Includes Gourmet Cheese & Wine Pairing platter"]'
      },
      {
        id: "tkt-jazz-std",
        name: "Bar Standing Ticket",
        price: 3000,
        currency: "USDC",
        quantity: 60,
        sold: 15,
        benefits: '["Standing Admission at Main Bar", "Includes 1 Draft Beer/Wine voucher"]'
      }
    ]
  },
  "demo-indie-wave": {
    id: "demo-indie-wave",
    title: "Indie Wave On-Chain Festival",
    description: "An independent music festival showcasing the best underground and indie bands. Driven by decentralized community voting for performance schedules.",
    startDate: "2026-11-28T14:00:00.000Z",
    endDate: "2026-11-28T23:30:00.000Z",
    banner: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=80",
    category: "Music",
    capacity: 800,
    speakers: [
      {
        id: "spk-ind1",
        name: "Alex Turner II",
        bio: "Frontman of alternative rock collective 'The Blue Waves', exploring digital sovereignty for musicians.",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-ind1",
        title: "The Blue Waves Performance",
        description: "Headline alt-indie set featuring old favorites and unreleased tracks.",
        startTime: "2026-11-28T21:00:00.000Z",
        endTime: "2026-11-28T22:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-ind-full",
        name: "Full Day Pass",
        price: 4000,
        currency: "USDC",
        quantity: 500,
        sold: 198,
        benefits: '["All-day admission to both stages", "Digital concert photo pack"]'
      },
      {
        id: "tkt-ind-half",
        name: "Half Day Pass",
        price: 2500,
        currency: "USDC",
        quantity: 300,
        sold: 84,
        benefits: '["Admission after 18:00 only", "Access to final two band sets"]'
      }
    ]
  },
  "demo-ambient-soundscapes": {
    id: "demo-ambient-soundscapes",
    title: "Solfeggio Ambient Soundscapes",
    description: "Relaxing frequency healing, ambient drones, and meditative soundscapes designed to rejuvenate the spirit. Includes a decentralized wellness lounge area.",
    startDate: "2026-12-10T16:00:00.000Z",
    endDate: "2026-12-10T21:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
    category: "Music",
    capacity: 150,
    speakers: [
      {
        id: "spk-amb1",
        name: "Master Oogway II",
        bio: "Therapeutic sound healer utilizing ancient Himalayan singing bowls and modular digital sound design.",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-amb1",
        title: "528Hz DNA Repair Sound Session",
        description: "A continuous immersive 90-minute sound bath for relaxation and deep alignment.",
        startTime: "2026-12-10T17:30:00.000Z",
        endTime: "2026-12-10T19:00:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-amb-mat",
        name: "Meditation Mat Zone",
        price: 3500,
        currency: "USDC",
        quantity: 50,
        sold: 30,
        benefits: '["Reserved yoga mat close to speakers", "Includes organic cold-pressed juice"]'
      },
      {
        id: "tkt-amb-ga",
        name: "General Admission",
        price: 1800,
        currency: "USDC",
        quantity: 100,
        sold: 45,
        benefits: '["Bring-your-own-mat seating space", "Wellness lounge entrance"]'
      }
    ]
  },

  // Conference (5 events)
  "demo-startup-summit": {
    id: "demo-startup-summit",
    title: "Global Startup Founders Summit",
    description: "Connect with venture capitalists, serial entrepreneurs, and accelerators. Gain key insights on raising funds, scaling business infrastructure, and optimizing product-market fit.",
    startDate: "2026-10-08T09:00:00.000Z",
    endDate: "2026-10-09T18:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80",
    category: "Conference",
    capacity: 600,
    speakers: [
      {
        id: "spk-conf1",
        name: "Steve Jobs Jr.",
        bio: "Managing Partner at Infinite Loop Ventures, investing in pre-seed decentralized protocols.",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-conf1",
        title: "Pitching in 2026: What VCs Actually Care About",
        description: "A panel discussion on shifting venture models and how startup founders can pitch sustainability.",
        startTime: "2026-10-08T10:00:00.000Z",
        endTime: "2026-10-08T11:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-fnd",
        name: "Founder Pass",
        price: 11000,
        currency: "USDC",
        quantity: 400,
        sold: 215,
        benefits: '["Access to Founders Hall & Pitch Arena", "AI Matchmaking Networking App Access"]'
      },
      {
        id: "tkt-inv",
        name: "Investor VIP Pass",
        price: 25000,
        currency: "USDC",
        quantity: 200,
        sold: 45,
        benefits: '["Investor Exclusive Lounge access", "Pre-qualified Startup Pitch Decks List", "Premium Dining"]'
      }
    ]
  },
  "demo-green-growth": {
    id: "demo-green-growth",
    title: "EcoSmart Green Growth Conference",
    description: "Focusing on sustainability, carbon accounting protocols, and clean-energy infrastructure. Learn how companies use public ledger technologies to verify environmental impacts.",
    startDate: "2026-10-22T09:00:00.000Z",
    endDate: "2026-10-23T17:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    category: "Conference",
    capacity: 350,
    speakers: [
      {
        id: "spk-eco1",
        name: "Dr. David Suzuki II",
        bio: "Ecological researcher studying the effects of transparent ledgers on verifying supply chains.",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-eco1",
        title: "Tokenizing Carbon Offsets Securely",
        description: "A framework overview for integrating immutable trustlines to avoid duplicate asset counting.",
        startTime: "2026-10-22T13:30:00.000Z",
        endTime: "2026-10-22T15:00:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-eco-corp",
        name: "Corporate Delegate",
        price: 18000,
        currency: "USDC",
        quantity: 200,
        sold: 65,
        benefits: '["VIP Roundtable access", "Printed Carbon Report Booklet", "Sustainable Lunch Included"]'
      },
      {
        id: "tkt-eco-supp",
        name: "Green Supporter Pass",
        price: 4000,
        currency: "USDC",
        quantity: 150,
        sold: 88,
        benefits: '["General Seminar Admission", "1 Trees Planted Certificate"]'
      }
    ]
  },
  "demo-fintech-frontier": {
    id: "demo-fintech-frontier",
    title: "Fintech Frontiers & Digital Assets",
    description: "Debating the future of banking, decentralized credit scores, cross-border payment rails, and central bank digital currencies (CBDCs).",
    startDate: "2026-11-12T09:00:00.000Z",
    endDate: "2026-11-13T18:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
    category: "Conference",
    capacity: 500,
    speakers: [
      {
        id: "spk-fin1",
        name: "Satoshi Nakamoto V",
        bio: "Macroeconomic cryptofinance analyst mapping the scaling velocity of liquidity networks.",
        avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-fin1",
        title: "Interoperability in Global CBDC Design",
        description: "How centralized government networks integrate with public stellar-based anchors for instant payments.",
        startTime: "2026-11-12T11:00:00.000Z",
        endTime: "2026-11-12T12:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-fin-exec",
        name: "Executive Pass",
        price: 30000,
        currency: "USDC",
        quantity: 100,
        sold: 42,
        benefits: '["Front row reserved table", "Private lounge networking access", "Speakers Gala Dinner Ticket"]'
      },
      {
        id: "tkt-fin-std",
        name: "Standard Pass",
        price: 15000,
        currency: "USDC",
        quantity: 400,
        sold: 120,
        benefits: '["Access to main conference sessions", "Lunch and coffee breaks included"]'
      }
    ]
  },
  "demo-edu-innovate": {
    id: "demo-edu-innovate",
    title: "EduInnovate: Future of Learning",
    description: "Exploring adaptive learning platforms, decentralized student credentialing, and remote education strategies. Learn how blockchain can secure global academic transcripts.",
    startDate: "2026-11-20T09:00:00.000Z",
    endDate: "2026-11-21T16:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
    category: "Conference",
    capacity: 300,
    speakers: [
      {
        id: "spk-edu1",
        name: "Professor Jean Grey",
        bio: "Education theorist creating decentralized academic identity frameworks for secure credit transfer.",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-edu1",
        title: "Secure Verification of Academic Credentials",
        description: "A framework overview using cryptographic hashes to eliminate fake degrees and certify student achievements.",
        startTime: "2026-11-20T14:00:00.000Z",
        endTime: "2026-11-20T15:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-edu-educ",
        name: "Educator Discount Pass",
        price: 5500,
        currency: "USDC",
        quantity: 150,
        sold: 80,
        benefits: '["For teachers and professors", "Access to curriculum workshops", "Digital resource bundle"]'
      },
      {
        id: "tkt-edu-ga",
        name: "General Admission",
        price: 3000,
        currency: "USDC",
        quantity: 150,
        sold: 45,
        benefits: '["Standard access to panels and main stage presentations"]'
      }
    ]
  },
  "demo-design-vision": {
    id: "demo-design-vision",
    title: "Design Vision & UX Leadership Congress",
    description: "A gathering of design leaders, UI developers, and product managers. Discussions centered on human-centered design, glassmorphism, responsive web layouts, and interactive micro-animations.",
    startDate: "2026-12-08T09:00:00.000Z",
    endDate: "2026-12-09T18:00:00.000Z",
    banner: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    category: "Conference",
    capacity: 350,
    speakers: [
      {
        id: "spk-dsn1",
        name: "Don Norman II",
        bio: "Cognitive design consultant championing emotional design principles for immersive software.",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
      }
    ],
    sessions: [
      {
        id: "sess-dsn1",
        title: "Micro-interactions and Emotional Hooking",
        description: "How subtle button animations, HSL transitions, and layout fluidity build trust and delight.",
        startTime: "2026-12-08T10:00:00.000Z",
        endTime: "2026-12-08T11:30:00.000Z"
      }
    ],
    ticketTypes: [
      {
        id: "tkt-dsn-vip",
        name: "Full Access VIP",
        price: 22000,
        currency: "USDC",
        quantity: 70,
        sold: 26,
        benefits: '["Reserved front rows", "Design Critique workshop pass", "Portfolio review invitation"]'
      },
      {
        id: "tkt-dsn-std",
        name: "Standard Pass",
        price: 10000,
        currency: "USDC",
        quantity: 280,
        sold: 95,
        benefits: '["Access to all regular design panels and keynotes", "Networking reception ticket"]'
      }
    ]
  }
};

export const FALLBACK_EVENTS: Event[] = Object.values(FALLBACK_EVENTS_DETAIL).map(evt => ({
  id: evt.id,
  title: evt.title,
  description: evt.description,
  startDate: evt.startDate,
  banner: evt.banner || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
  category: evt.category,
  capacity: evt.capacity,
  ticketTypes: evt.ticketTypes.map(tkt => ({
    price: tkt.price,
    currency: tkt.currency
  }))
}));
