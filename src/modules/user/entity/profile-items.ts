import { ProfileVisibility } from "./enums/profile-visibility.enum";

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  startDate: string | null;
  endDate: string | null;
  visibility: ProfileVisibility;
}

export interface ExperienceItem {
  id: string;
  employer: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  visibility: ProfileVisibility;
}

export interface SkillItem {
  id: string;
  name: string;
}
