import { api } from "./client";
import type {
  BookingDto,
  GetBookingsParams,
  PaginatedBookingsResponse,
  UpdateBookingDto,
} from "../../types/bookings";

export const bookingsApi = {
  getBookings: async (params: GetBookingsParams): Promise<PaginatedBookingsResponse> => {
    // Convert array of statuses to comma-separated string if needed,
    // or axios will handle it depending on configuration (usually repeats key).
    // Let's rely on axios default params serialization for now or check if we need custom.
    const response = await api.get<PaginatedBookingsResponse>("/bookings", { params });
    return response.data;
  },

  getBooking: async (id: string): Promise<BookingDto> => {
    const response = await api.get<BookingDto>(`/bookings/${id}`);
    return response.data;
  },

  updateBooking: async (id: string, data: UpdateBookingDto): Promise<BookingDto> => {
    const response = await api.patch<BookingDto>(`/bookings/${id}`, data);
    return response.data;
  },

  // Explicit methods for actions can be helpful wrappers
  cancelBooking: async (id: string): Promise<BookingDto> => {
    const response = await api.post<BookingDto>(`/bookings/${id}/cancel`);
    return response.data;
  },

  rescheduleBooking: async (id: string, startTime: string): Promise<BookingDto> => {
    return bookingsApi.updateBooking(id, { startTime });
  },

  /**
   * Akceptuje rezerwację (dla trenera)
   * POST /bookings/:id/approve
   */
  approveBooking: async (id: string): Promise<BookingDto> => {
    const response = await api.post<BookingDto>(`/bookings/${id}/approve`);
    return response.data;
  },

  /**
   * Odrzuca rezerwację (dla trenera)
   * POST /bookings/:id/reject
   */
  rejectBooking: async (id: string): Promise<BookingDto> => {
    const response = await api.post<BookingDto>(`/bookings/${id}/reject`);
    return response.data;
  },

  /**
   * Pobiera oczekujące rezerwacje dla trenera
   */
  getPendingBookings: async (limit: number = 10): Promise<PaginatedBookingsResponse> => {
    return bookingsApi.getBookings({
      role: "trainer",
      status: "PENDING" as any,
      limit,
      page: 1,
    });
  },

  /**
   * Pobiera zaakceptowane rezerwacje dla trenera (do filtrowania dzisiejszych)
   */
  getAcceptedBookings: async (limit: number = 50): Promise<PaginatedBookingsResponse> => {
    return bookingsApi.getBookings({
      role: "trainer",
      status: "ACCEPTED" as any,
      limit,
      page: 1,
    });
  },
};
