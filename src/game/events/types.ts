export type GameEvent =
  | {
      type: "skillXpGained";
      skillId: string;
      amount: number;
      level: number;
      xp: number;
    }
  | {
      type: "skillLevelUp";
      skillId: string;
      level: number;
      rankId: string;
    }
  | {
      type: "studyCompleted";
      activityId: string;
      skillId: string;
      xp: number;
    }
  | {
      type: "jobBoardRefreshed";
      day: number;
      jobIds: string[];
    }
  | {
      type: "jobAccepted";
      jobId: string;
      templateId: string;
    }
  | {
      type: "jobCompleted";
      jobId: string;
      templateId: string;
      pay: number;
    }
  | {
      type: "milestoneReached";
      milestoneId: string;
      freelanceCompleted: number;
    }
  | {
      type: "moneyChanged";
      delta: number;
      money: number;
    }
  | {
      type: "energyChanged";
      delta: number;
      energy: number;
    };

export type GameEventType = GameEvent["type"];

export type GameEventOf<T extends GameEventType> = Extract<GameEvent, { type: T }>;
