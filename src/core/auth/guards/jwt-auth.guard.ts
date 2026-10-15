import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { JwtPayload } from "../../common/decorators/current-user.decorator";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator";
import { TenantContextService } from "../../tenant/tenant-context.service";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err) {
      throw err;
    }
    if (!user) {
      throw new UnauthorizedException("Missing or invalid token. Send Authorization: Bearer <token>.");
    }
    const payload = user as unknown as JwtPayload;
    if (payload.tenantId) {
      this.tenantContext.setTenantId(payload.tenantId);
    }
    return user;
  }
}
