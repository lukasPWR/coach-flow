import { api } from './client'
import type { BookingResponse, CreateBookingRequest } from '@/types/bookings'

export const createBooking = async (
  payload: CreateBookingRequest,
): Promise<BookingResponse> => {
  const response = await api.post<BookingResponse>('/bookings', payload)
  return response.data
}
