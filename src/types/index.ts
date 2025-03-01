import { User, Character, Battle, Transaction } from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash"> & {
  passwordHash?: undefined;
};

export type CharacterWithUser = Character & {
  user: SafeUser;
};

export type BattleWithUsers = Battle & {
  challenger: SafeUser;
  challenged: SafeUser;
  character?: Character;
};

export type TransactionWithUser = Transaction & {
  user: SafeUser;
};

export type SpriteData = {
  head: number;
  body: number;
  weapon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

export type CountryClass = {
  id: string;
  name: string;
  description: string;
  bonuses: {
    health: number;
    attack: number;
    defense: number;
    speed: number;
  };
};

export type WeaponType = "knife" | "axe" | "battleaxe" | "sword";

export type WeaponStats = {
  damage: number;
  speed: number;
  range: number;
}; 