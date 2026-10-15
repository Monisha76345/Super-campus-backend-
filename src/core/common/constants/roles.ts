/**
 * Token roles. The mobile app uses student | faculty | admin | alumni.
 * `admin` maps to CAMPUS_ADMIN. SUPER_ADMIN is platform-wide and is not a mobile session role.
 * Hostelite is a flag on a student, not a role.
 */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  CAMPUS_ADMIN: "CAMPUS_ADMIN",
  FACULTY: "FACULTY",
  STUDENT: "STUDENT",
  ALUMNI: "ALUMNI",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const DIRECTORY_ROLES: Role[] = [ROLES.STUDENT, ROLES.FACULTY, ROLES.ALUMNI, ROLES.CAMPUS_ADMIN];
