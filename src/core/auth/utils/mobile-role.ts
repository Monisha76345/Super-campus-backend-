import { UnauthorizedException } from "@nestjs/common";
import { ROLES } from "../../common/constants/roles";

export type MobileRole = "student" | "faculty" | "warden" | "superadmin" | "alumni";

/** Maps a token role to the role name the mobile app stores on the session. */
export function toMobileRole(role: string): MobileRole {
  switch (role) {
    case ROLES.STUDENT:
      return "student";
    case ROLES.FACULTY:
      return "faculty";
    case ROLES.WARDEN:
      return "warden";
    case ROLES.SUPER_ADMIN:
    case ROLES.CAMPUS_ADMIN:
      return "superadmin";
    case ROLES.ALUMNI:
      return "alumni";
    default:
      throw new UnauthorizedException("This account role is not supported");
  }
}
