import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../../common/decorators/current-user.decorator";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("jwt.accessSecret") ?? "change-me",
    });
  }

  validate(payload: {
    sub?: string;
    email?: string;
    roles?: string[];
    tenantId?: string;
    hostelite?: boolean;
  }): JwtPayload {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException("Invalid token payload");
    }
    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
      tenantId: payload.tenantId ?? "",
      hostelite: Boolean(payload.hostelite),
    };
  }
}
