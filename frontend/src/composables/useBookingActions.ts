import { ref } from "vue";
import { bookingsApi } from "@/lib/api/bookings";
import type { BookingDto } from "@/types/bookings";

export function useBookingActions() {
  const isProcessing = ref(false);
  const error = ref<string | null>(null);

  const approveBooking = async (id: string): Promise<BookingDto | null> => {
    isProcessing.value = true;
    error.value = null;
    try {
      const result = await bookingsApi.approveBooking(id);
      return result;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Nie udało się zaakceptować rezerwacji";
      console.error("Failed to approve booking:", err);
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  const rejectBooking = async (id: string): Promise<BookingDto | null> => {
    isProcessing.value = true;
    error.value = null;
    try {
      const result = await bookingsApi.rejectBooking(id);
      return result;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Nie udało się odrzucić rezerwacji";
      console.error("Failed to reject booking:", err);
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  const cancelBooking = async (id: string): Promise<BookingDto | null> => {
    isProcessing.value = true;
    error.value = null;
    try {
      const result = await bookingsApi.cancelBooking(id);
      return result;
    } catch (err: any) {
      error.value = err.response?.data?.message || "Nie udało się anulować rezerwacji";
      console.error("Failed to cancel booking:", err);
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isProcessing,
    error,
    approveBooking,
    rejectBooking,
    cancelBooking,
  };
}
