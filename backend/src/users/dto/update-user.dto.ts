import { IsString, IsNotEmpty, IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../interfaces/user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly name?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  readonly password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  readonly role?: UserRole;
}

