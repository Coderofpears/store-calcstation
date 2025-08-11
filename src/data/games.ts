import cyberRacer from "@/assets/covers/cyber-racer.jpg";
import crystalRealm from "@/assets/covers/crystal-realm.jpg";
import stellarBlitz from "@/assets/covers/stellar-blitz.jpg";

export interface Edition {
  id: string;
  name: string;
  price: number; // USD
  includesBase?: boolean;
}

export interface DLC {
  id: string;
  name: string;
  price: number;
}

export interface Game {
  id: string;
  title: string;
  cover: string;
  price: number;
  tags: string[];
  description: string;
  editions: Edition[];
  dlcs: DLC[];
  screenshots?: string[];
  trailerUrl?: string;
}

export const defaultGames: Game[] = [
  {
    id: "cyber-racer",
    title: "Cyber Racer: Neon Drift",
    cover: cyberRacer,
    price: 29.99,
    tags: ["Racing", "Cyberpunk", "Arcade"],
    description:
      "Drift through neon-lit streets in a high-speed cyberpunk metropolis. Master tight corners, outrun rivals, and chase leaderboard glory.",
    editions: [
      { id: "standard", name: "Standard", price: 29.99, includesBase: true },
      { id: "deluxe", name: "Deluxe Edition", price: 44.99, includesBase: true },
    ],
    dlcs: [
      { id: "soundtrack", name: "Original Soundtrack", price: 6.99 },
      { id: "nightpack", name: "Midnight City Pack", price: 9.99 },
    ],
    screenshots: [cyberRacer],
  },
  {
    id: "crystal-realm",
    title: "Crystal Realm: Ascension",
    cover: crystalRealm,
    price: 49.99,
    tags: ["RPG", "Fantasy", "Open World"],
    description:
      "Forge your legend in a vast realm of crystal spires and ancient magic. Quest, craft, and uncover secrets lost to time.",
    editions: [
      { id: "standard", name: "Standard", price: 49.99, includesBase: true },
      { id: "collectors", name: "Collector's Edition", price: 69.99, includesBase: true },
    ],
    dlcs: [
      { id: "expansion1", name: "Shards of the Ancients", price: 14.99 },
      { id: "skins", name: "Runebound Cosmetics", price: 4.99 },
    ],
    screenshots: [crystalRealm],
  },
  {
    id: "stellar-blitz",
    title: "Stellar Blitz",
    cover: stellarBlitz,
    price: 19.99,
    tags: ["Shooter", "Space", "Retro"],
    description:
      "A retro-futuristic space shooter with tight controls and dazzling neon effects. Blast through waves and boss encounters.",
    editions: [
      { id: "standard", name: "Standard", price: 19.99, includesBase: true },
      { id: "ultimate", name: "Ultimate Edition", price: 29.99, includesBase: true },
    ],
    dlcs: [
      { id: "skinspack", name: "Vaporwave Skins", price: 3.99 },
      { id: "levels", name: "Constellation Levels Pack", price: 7.99 },
    ],
    screenshots: [stellarBlitz],
  },
];
