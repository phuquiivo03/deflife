/** The display name stays a placeholder. Health and mood live on the career player. */
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
