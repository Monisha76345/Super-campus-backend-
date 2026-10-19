import { ProjectCategory } from "../../entity/enums/project-category.enum";
import { ProjectStage } from "../../entity/enums/project-stage.enum";
import { ProjectStatus } from "../../entity/enums/project-status.enum";
import { ProjectSupportType } from "../../entity/enums/project-support-type.enum";
import { ProjectVisibility } from "../../entity/enums/project-visibility.enum";

export class ProjectSupportResDto {
  id: string;
  serviceType: ProjectSupportType;
  rolesNeeded: string | null;
  numberOfStudents: string | null;
  commitment: string | null;
  preferredSkills: string | null;
  mentorDomain: string | null;
  fundingDetails: string | null;
}

export class ProjectMediaResDto {
  id: string;
  mediaType: string;
  fileUrl: string;
  fileName: string | null;
}

export class ProjectResDto {
  id: string;
  campusId: string;
  creatorId: string;
  creatorName: string | null;
  creatorUsn: string | null;
  title: string;
  shortDescription: string;
  moreDetails: string | null;
  category: ProjectCategory;
  stage: ProjectStage;
  status: ProjectStatus;
  duration: string;
  location: string;
  visibility: ProjectVisibility;
  bannerUrl: string | null;
  skills: string[];
  supportNeeds: ProjectSupportResDto[];
  media: ProjectMediaResDto[];
  createdAt: string;
  updatedAt: string;
}
