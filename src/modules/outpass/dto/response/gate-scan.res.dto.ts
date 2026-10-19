import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OutpassResDto } from "./outpass.res.dto";

export class GateScanResDto {
  @ApiProperty({ description: "Action logged by the gate scanner", example: "EXIT" })
  actionTaken: "EXIT" | "ENTRY";

  @ApiProperty({ description: "Updated outpass request" })
  outpass: OutpassResDto;

  @ApiPropertyOptional({ description: "Parent phone number notified", example: "+919876543210" })
  parentPhone: string | null;

  @ApiProperty({ description: "Whether the SMS was successfully triggered", example: true })
  smsSent: boolean;

  @ApiProperty({ description: "Text content of the notification message" })
  messageText: string;
}
