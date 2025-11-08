import { IsUUID, IsNumber, Min, IsInt, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateServiceDto {
  @ApiProperty({
    description: "UUID of the service type",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    format: "uuid",
  })
  @IsUUID()
  @IsNotEmpty()
  readonly serviceTypeId: string;

  @ApiProperty({
    description: "Price of the service in the default currency",
    example: 150.0,
    minimum: 0,
    type: "number",
  })
  @IsNumber()
  @Min(0)
  readonly price: number;

  @ApiProperty({
    description: "Duration of the service in minutes",
    example: 60,
    minimum: 1,
    type: "integer",
  })
  @IsInt()
  @Min(1)
  readonly durationMinutes: number;
}
