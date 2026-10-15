/** Name, health, and mood stay stubbed until that sim loop exists. */
export type PlayerStats = {
  name: string;
  health: number;
  mood: number;
};

export const VITAL_MAX = 100;

export const STUB_PLAYER: PlayerStats = {
  name: "Quí",
  health: 78,
  mood: 85,
};
