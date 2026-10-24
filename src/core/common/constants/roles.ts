/**
 * Token roles. The mobile app uses student | faculty | alumni | warden | superadmin.
 * Hostelite is a flag on a student, not a role.
 */
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  WARDEN: "WARDEN",
  CAMPUS_ADMIN: "CAMPUS_ADMIN",
  FACULTY: "FACULTY",
  STUDENT: "STUDENT",
  ALUMNI: "ALUMNI",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const DIRECTORY_ROLES: Role[] = [
  ROLES.STUDENT,
  ROLES.FACULTY,
  ROLES.ALUMNI,
  ROLES.WARDEN,
  ROLES.SUPER_ADMIN,
  ROLES.CAMPUS_ADMIN,
];

