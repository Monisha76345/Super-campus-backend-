import { AsyncLocalStorage } from "async_hooks";

export interface AuditContextState {
  userId?: string;
}

const storage = new AsyncLocalStorage<AuditContextState>();

export function runWithAuditContext<T>(state: AuditContextState, fn: () => T): T {
  return storage.run(state, fn);
}

export function getAuditContext(): AuditContextState {
  return storage.getStore() ?? {};
}
