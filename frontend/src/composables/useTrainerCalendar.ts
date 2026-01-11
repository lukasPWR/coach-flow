import { ref } from "vue";
import { bookingsApi } from "@/lib/api/bookings";
import { unavailabilitiesApi } from "@/lib/api/unavailabilities";
import type { BookingDto } from "@/types/bookings";
import type {
  CalendarEvent,
  CalendarEventType,
  CalendarDateRange,
  UnavailabilityDto,
  UpdateUnavailabilityDto,
} from "@/types/calendar";

// Kolory dla wydarzeń kalendarza
// blue-500
const BOOKING_COLOR = "#3b82f6";
// gray-500
const UNAVAILABILITY_COLOR = "#6b7280";

/**
 * Composable zarządzający stanem i logiką kalendarza trenera
 */
export function useTrainerCalendar() {
  // State
  const events = ref<CalendarEvent[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentRange = ref<CalendarDateRange | null>(null);

  /**
   * Mapuje rezerwację na wydarzenie kalendarza
   */
  function mapBookingToEvent(booking: BookingDto): CalendarEvent {
    const clientName = (booking as any).client?.name ?? "Klient";
    return {
      id: `booking-${booking.id}`,
      title: `${booking.service.name}: ${clientName}`,
      start: booking.startTime,
      end: booking.endTime,
      backgroundColor: BOOKING_COLOR,
      borderColor: BOOKING_COLOR,
      // Rezerwacje nie są edytowalne przez D&D
      editable: false,
      extendedProps: {
        type: "BOOKING" as CalendarEventType,
        originalId: booking.id,
        description: `${booking.service.name} z ${clientName}`,
      },
    };
  }

  /**
   * Mapuje niedostępność na wydarzenie kalendarza
   */
  function mapUnavailabilityToEvent(unavailability: UnavailabilityDto): CalendarEvent {
    return {
      id: `unavailability-${unavailability.id}`,
      title: "Niedostępny",
      start: unavailability.startTime,
      end: unavailability.endTime,
      backgroundColor: UNAVAILABILITY_COLOR,
      borderColor: UNAVAILABILITY_COLOR,
      // Niedostępności są edytowalne przez D&D
      editable: true,
      extendedProps: {
        type: "UNAVAILABILITY" as CalendarEventType,
        originalId: unavailability.id,
      },
    };
  }

  /**
   * Pobiera wydarzenia kalendarza dla danego zakresu dat
   */
  async function fetchEvents(range: CalendarDateRange): Promise<void> {
    isLoading.value = true;
    error.value = null;
    currentRange.value = range;

    try {
      // Pobierz równolegle rezerwacje i niedostępności
      const [bookingsResponse, unavailabilities] = await Promise.all([
        bookingsApi.getBookings({
          role: "trainer",
          status: "ACCEPTED" as any,
          limit: 100,
        }),
        unavailabilitiesApi.getUnavailabilities({
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        }),
      ]);

      // Filtruj rezerwacje do zakresu dat (API bookings nie ma filtrowania po dacie)
      const rangeStart = range.start.getTime();
      const rangeEnd = range.end.getTime();

      const filteredBookings = bookingsResponse.data.filter((booking) => {
        const bookingStart = new Date(booking.startTime).getTime();
        return bookingStart >= rangeStart && bookingStart <= rangeEnd;
      });

      // Mapuj na wydarzenia kalendarza
      const bookingEvents = filteredBookings.map(mapBookingToEvent);
      const unavailabilityEvents = unavailabilities.map(mapUnavailabilityToEvent);

      // Połącz wszystkie wydarzenia
      events.value = [...bookingEvents, ...unavailabilityEvents];
    } catch (err: any) {
      console.error("Błąd pobierania wydarzeń kalendarza:", err);
      error.value = "Nie udało się załadować kalendarza";
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Odświeża wydarzenia dla aktualnego zakresu
   */
  async function refreshEvents(): Promise<void> {
    if (currentRange.value) {
      await fetchEvents(currentRange.value);
    }
  }

  /**
   * Dodaje nową niedostępność
   */
  async function addUnavailability(data: {
    startTime: string;
    endTime: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Backend pobiera trainerId z JWT, nie wysyłamy go w body
      const created = await unavailabilitiesApi.createUnavailability(data);

      // Dodaj do listy wydarzeń
      const newEvent = mapUnavailabilityToEvent(created);
      events.value = [...events.value, newEvent];

      return { success: true, message: "Niedostępność została dodana" };
    } catch (err: any) {
      console.error("Błąd dodawania niedostępności:", err);
      const status = err.response?.status;

      if (status === 409) {
        return {
          success: false,
          message: "Wybrany termin koliduje z istniejącą rezerwacją",
        };
      }
      if (status === 400) {
        return {
          success: false,
          message: err.response?.data?.message || "Nieprawidłowe dane",
        };
      }

      return { success: false, message: "Nie udało się dodać niedostępności" };
    }
  }

  /**
   * Aktualizuje niedostępność (np. przy drag & drop)
   */
  async function updateUnavailability(
    id: string,
    data: UpdateUnavailabilityDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      const updated = await unavailabilitiesApi.updateUnavailability(id, data);

      // Zaktualizuj wydarzenie w liście
      const eventId = `unavailability-${id}`;
      events.value = events.value.map((event) =>
        event.id === eventId ? mapUnavailabilityToEvent(updated) : event
      );

      return { success: true, message: "Niedostępność została zaktualizowana" };
    } catch (err: any) {
      console.error("Błąd aktualizacji niedostępności:", err);
      const status = err.response?.status;

      if (status === 409) {
        // Odśwież listę aby przywrócić stan
        await refreshEvents();
        return {
          success: false,
          message: "Wybrany termin koliduje z istniejącą rezerwacją",
        };
      }
      if (status === 404) {
        await refreshEvents();
        return {
          success: false,
          message: "Niedostępność nie została znaleziona",
        };
      }

      await refreshEvents();
      return { success: false, message: "Nie udało się zaktualizować niedostępności" };
    }
  }

  /**
   * Usuwa niedostępność
   */
  async function removeUnavailability(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await unavailabilitiesApi.deleteUnavailability(id);

      // Usuń z listy wydarzeń
      const eventId = `unavailability-${id}`;
      events.value = events.value.filter((event) => event.id !== eventId);

      return { success: true, message: "Niedostępność została usunięta" };
    } catch (err: any) {
      console.error("Błąd usuwania niedostępności:", err);
      const status = err.response?.status;

      if (status === 404) {
        await refreshEvents();
        return {
          success: false,
          message: "Niedostępność nie została znaleziona",
        };
      }

      return { success: false, message: "Nie udało się usunąć niedostępności" };
    }
  }

  /**
   * Resetuje błąd
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    events,
    isLoading,
    error,

    // Actions
    fetchEvents,
    refreshEvents,
    addUnavailability,
    updateUnavailability,
    removeUnavailability,
    clearError,
  };
}
