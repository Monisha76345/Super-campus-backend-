import { ApiProperty } from "@nestjs/swagger";

export class MarketplaceLikeResDto {
  @ApiProperty()
  isLiked: boolean;

  @ApiProperty()
  likeCount: number;
}
