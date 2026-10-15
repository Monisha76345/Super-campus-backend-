import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { runWithTenant } from "./tenant-context.service";

export const TENANT_HEADER = "x-tenant-id";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers[TENANT_HEADER];
    const tenantId = Array.isArray(header) ? header[0] : header;
    runWithTenant(tenantId ?? null, () => next());
  }
}
