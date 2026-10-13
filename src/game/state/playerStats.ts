/** Stub player stats for UI chrome until the sim loop exists. */
export type SkillId = "frontend" | "backend" | "algorithms";

export type PlayerStats = {
  name: string;
  title: string;
  level: number;
  exp: number;
  expMax: number;
  health: number;
  mood: number;
  energy: number;
  money: number;
  day: number;
  skills: Record<
    SkillId,
    { label: string; value: number; icon: string; bar: "coral" | "mint" | "sky" }
  >;
};

export const STUB_PLAYER: PlayerStats = {
  name: "Quí",
  title: "Sinh viên",
  level: 3,
  exp: 62,
  expMax: 100,
  health: 78,
  mood: 85,
  energy: 64,
  money: 2_450_000,
  day: 12,
  skills: {
    frontend: {
      label: "Frontend",
      value: 72,
      icon: "code-window",
      bar: "coral",
    },
    backend: {
      label: "Backend",
      value: 58,
      icon: "server",
      bar: "mint",
    },
    algorithms: {
      label: "Thuật toán",
      value: 45,
      icon: "brain",
      bar: "sky",
    },
  },
};
