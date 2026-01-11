/**
 * Typy dla widoku kalendarza trenera
 */

// Typ rozróżniający źródło wydarzenia
export enum CalendarEventType {
  BOOKING = "BOOKING",
  UNAVAILABILITY = "UNAVAILABILITY",
}

// Ujednolicony interfejs dla FullCalendar
export interface CalendarEvent {
  id: string;
  title: string; // Np. "Trening: Jan K." lub "Niedostępny"
  start: string; // ISO String
  end: string; // ISO String
  backgroundColor: string;
  borderColor: string;
  editable: boolean; // false dla BOOKING, true dla UNAVAILABILITY
  extendedProps: {
    type: CalendarEventType;
    originalId: string; // ID z bazy danych (booking.id lub unavailability.id)
    description?: string;
  };
}

// DTO dla niedostępności z API
export interface UnavailabilityDto {
  id: string;
  startTime: string; // ISO Date
  endTime: string; // ISO Date
  trainerId: string;
  createdAt: string;
  updatedAt: string;
}

// DTO do tworzenia niedostępności
// Uwaga: trainerId jest pobierany z JWT po stronie backendu
export interface CreateUnavailabilityDto {
  startTime: string; // ISO Date
  endTime: string; // ISO Date
}

// DTO do aktualizacji niedostępności
export interface UpdateUnavailabilityDto {
  startTime?: string; // ISO Date
  endTime?: string; // ISO Date
}

// Typy pomocnicze dla propsów modala
export interface UnavailabilityFormData {
  id?: string; // Obecne tylko w trybie edycji
  startTime: string; // Format datetime-local: "YYYY-MM-DDTHH:mm"
  endTime: string; // Format datetime-local: "YYYY-MM-DDTHH:mm"
}

// Tryb modala niedostępności
export type UnavailabilityModalMode = "CREATE" | "EDIT";

// Zakres dat dla pobierania wydarzeń kalendarza
export interface CalendarDateRange {
  start: Date;
  end: Date;
}
