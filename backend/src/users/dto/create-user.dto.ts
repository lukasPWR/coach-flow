import { IsString, IsNotEmpty, IsEmail, MinLength, IsEnum } from "class-validator";
import { UserRole } from "../interfaces/user-role.enum";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  @MinLength(8)
  readonly password: string;

  @IsEnum(UserRole)
  readonly role: UserRole;
}
