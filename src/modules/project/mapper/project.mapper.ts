import { ProjectResDto } from "../dto/response/project.res.dto";
import { Project } from "../entity/project.model";

export class ProjectMapper {
  static toResponse(row: Project): ProjectResDto {
    return {
      id: row.id,
      campusId: row.campusId,
      creatorId: row.creatorId,
      creatorName: row.creatorName ?? null,
      creatorUsn: row.creatorUsn ?? null,
      creatorRole: row.creatorRole ?? null,
      creatorDepartment: row.creatorDepartment ?? null,
      creatorEmployeeId: row.creatorEmployeeId ?? null,
      creatorBatch: row.creatorBatch ?? null,
      title: row.title,
      shortDescription: row.shortDescription,
      moreDetails: row.moreDetails ?? null,
      category: row.category,
      stage: row.stage,
      status: row.status,
      duration: row.duration,
      location: row.location,
      visibility: row.visibility,
      bannerUrl: row.bannerUrl ?? null,
      fundingTarget: Number(row.fundingTarget) || 0,
      fundingRaised: Number(row.fundingRaised) || 0,
      backersCount: Number(row.backersCount) || 0,
      skills: row.skills ? row.skills.map((s) => s.skillName) : [],
      supportNeeds: row.supportNeeds
        ? row.supportNeeds.map((s) => ({
            id: s.id,
            serviceType: s.serviceType,
            rolesNeeded: s.rolesNeeded ?? null,
            numberOfStudents: s.numberOfStudents ?? null,
            commitment: s.commitment ?? null,
            preferredSkills: s.preferredSkills ?? null,
            mentorDomain: s.mentorDomain ?? null,
            fundingDetails: s.fundingDetails ?? null,
          }))
        : [],
      media: row.media
        ? row.media.map((m) => ({
            id: m.id,
            mediaType: m.mediaType,
            fileUrl: m.fileUrl,
            fileName: m.fileName ?? null,
          }))
        : [],
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : new Date(row.createdAt).toISOString(),
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : new Date(row.updatedAt).toISOString(),
    };
  }
}
