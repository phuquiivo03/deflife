import careerMilestones from "../../../config/career_milestones.json";
import gameConfig from "../../../config/game_config.json";
import jobTemplateRequirements from "../../../config/job_template_requirements.json";
import jobTemplateXp from "../../../config/job_template_xp.json";
import jobTemplates from "../../../config/job_templates.json";
import skillLevelXp from "../../../config/skill_level_xp.json";
import skills from "../../../config/skills.json";
import studyActivities from "../../../config/study_activities.json";
import studyActivityXp from "../../../config/study_activity_xp.json";
import type { SimCatalog } from "./types";

export const SIM_CATALOG = {
  config: gameConfig,
  skills,
  skillLevelXp,
  studyActivities,
  studyActivityXp,
  jobTemplates,
  jobTemplateRequirements,
  jobTemplateXp,
  milestones: careerMilestones,
} as SimCatalog;
