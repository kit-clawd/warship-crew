// Ship layout - based on cross-section view
// Y increases downward, deck 0 is top (weather deck)
export const SHIP_CONFIG = {
  width: 1100,
  height: 600,
  deckHeight: 120,
  decks: 5, // Weather deck + 3 gun decks + hold
};

// Station types and their properties
export const STATION_TYPES = {
  CANNON_UPPER: {
    name: 'Upper Gun',
    crewRequired: 2,
    crewMax: 4,
    deck: 1,
    fireRate: 3000, // ms between shots
    damage: 15,
    color: 0xcc4444,
  },
  CANNON_MIDDLE: {
    name: 'Middle Gun',
    crewRequired: 3,
    crewMax: 5,
    deck: 2,
    fireRate: 4000,
    damage: 25,
    color: 0xdd3333,
  },
  CANNON_LOWER: {
    name: 'Lower Gun',
    crewRequired: 4,
    crewMax: 6,
    deck: 3,
    fireRate: 5000,
    damage: 40, // 32-pounders hit hard
    color: 0xee2222,
  },
  POWDER_ROOM: {
    name: 'Powder Room',
    crewRequired: 2,
    crewMax: 4,
    deck: 4,
    supplyRate: 1000, // ms per powder unit
    color: 0xffaa00,
  },
  SURGERY: {
    name: 'Surgery',
    crewRequired: 1,
    crewMax: 3,
    deck: 4,
    healRate: 5000, // ms per heal tick
    healAmount: 20,
    color: 0x44cc44,
  },
  PUMPS: {
    name: 'Pumps',
    crewRequired: 2,
    crewMax: 6,
    deck: 4,
    pumpRate: 2000, // ms per water unit removed
    color: 0x4488cc,
  },
  MARINES: {
    name: 'Marines',
    crewRequired: 0,
    crewMax: 8,
    deck: 0,
    defendPower: 10, // per marine
    color: 0x884444,
  },
} as const;

// Crew configuration
export const CREW_CONFIG = {
  startingCrew: 25,
  baseHealth: 100,
  baseMorale: 100,
  moveSpeed: 150, // pixels per second
  size: 16, // visual size
};

// Crisis types
export const CRISIS_TYPES = {
  FIRE: {
    name: 'Fire',
    spreadRate: 8000,
    damageRate: 2000,
    crewToDouse: 2,
    color: 0xff6600,
  },
  FLOODING: {
    name: 'Flooding',
    spreadRate: 10000,
    damageRate: 3000,
    crewToPump: 3,
    color: 0x0066ff,
  },
  BOARDERS: {
    name: 'Boarders',
    count: 5,
    health: 80,
    damage: 15,
    color: 0x880000,
  },
} as const;

// Enemy ship config
export const ENEMY_CONFIG = {
  baseHealth: 500,
  fireRate: 6000,
  damage: 20,
  crisisChance: 0.3, // chance each hit causes a crisis
};

// Colors
export const COLORS = {
  hull: 0x8b4513,
  hullDark: 0x654321,
  deck: 0xdeb887,
  water: 0x1a5276,
  sky: 0x87ceeb,
  crew: 0xffcc88,
  crewSelected: 0xffff00,
  crewInjured: 0xff8888,
};
