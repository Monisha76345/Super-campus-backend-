import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

interface TenantState {
  tenantId: string | null;
}

const storage = new AsyncLocalStorage<TenantState>();

export function runWithTenant<T>(tenantId: string | null, fn: () => T): T {
  return storage.run({ tenantId }, fn);
}

@Injectable()
export class TenantContextService {
  setTenantId(tenantId: string): void {
    const state = storage.getStore();
    if (state) {
      state.tenantId = tenantId;
      return;
    }
    storage.enterWith({ tenantId });
  }

  getTenantId(): string {
    const tenantId = storage.getStore()?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant context is not set. Send X-Tenant-Id or a token that includes tenantId.");
    }
    return tenantId;
  }
}
