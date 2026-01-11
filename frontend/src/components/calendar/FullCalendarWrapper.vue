<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventChangeArg,
  CalendarApi,
} from "@fullcalendar/core";
import type { CalendarEvent } from "@/types/calendar";

interface Props {
  events: CalendarEvent[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const emit = defineEmits<{
  select: [info: DateSelectArg];
  eventClick: [info: EventClickArg];
  eventChange: [info: EventChangeArg];
  datesSet: [info: { start: Date; end: Date }];
}>();

// Referencja do komponentu FullCalendar
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

// Flaga do blokowania eventChange podczas synchronizacji z props
const isSyncingEvents = ref(false);

// Funkcja do pobierania API kalendarza
function getCalendarApi(): CalendarApi | null {
  return calendarRef.value?.getApi() ?? null;
}

// Aktualizuj wydarzenia przez API kalendarza (nie przez props)
watch(
  () => props.events,
  (newEvents) => {
    const api = getCalendarApi();
    if (api) {
      isSyncingEvents.value = true;

      // Pobierz ID istniejących wydarzeń
      const existingEvents = api.getEvents();
      const existingIds = new Set(existingEvents.map((e) => e.id));
      const newIds = new Set(newEvents.map((e) => e.id));

      // Usuń wydarzenia które już nie istnieją
      existingEvents.forEach((event) => {
        if (!newIds.has(event.id)) {
          event.remove();
        }
      });

      // Dodaj nowe wydarzenia (nie aktualizujemy istniejących - to powodowało pętlę)
      newEvents.forEach((newEvent) => {
        if (!existingIds.has(newEvent.id)) {
          api.addEvent(newEvent);
        }
      });

      // Odblokuj po krótkim opóźnieniu
      setTimeout(() => {
        isSyncingEvents.value = false;
      }, 100);
    }
  }
);

// Dodaj początkowe wydarzenia po zamontowaniu
onMounted(() => {
  // Poczekaj na następny tick, żeby kalendarz się zainicjalizował
  setTimeout(() => {
    const api = getCalendarApi();
    if (api && props.events.length > 0) {
      props.events.forEach((event) => api.addEvent(event));
    }
  }, 0);
});

// Statyczna konfiguracja kalendarza - NIE używamy computed!
const calendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "timeGridWeek",
  locale: "pl",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  },
  buttonText: {
    today: "Dziś",
    month: "Miesiąc",
    week: "Tydzień",
    day: "Dzień",
  },
  // Konfiguracja czasu
  slotMinTime: "06:00:00",
  slotMaxTime: "22:00:00",
  slotDuration: "00:15:00",
  slotLabelInterval: "01:00:00",
  slotLabelFormat: {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  },
  // Pierwszy dzień tygodnia - poniedziałek
  firstDay: 1,
  // Wysokość kalendarza
  height: "auto",
  contentHeight: 650,
  // Nie przekazujemy events tutaj - zarządzamy nimi przez API
  events: [],
  // Interakcje
  selectable: true,
  selectMirror: true,
  editable: true,
  eventResizableFromStart: true,
  // Kolory nagłówków
  dayHeaderFormat: { weekday: "short", day: "numeric", month: "numeric" },
  // Obsługa zdarzeń
  select: (info: DateSelectArg) => {
    emit("select", info);
  },
  eventClick: (info: EventClickArg) => {
    emit("eventClick", info);
  },
  eventChange: (info: EventChangeArg) => {
    // Nie emituj eventChange podczas synchronizacji z props (zapobiega pętli)
    if (!isSyncingEvents.value) {
      emit("eventChange", info);
    }
  },
  datesSet: (info) => {
    emit("datesSet", { start: info.start, end: info.end });
  },
  // Wyłączenie automatycznego cofania przy D&D
  eventDrop: () => {},
  eventResize: () => {},
};
</script>

<template>
  <div class="calendar-wrapper relative">
    <!-- Kalendarz - zawsze renderowany -->
    <div class="fc-custom" :class="{ 'opacity-50': isLoading }">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>

    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-background/50"
    >
      <div class="flex items-center gap-2 text-muted-foreground">
        <svg
          class="h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Ładowanie...</span>
      </div>
    </div>
  </div>
</template>

<style>
/* Nadpisanie stylów FullCalendar - używamy CSS Variables z projektu */
.fc-custom {
  /* Tło i tekst */
  --fc-page-bg-color: var(--background);
  --fc-neutral-bg-color: var(--muted);
  --fc-neutral-text-color: var(--muted-foreground);

  /* Obramowania */
  --fc-border-color: var(--border);

  /* Przyciski */
  --fc-button-bg-color: var(--primary);
  --fc-button-border-color: var(--primary);
  --fc-button-text-color: var(--primary-foreground);
  --fc-button-hover-bg-color: var(--primary);
  --fc-button-hover-border-color: var(--primary);
  --fc-button-active-bg-color: var(--primary);
  --fc-button-active-border-color: var(--primary);

  /* Dzisiaj */
  --fc-today-bg-color: var(--accent);

  /* Wydarzenia */
  --fc-event-border-color: transparent;
  --fc-event-text-color: white;

  /* Selekcja */
  --fc-highlight-color: oklch(0.45 0.15 255 / 0.15);
}

/* Stylizacja przycisków */
.fc-custom .fc-button {
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  transition: all 0.15s ease;
}

.fc-custom .fc-button:hover {
  opacity: 0.9;
}

.fc-custom .fc-button:focus {
  box-shadow: 0 0 0 2px var(--ring);
  outline: none;
}

.fc-custom .fc-button-primary:not(:disabled).fc-button-active,
.fc-custom .fc-button-primary:not(:disabled):active {
  background-color: var(--primary);
  border-color: var(--primary);
  opacity: 1;
}

/* Nagłówek */
.fc-custom .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--foreground);
}

/* Nagłówki dni */
.fc-custom .fc-col-header-cell {
  background-color: var(--muted);
  padding: 0.75rem 0;
}

.fc-custom .fc-col-header-cell-cushion {
  color: var(--foreground);
  font-weight: 500;
  text-decoration: none;
}

/* Sloty czasowe */
.fc-custom .fc-timegrid-slot-label {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

/* Wydarzenia */
.fc-custom .fc-event {
  border-radius: var(--radius-sm);
  border: none;
  padding: 2px 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
}

.fc-custom .fc-event:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.fc-custom .fc-event-title {
  font-weight: 500;
}

/* Dzisiejszy dzień */
.fc-custom .fc-day-today {
  background-color: var(--accent) !important;
}

/* Scrollbar */
.fc-custom .fc-scroller::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.fc-custom .fc-scroller::-webkit-scrollbar-track {
  background: var(--muted);
  border-radius: 4px;
}

.fc-custom .fc-scroller::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

.fc-custom .fc-scroller::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground);
}

/* Responsywność */
@media (max-width: 768px) {
  .fc-custom .fc-toolbar {
    flex-direction: column;
    gap: 0.5rem;
  }

  .fc-custom .fc-toolbar-chunk {
    display: flex;
    justify-content: center;
  }

  .fc-custom .fc-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>
