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
import { ProjectResDto } from "../dto/response/project.res.dto";
import { ProjectService } from "../service/project.service";

@ApiTags("Projects")
@ApiBearerAuth()
@Controller("projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({
    summary: "Publish a new campus project",
    description: "Accepts 3-step project data including required skills and support services.",
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
    description: "Filter by status (OPEN, ACTIVE, COMPLETED), category, or search query.",
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
