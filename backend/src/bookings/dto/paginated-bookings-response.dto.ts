import { ApiProperty } from "@nestjs/swagger";
import { Booking } from "../entities/booking.entity";
import { BookingStatus } from "../interfaces/booking-status.enum";

/**
 * Pagination metadata for paginated responses.
 */
export class PaginationMeta {
  @ApiProperty({
    description: "Total number of items across all pages",
    example: 100,
  })
  readonly totalItems: number;

  @ApiProperty({
    description: "Number of items in the current page",
    example: 10,
  })
  readonly itemCount: number;

  @ApiProperty({
    description: "Number of items per page",
    example: 10,
  })
  readonly itemsPerPage: number;

  @ApiProperty({
    description: "Total number of pages",
    example: 10,
  })
  readonly totalPages: number;

  @ApiProperty({
    description: "Current page number",
    example: 1,
  })
  readonly currentPage: number;
}

/**
 * Response DTO containing booking data for list view.
 * Includes related user and service information.
 */
export class BookingResponseDto {
  @ApiProperty({
    description: "Unique identifier of the booking",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  readonly id: string;

  @ApiProperty({
    description: "Start time of the booking",
    example: "2025-11-26T10:00:00.000Z",
  })
  readonly startTime: Date;

  @ApiProperty({
    description: "End time of the booking",
    example: "2025-11-26T11:00:00.000Z",
  })
  readonly endTime: Date;

  @ApiProperty({
    description: "Current status of the booking",
    example: "ACCEPTED",
  })
  readonly status: string;

  @ApiProperty({
    description: "Client information",
    example: { id: "client-uuid", name: "Jan Kowalski" },
  })
  readonly client: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: "Trainer information",
    example: { id: "trainer-uuid", name: "Anna Nowak" },
  })
  readonly trainer: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: "Service information",
    example: { id: "service-uuid", name: "Trening personalny" },
  })
  readonly service: {
    id: string;
    name: string;
  };
}

/**
 * Response DTO for single booking details (GET /bookings/:id).
 * Includes full booking information with optional relation names and service price.
 */
export class BookingDetailsResponseDto {
  @ApiProperty({
    description: "Unique identifier of the booking",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  readonly id: string;

  @ApiProperty({
    description: "ID of the client who made the booking",
    example: "b2c3d4e5-f6g7-8901-2345-678901bcdef0",
  })
  readonly clientId: string;

  @ApiProperty({
    description: "ID of the trainer providing the service",
    example: "c3d4e5f6-g7h8-9012-3456-789012cdef01",
  })
  readonly trainerId: string;

  @ApiProperty({
    description: "ID of the service being booked",
    example: "d4e5f6g7-h8i9-0123-4567-890123def012",
  })
  readonly serviceId: string;

  @ApiProperty({
    description: "Start time of the booking",
    example: "2025-12-03T10:00:00Z",
  })
  readonly startTime: Date;

  @ApiProperty({
    description: "End time of the booking",
    example: "2025-12-03T11:00:00Z",
  })
  readonly endTime: Date;

  @ApiProperty({
    description: "Current status of the booking",
    enum: BookingStatus,
    example: "PENDING",
  })
  readonly status: BookingStatus;

  @ApiProperty({
    description: "Timestamp when reminder was sent (null if not sent)",
    nullable: true,
    example: null,
  })
  readonly reminderSentAt?: Date;

  @ApiProperty({
    description: "Timestamp when the booking was created",
    example: "2025-12-02T12:00:00Z",
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: "Timestamp when the booking was last updated",
    example: "2025-12-02T12:00:00Z",
  })
  readonly updatedAt: Date;

  // Optional relation names for enhanced context
  @ApiProperty({
    description: "Name of the client (loaded from relation)",
    nullable: true,
    example: "Jan Kowalski",
  })
  readonly clientName?: string;

  @ApiProperty({
    description: "Name of the trainer (loaded from relation)",
    nullable: true,
    example: "Anna Nowak",
  })
  readonly trainerName?: string;

  @ApiProperty({
    description: "Price of the service (loaded from relation)",
    nullable: true,
    example: 150.0,
  })
  readonly servicePrice?: number;
}

/**
 * Paginated response DTO for GET /bookings endpoint.
 *
 * Contains an array of bookings and pagination metadata.
 */
export class PaginatedBookingsResponseDto {
  @ApiProperty({
    description: "Array of booking objects",
    type: [BookingResponseDto],
  })
  readonly data: BookingResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    type: PaginationMeta,
  })
  readonly meta: PaginationMeta;
}

/**
 * Factory function to create pagination metadata.
 *
 * @param totalItems - Total count of items matching the query
 * @param itemCount - Number of items in the current page
 * @param itemsPerPage - Items per page (limit)
 * @param currentPage - Current page number
 * @returns PaginationMeta object
 */
export function createPaginationMeta(
  totalItems: number,
  itemCount: number,
  itemsPerPage: number,
  currentPage: number
): PaginationMeta {
  return {
    totalItems,
    itemCount,
    itemsPerPage,
    totalPages: Math.ceil(totalItems / itemsPerPage),
    currentPage,
  };
}

/**
 * Maps a Booking entity with relations to BookingResponseDto.
 *
 * @param booking - Booking entity with loaded relations (client, trainer, service)
 * @returns BookingResponseDto
 */
export function mapBookingToResponseDto(booking: Booking): BookingResponseDto {
  return {
    id: booking.id,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    client: {
      id: booking.client?.id ?? booking.clientId,
      name: booking.client?.name ?? "",
    },
    trainer: {
      id: booking.trainer?.id ?? booking.trainerId,
      name: booking.trainer?.name ?? "",
    },
    service: {
      id: booking.service?.id ?? booking.serviceId,
      name: booking.service?.serviceType?.name ?? "",
    },
  };
}

/**
 * Maps a Booking entity with relations to BookingDetailsResponseDto.
 *
 * @param booking - Booking entity with loaded relations (client, trainer, service)
 * @returns BookingDetailsResponseDto
 */
export function mapBookingToDetailsResponseDto(booking: Booking): BookingDetailsResponseDto {
  return {
    id: booking.id,
    clientId: booking.clientId,
    trainerId: booking.trainerId,
    serviceId: booking.serviceId,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    reminderSentAt: booking.reminderSentAt,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    clientName: booking.client?.name,
    trainerName: booking.trainer?.name,
    servicePrice: booking.service?.price,
  };
}
