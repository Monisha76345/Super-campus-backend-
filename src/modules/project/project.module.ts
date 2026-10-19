import { Module, OnModuleInit } from "@nestjs/common";
import { registerEntities } from "src/core/database/entities.registry";
import { ProjectController } from "./controller/project.controller";
import { ProjectMedia } from "./entity/project-media.model";
import { ProjectSkill } from "./entity/project-skill.model";
import { ProjectSupport } from "./entity/project-support.model";
import { Project } from "./entity/project.model";
import { ProjectDataService } from "./service/project-data.service";
import { ProjectService } from "./service/project.service";

@Module({
  controllers: [ProjectController],
  providers: [ProjectDataService, ProjectService],
  exports: [ProjectService],
})
export class ProjectModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([Project, ProjectSkill, ProjectSupport, ProjectMedia]);
  }
}
