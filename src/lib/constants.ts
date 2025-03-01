import { CountryClass, WeaponType, WeaponStats } from "@/types";

export const COUNTRIES: Record<string, CountryClass> = {
  usa: {
    id: "usa",
    name: "United States",
    description: "Balanced fighter with good all-around stats.",
    bonuses: {
      health: 100,
      attack: 10,
      defense: 10,
      speed: 10,
    },
  },
  japan: {
    id: "japan",
    name: "Japan",
    description: "Fast fighter with high speed but lower defense.",
    bonuses: {
      health: 90,
      attack: 12,
      defense: 8,
      speed: 15,
    },
  },
  russia: {
    id: "russia",
    name: "Russia",
    description: "Tank fighter with high health and defense but lower speed.",
    bonuses: {
      health: 120,
      attack: 8,
      defense: 15,
      speed: 7,
    },
  },
  brazil: {
    id: "brazil",
    name: "Brazil",
    description: "Agile fighter with high attack but lower health.",
    bonuses: {
      health: 85,
      attack: 15,
      defense: 8,
      speed: 12,
    },
  },
};

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  knife: {
    damage: 5,
    speed: 15,
    range: 1,
  },
  axe: {
    damage: 10,
    speed: 8,
    range: 2,
  },
  battleaxe: {
    damage: 15,
    speed: 5,
    range: 3,
  },
  sword: {
    damage: 12,
    speed: 10,
    range: 2,
  },
};

export const TRANSACTION_TYPES = {
  CHARACTER_CREATION: "CHARACTER_CREATION",
  DUEL_STAKE: "DUEL_STAKE",
  DUEL_REWARD: "DUEL_REWARD",
};

export const BATTLE_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
}; 