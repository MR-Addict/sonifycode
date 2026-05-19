export type MusicEvent = {
  type: 'chord' | 'melody' | 'kick' | 'hat';
  notes: string | string[];
  duration: string;
  time: number; // in seconds
  token: string;
  index: number;
  charIndex: number;
};
