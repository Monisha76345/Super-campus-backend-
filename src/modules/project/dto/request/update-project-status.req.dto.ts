import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { ProjectStatus } from "../../entity/enums/project-status.enum";

export class UpdateProjectStatusReqDto {
  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}
