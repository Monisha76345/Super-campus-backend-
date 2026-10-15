import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Success" })
  message: string;

  @ApiPropertyOptional({ nullable: true })
  data: T | null;

  @ApiPropertyOptional({ example: null })
  errorCode?: string | null;

  constructor(partial: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
  }

  static success<T>(data: T | null, message = "Success"): ApiResponseDto<T> {
    return new ApiResponseDto<T>({
      success: true,
      message,
      data,
      errorCode: null,
    });
  }

  static error(message: string, errorCode?: string, data: unknown = null): ApiResponseDto<unknown> {
    return new ApiResponseDto({
      success: false,
      message,
      data,
      errorCode: errorCode ?? null,
    });
  }
}
