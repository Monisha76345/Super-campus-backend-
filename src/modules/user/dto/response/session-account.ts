import { MobileRole } from "src/core/auth/utils/mobile-role";

/** Account facts the auth layer turns into a login response. Not an HTTP body. */
export interface SessionAccount {
  id: string;
  email: string;
  fullName: string;
  role: string;
  mobileRole: MobileRole;
  tenantId: string;
  hostelite: boolean;
  changePasswordRequired: boolean;
}
