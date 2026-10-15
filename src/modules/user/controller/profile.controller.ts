import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { BufferedFile } from "src/common/s3-client/file.model";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { EducationItemReqDto } from "../dto/request/education-item.req.dto";
import { ExperienceItemReqDto } from "../dto/request/experience-item.req.dto";
import { SkillItemReqDto } from "../dto/request/skill-item.req.dto";
import { UpdateProfileReqDto } from "../dto/request/update-profile.req.dto";
import { ProfileResDto } from "../dto/response/profile.res.dto";
import { ProfileService } from "../service/profile.service";

@ApiTags("Profile")
@ApiBearerAuth()
@Controller("profile")
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Get()
  @ApiOperation({ summary: "Read the signed-in campus profile" })
  async getMine(@CurrentUser() user: JwtPayload): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.getMine(user.sub), "Success");
  }

  @Patch()
  @ApiOperation({ summary: "Update the signed-in campus profile" })
  async updateMine(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateProfileReqDto,
  ): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.updateMine(user.sub, body), "Success");
  }

  @Post("photo")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } })
  @ApiOperation({ summary: "Upload the profile photo" })
  async uploadPhoto(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: BufferedFile,
  ): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.uploadPhoto(user.sub, file), "Success");
  }

  @Post("education")
  @ApiOperation({ summary: "Add an education entry" })
  async addEducation(
    @CurrentUser() user: JwtPayload,
    @Body() body: EducationItemReqDto,
  ): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.addEducation(user.sub, body), "Success");
  }

  @Patch("education/:itemId")
  @ApiOperation({ summary: "Update an education entry" })
  async updateEducation(
    @CurrentUser() user: JwtPayload,
    @Param("itemId") itemId: string,
    @Body() body: EducationItemReqDto,
  ): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.updateEducation(user.sub, itemId, body), "Success");
  }

  @Delete("education/:itemId")
  @ApiOperation({ summary: "Remove an education entry" })
  async removeEducation(
    @CurrentUser() user: JwtPayload,
    @Param("itemId") itemId: string,
  ): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.removeEducation(user.sub, itemId), "Success");
  }

  @Post("experience")
  @ApiOperation({ summary: "Add an experience entry" })
  async addExperience(
    @CurrentUser() user: JwtPayload,
    @Body() body: ExperienceItemReqDto,
  ): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.addExperience(user.sub, body), "Success");
  }

  @Patch("experience/:itemId")
  @ApiOperation({ summary: "Update an experience entry" })
  async updateExperience(
    @CurrentUser() user: JwtPayload,
    @Param("itemId") itemId: string,
    @Body() body: ExperienceItemReqDto,
  ): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.updateExperience(user.sub, itemId, body), "Success");
  }

  @Delete("experience/:itemId")
  @ApiOperation({ summary: "Remove an experience entry" })
  async removeExperience(
    @CurrentUser() user: JwtPayload,
    @Param("itemId") itemId: string,
  ): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.removeExperience(user.sub, itemId), "Success");
  }

  @Post("skills")
  @ApiOperation({ summary: "Add a skill" })
  async addSkill(@CurrentUser() user: JwtPayload, @Body() body: SkillItemReqDto): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.addSkill(user.sub, body), "Success");
  }

  @Delete("skills/:itemId")
  @ApiOperation({ summary: "Remove a skill" })
  async removeSkill(
    @CurrentUser() user: JwtPayload,
    @Param("itemId") itemId: string,
  ): Promise<ApiResponseDto<ProfileResDto>> {
    return ApiResponseDto.success(await this.profiles.removeSkill(user.sub, itemId), "Success");
  }
}
