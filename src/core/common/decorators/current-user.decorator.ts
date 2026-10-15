import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  tenantId: string;
  hostelite?: boolean;
}

export const CurrentUser = createParamDecorator((data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
  const user = request.user;
  return data && user ? user[data] : user;
});
