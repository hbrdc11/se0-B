export enum Tab {
  HOME = 'HOME',
  MEMORIES = 'MEMORIES',
  MAP = 'MAP',
  GAMES = 'GAMES',
  LETTER = 'LETTER'
}

export interface Memory {
  id: string;
  url: string;
  caption: string;
  date: string;
  category?: 'Biz' | 'Sen' | 'Çiçekler' | 'Anlar' | string; // Added category
}

export interface Minigame {
  id: string;
  title: string;
  description: string;
  icon: string;
  isLocked: boolean;
}

export type NoteCategory = 'Hepsi' | 'Gelecek' | 'Anı' | 'Rastgele';

export interface StickyNote {
  id: string;
  text: string;
  category: NoteCategory;
  color: string;
  date: string;
  rotation: number;
}

// --- List Types (Plans & Wishes) ---
export interface ListItem {
  id: string;
  text: string;
  isCompleted: boolean;
  date?: string; // Target date for plans
  createdAt: string;
  type: 'plan' | 'wish';
}

// --- Trip Game Types ---
export interface GameEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'obstacle' | 'powerup';
  subtype?: 'past-issue' | 'distraction' | 'rose' | 'chocolate';
  speed: number;
}

export interface TripQuestion {
  id: number;
  question: string;
  options: { text: string; effect: 'good' | 'bad' | 'neutral' }[];
}