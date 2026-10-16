import taskRunConfig from "../../../config/task_run.json";
import type { TaskRunConfig } from "./types";

export const TASK_RUN = taskRunConfig as TaskRunConfig;

export function taskDurationSec(config: Pick<TaskRunConfig, "ticket_sec" | "build_sec" | "test_sec">): number {
  return config.ticket_sec + config.build_sec + config.test_sec;
}
