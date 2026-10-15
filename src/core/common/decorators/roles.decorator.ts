import { SetMetadata } from "@nestjs/common";
import { Role } from "../constants/roles";

export const ROLES_KEY = "roles";

/** Roles allowed to call this route. Used with RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
