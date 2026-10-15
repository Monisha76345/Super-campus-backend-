import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtPayload } from "../common/decorators/current-user.decorator";
import { runWithAuditContext } from "./audit-context";

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return new Observable((subscriber) => {
      runWithAuditContext({ userId: request.user?.sub }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
