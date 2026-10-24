import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { BufferedFile } from "src/common/s3-client/file.model";
import { ROLES } from "src/core/common/constants/roles";
import { CurrentUser, JwtPayload } from "src/core/common/decorators/current-user.decorator";
import { Roles } from "src/core/common/decorators/roles.decorator";
import { ApiResponseDto } from "src/core/common/dto/api-response.dto";
import { PageQueryDto } from "../dto/request/page-query.dto";
import { SetHosteliteReqDto } from "../dto/request/set-hostelite.req.dto";
import { DirectoryResDto } from "../dto/response/directory.res.dto";
import { ImportBatchResDto } from "../dto/response/import-batch.res.dto";
import { PendingAlumniPageResDto } from "../dto/response/pending-alumni.res.dto";
import { UserService } from "../service/user.service";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("import")
  @Roles(ROLES.CAMPUS_ADMIN, ROLES.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @ApiOperation({
    summary: "Import the college directory",
    description:
      "CSV columns: USN, full name, college email (@nmit.ac.in), password, department, batch, program, hostelite (yes/no), role, mobile. Student, faculty, and admin rows include the college password. Alumni rows wait for admin approval of USN and mobile.",
  })
  async importDirectory(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: BufferedFile,
  ): Promise<ApiResponseDto<ImportBatchResDto>> {
    if (!file?.buffer?.length) {
      throw new BadRequestException("A CSV file is required");
    }
    const name = file.originalname?.toLowerCase() ?? "";
    if (name && !name.endsWith(".csv") && !name.endsWith(".txt")) {
      throw new BadRequestException("Upload a CSV file");
    }
    const result = await this.userService.importDirectory(user.sub, file.originalname, file.buffer);
    return ApiResponseDto.success(result, "Success");
  }

  @Patch("directory/:usn/hostelite")
  @Roles(ROLES.WARDEN, ROLES.SUPER_ADMIN, ROLES.CAMPUS_ADMIN)
  @ApiOperation({ summary: "Mark a student as a hostelite or a day scholar (Warden / Super Admin)" })
  async setHostelite(
    @CurrentUser() user: JwtPayload,
    @Param("usn") usn: string,
    @Body() body: SetHosteliteReqDto,
  ): Promise<ApiResponseDto<DirectoryResDto>> {
    const result = await this.userService.setHostelite(user.sub, usn, body.isHostelite);
    return ApiResponseDto.success(result, "Success");
  }

  @Post("directory/:usn/alumni")
  @Roles(ROLES.CAMPUS_ADMIN, ROLES.SUPER_ADMIN)
  @ApiOperation({
    summary: "Convert a student to alumni",
    description: "College email login stops. The person submits a USN and mobile number, then an admin approves it.",
  })
  async convertToAlumni(
    @CurrentUser() user: JwtPayload,
    @Param("usn") usn: string,
  ): Promise<ApiResponseDto<DirectoryResDto>> {
    const result = await this.userService.convertToAlumni(user.sub, usn);
    return ApiResponseDto.success(result, "Success");
  }

  @Get("alumni/pending")
  @Roles(ROLES.CAMPUS_ADMIN, ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: "List alumni waiting for approval" })
  async pendingAlumni(@Query() query: PageQueryDto): Promise<ApiResponseDto<PendingAlumniPageResDto>> {
    const result = await this.userService.listPendingAlumni(query.page ?? 1, query.limit ?? 20);
    return ApiResponseDto.success(result, "Success");
  }

  @Post("directory/:usn/alumni/approve")
  @Roles(ROLES.CAMPUS_ADMIN, ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: "Approve an alumni USN and mobile number" })
  async approveAlumni(
    @CurrentUser() user: JwtPayload,
    @Param("usn") usn: string,
  ): Promise<ApiResponseDto<DirectoryResDto>> {
    const result = await this.userService.approveAlumni(user.sub, usn);
    return ApiResponseDto.success(result, "Success");
  }

  @Post("directory/:usn/alumni/reject")
  @Roles(ROLES.CAMPUS_ADMIN, ROLES.SUPER_ADMIN)
  @ApiOperation({ summary: "Reject an alumni mobile claim" })
  async rejectAlumni(
    @CurrentUser() user: JwtPayload,
    @Param("usn") usn: string,
  ): Promise<ApiResponseDto<DirectoryResDto>> {
    const result = await this.userService.rejectAlumni(user.sub, usn);
    return ApiResponseDto.success(result, "Success");
  }
}
