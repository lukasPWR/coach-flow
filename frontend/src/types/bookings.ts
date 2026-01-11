export enum BookingStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum UserRole {
  CLIENT = "client",
  TRAINER = "trainer",
}

export interface BookingDto {
  id: string;
  startTime: string; // ISO Date
  endTime: string;
  status: BookingStatus;
  client: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };
  trainer: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookingViewModel extends BookingDto {
  isUpcoming: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  formattedDate: string;
  formattedTime: string;
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedBookingsResponse {
  data: BookingDto[];
  meta: PaginationMeta;
}

export interface GetBookingsParams {
  role?: "client" | "trainer";
  status?: BookingStatus | BookingStatus[];
  timeFilter?: "upcoming" | "past";
  page?: number;
  limit?: number;
}

export interface UpdateBookingDto {
  status?: BookingStatus;
  startTime?: string;
}

export type BookingTab = "upcoming" | "pending" | "history";

export interface CreateBookingRequest {
  trainerId: string;
  serviceId: string;
  startTime: string; // ISO 8601
}

export interface BookingResponse {
  id: string;
  status: BookingStatus;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
}
