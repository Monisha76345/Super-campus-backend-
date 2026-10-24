import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ActivationTokenResDto } from "src/modules/user/dto/response/activation-token.res.dto";
import { OtpSentResDto } from "src/modules/user/dto/response/otp-sent.res.dto";
import { ApiResponseDto } from "../common/dto/api-response.dto";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { DirectoryResDto } from "src/modules/user/dto/response/directory.res.dto";
import { ActivateOtpReqDto } from "./dto/activate-otp.req.dto";
import { ActivateVerifyReqDto } from "./dto/activate-verify.req.dto";
import { AlumniClaimReqDto } from "./dto/alumni-claim.req.dto";
import { AlumniOtpReqDto } from "./dto/alumni-otp.req.dto";
import { AlumniVerifyReqDto } from "./dto/alumni-verify.req.dto";
import { ChangePasswordReqDto } from "./dto/change-password.req.dto";
import { ForgotPasswordOtpReqDto } from "./dto/forgot-password-otp.req.dto";
import { ForgotPasswordResetReqDto } from "./dto/forgot-password-reset.req.dto";
import { ForgotPasswordVerifyReqDto } from "./dto/forgot-password-verify.req.dto";
import { LoginReqDto } from "./dto/login.req.dto";
import { LoginResDto } from "./dto/login.res.dto";
import { ResetTokenResDto } from "./dto/reset-token.res.dto";
import { SetPasswordReqDto } from "./dto/set-password.req.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login",
    description:
      "Email and password. Campus accounts are created from the college directory. A local development account is used only when that email is not on the directory.",
  })
  @ApiOkResponse({ description: "JWT access token" })
  async login(@Body() body: LoginReqDto): Promise<ApiResponseDto<LoginResDto>> {
    return ApiResponseDto.success(await this.authService.login(body), "Success");
  }

  @Public()
  @Post("activate/otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a first-login code to a college email" })
  async activateOtp(@Body() body: ActivateOtpReqDto): Promise<ApiResponseDto<OtpSentResDto>> {
    return ApiResponseDto.success(await this.authService.requestActivation(body.email), "Success");
  }

  @Public()
  @Post("activate/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check the first-login code" })
  async activateVerify(@Body() body: ActivateVerifyReqDto): Promise<ApiResponseDto<ActivationTokenResDto>> {
    return ApiResponseDto.success(await this.authService.verifyActivation(body.email, body.otp), "Success");
  }

  @Public()
  @Post("activate/password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set a password and open the session" })
  async activatePassword(@Body() body: SetPasswordReqDto): Promise<ApiResponseDto<LoginResDto>> {
    return ApiResponseDto.success(await this.authService.completeActivation(body.activationToken, body.password), "Success");
  }

  @Public()
  @Post("forgot-password/otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a password reset OTP code to registered college email" })
  async forgotPasswordOtp(@Body() body: ForgotPasswordOtpReqDto): Promise<ApiResponseDto<OtpSentResDto>> {
    return ApiResponseDto.success(await this.authService.requestForgotPasswordOtp(body.email, body.tenantId), "Success");
  }

  @Public()
  @Post("forgot-password/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify forgot password OTP and receive a one-time reset token" })
  async forgotPasswordVerify(@Body() body: ForgotPasswordVerifyReqDto): Promise<ApiResponseDto<ResetTokenResDto>> {
    return ApiResponseDto.success(await this.authService.verifyForgotPasswordOtp(body.email, body.otp, body.tenantId), "Success");
  }

  @Public()
  @Post("forgot-password/reset")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password using verified reset token and open session" })
  async forgotPasswordReset(@Body() body: ForgotPasswordResetReqDto): Promise<ApiResponseDto<LoginResDto>> {
    return ApiResponseDto.success(await this.authService.resetPasswordWithToken(body.resetToken, body.password), "Success");
  }

  @Public()
  @Post("alumni/claim")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Submit an alumni USN and mobile number",
    description: "Saves the mobile number and waits for a campus admin to approve it. No session is opened.",
  })
  async alumniClaim(@Body() body: AlumniClaimReqDto): Promise<ApiResponseDto<DirectoryResDto>> {
    return ApiResponseDto.success(await this.authService.claimAlumni(body.usn, body.mobile, body.tenantId), "Success");
  }

  @Public()
  @Post("alumni/otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a code to an approved alumni mobile number" })
  async alumniOtp(@Body() body: AlumniOtpReqDto): Promise<ApiResponseDto<OtpSentResDto>> {
    return ApiResponseDto.success(
      await this.authService.requestAlumniOtp(body.usn, body.mobile, body.tenantId),
      "Success",
    );
  }

  @Public()
  @Post("alumni/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm the alumni code, set a password, and open the session" })
  async alumniVerify(@Body() body: AlumniVerifyReqDto): Promise<ApiResponseDto<LoginResDto>> {
    return ApiResponseDto.success(
      await this.authService.completeAlumni(body.usn, body.mobile, body.otp, body.password, body.tenantId),
      "Success",
    );
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Replace the signed-in account password" })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: ChangePasswordReqDto,
  ): Promise<ApiResponseDto<null>> {
    await this.authService.changePassword(user.sub, body.password);
    return ApiResponseDto.success(null, "Success");
  }
}
