import { BookingStatus } from "./booking-status.enum";

export interface BookingInterface {
  readonly id: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly status: BookingStatus;
  readonly reminderSentAt?: Date;
  readonly clientId: string;
  readonly trainerId: string;
  readonly serviceId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
