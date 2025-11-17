import { UserRole } from "../../users/interfaces/user-role.enum";

/**
 * Interface describing data returned in JWT token from Access Management
 */
export interface AuthUserInterface {
  userId: string;
  email: string;
  role: UserRole;
}
