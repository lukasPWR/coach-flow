import { UserRole } from "./user-role.enum";

export interface UserInterface {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
}
