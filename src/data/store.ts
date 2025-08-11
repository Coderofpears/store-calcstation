import { defaultGames, type Game } from "./games";

export interface Announcement {
  id: string;
  image: string;
  alt: string;
  href?: string;
}

const GAMES_KEY = "neon_store_games_v1";
const OWNED_KEY = "neon_store_owned_v1";
const ANNOUNCEMENTS_KEY = "neon_store_announcements_v1";

export function loadGames(): Game[] {
  const raw = localStorage.getItem(GAMES_KEY);
  if (!raw) return defaultGames;
  try {
    const parsed = JSON.parse(raw) as Game[];
    return parsed.length ? parsed : defaultGames;
  } catch {
    return defaultGames;
  }
}

export function saveGames(games: Game[]) {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
}

export function loadOwned(): string[] {
  const raw = localStorage.getItem(OWNED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addOwned(id: string) {
  const owned = new Set(loadOwned());
  owned.add(id);
  localStorage.setItem(OWNED_KEY, JSON.stringify(Array.from(owned)));
}

export function loadAnnouncements(): Announcement[] {
  const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Announcement[];
  } catch {
    return [];
  }
}

export function saveAnnouncements(list: Announcement[]) {
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list));
}
