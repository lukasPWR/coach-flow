import { ApiProperty } from "@nestjs/swagger";

/**
 * Basic user information DTO for nested responses.
 *
 * Contains minimal user data without sensitive information.
 */
export class BasicUserResponseDto {
  @ApiProperty({
    description: "Unique identifier of the user",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  readonly id: string;

  @ApiProperty({
    description: "Name of the user",
    example: "Jan Kowalski",
  })
  readonly name: string;

  @ApiProperty({
    description: "Email address of the user",
    example: "jan.kowalski@example.com",
  })
  readonly email: string;
}
