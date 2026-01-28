import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO representing a client in the trainer's client list.
 * Contains minimal, non-sensitive user data.
 */
export class TrainerClientResponseDto {
  @Expose()
  @ApiProperty({
    description: "Unique identifier of the client (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: "Full name of the client",
    example: "Jan Kowalski",
  })
  name: string;

  @Expose()
  @ApiProperty({
    description: "Email address of the client",
    example: "jan.kowalski@example.com",
  })
  email: string;
}
