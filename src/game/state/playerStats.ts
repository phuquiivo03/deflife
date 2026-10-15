/** Identity, health, and mood stay stubbed until that sim loop exists. Skills, energy, and money live on the career store. */
export type PlayerStats = {
  name: string;
  title: string;
  level: number;
  exp: number;
  expMax: number;
  health: number;
  mood: number;
};

export const STUB_PLAYER: PlayerStats = {
  name: "Quí",
  title: "Sinh viên",
  level: 3,
  exp: 62,
  expMax: 100,
  health: 78,
  mood: 85,
};
