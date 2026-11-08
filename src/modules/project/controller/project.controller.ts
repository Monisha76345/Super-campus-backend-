import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { CreateProjectReqDto } from "../dto/request/create-project.req.dto";
import { ProjectQueryDto } from "../dto/request/project-query.dto";
import { UpdateProjectStatusReqDto } from "../dto/request/update-project-status.req.dto";
import {
  ProjectApplicationResDto,
  ProjectContributionResDto,
  ProjectResDto,
} from "../dto/response/project.res.dto";
import { ProjectService } from "../service/project.service";

@ApiTags("Projects")
@ApiBearerAuth()
@Controller("projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({
    summary: "Publish a new campus project",
    description: "Accepts 3-step project data including required skills, funding targets, and support services.",
  })
  async createProject(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProjectReqDto,
  ): Promise<ApiResponseDto<ProjectResDto>> {
    const result = await this.projectService.createProject(user, dto);
    return ApiResponseDto.success(result, "Project created successfully");
  }

  @Get()
  @ApiOperation({
    summary: "List projects",
    description: "Filter by status, category, domain, supportOffered, supportRequired, or search query.",
  })
  async listProjects(
    @CurrentUser() user: JwtPayload,
    @Query() query: ProjectQueryDto,
  ): Promise<ApiResponseDto<ProjectResDto[]>> {
    const result = await this.projectService.findAll(user, query);
    return ApiResponseDto.success(result, "Success");
  }

  @Get("my")
  @ApiOperation({
    summary: "List current user's projects",
  })
  async myProjects(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseDto<ProjectResDto[]>> {
    const result = await this.projectService.findMyProjects(user);
    return ApiResponseDto.success(result, "Success");
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get project details by ID",
  })
  async getProject(
    @Param("id") id: string,
  ): Promise<ApiResponseDto<ProjectResDto>> {
    const result = await this.projectService.findById(id);
    return ApiResponseDto.success(result, "Success");
  }

  @Patch(":id/status")
  @ApiOperation({
    summary: "Update project status",
    description: "Transitions project status between OPEN, ACTIVE, COMPLETED, and ARCHIVED.",
  })
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: UpdateProjectStatusReqDto,
  ): Promise<ApiResponseDto<ProjectResDto>> {
    const result = await this.projectService.updateStatus(user, id, body.status);
    return ApiResponseDto.success(result, "Project status updated successfully");
  }

  @Post(":id/fund")
  @ApiOperation({
    summary: "Fund a project via College Funding or Crowdfunding",
  })
  async fundProject(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body()
    body: {
      amount: number;
      fundingType: "COLLEGE_FUNDING" | "CROWDFUNDING";
      notes?: string;
      paymentMethod?: string;
      orderId?: string;
    },
  ): Promise<ApiResponseDto<{ contribution: ProjectContributionResDto; project: ProjectResDto }>> {
    const result = await this.projectService.fundProject(user, id, body);
    return ApiResponseDto.success(result, "Contribution verified and recorded successfully");
  }

  @Post(":id/apply")
  @ApiOperation({
    summary: "Apply for a team role or mentorship in a project",
  })
  async applyToProject(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body()
    body: {
      roleApplied: string;
      supportId?: string;
      message?: string;
    },
  ): Promise<ApiResponseDto<ProjectApplicationResDto>> {
    const result = await this.projectService.applyToProject(user, id, body);
    return ApiResponseDto.success(result, "Application submitted successfully");
  }

  @Get(":id/applications")
  @ApiOperation({
    summary: "Get applicants for a project",
  })
  async getApplications(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<ProjectApplicationResDto[]>> {
    const result = await this.projectService.getApplications(user, id);
    return ApiResponseDto.success(result, "Success");
  }

  @Get(":id/contributions")
  @ApiOperation({
    summary: "Get funding contributions / backers for a project",
  })
  async getContributions(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<ProjectContributionResDto[]>> {
    const result = await this.projectService.getContributions(user, id);
    return ApiResponseDto.success(result, "Success");
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete project (soft delete)",
  })
  async deleteProject(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.projectService.deleteProject(user, id);
    return ApiResponseDto.success(null, "Project deleted successfully");
  }
}
