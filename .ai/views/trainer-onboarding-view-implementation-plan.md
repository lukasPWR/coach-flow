# Plan implementacji widoku Onboarding Trenera

## 1. Przegląd

Widok Onboardingu Trenera (`TrainerOnboardingView`) jest kluczowym procesem dla nowo zarejestrowanych trenerów. Jego celem jest przeprowadzenie użytkownika przez trzyetapową konfigurację profilu, która jest niezbędna do opublikowania oferty w serwisie CoachFlow. Proces składa się z uzupełnienia danych profilowych, zdefiniowania usług oraz określenia dostępności.

## 2. Routing widoku

- **Ścieżka:** `/onboarding`
- **Strażnik (Guard):**
  - Wymaga uwierzytelnienia.
  - Wymaga roli `TRAINER`.
  - Powinien sprawdzać, czy onbarding nie został już zakończony (jeśli tak, przekierowanie na Dashboard).

## 3. Struktura komponentów

Widok oparty jest na wzorcu "Wizard" (Kreator).

```text
TrainerOnboardingView (Root)
├── OnboardingStepper (Komponent nawigacyjny - shadcn-vue Stepper)
├── StepProfile (Krok 1: Dane profilowe)
│   ├── ProfileAvatarUpload (Upload zdjęcia/URL)
│   ├── SpecializationSelect (Multi-select)
│   └── BasicInfoForm (Opis, Miasto)
├── StepServices (Krok 2: Oferta)
│   ├── ServiceList (Lista dodanych usług)
│   │   └── ServiceItemCard
│   └── AddServiceForm (Formularz dodawania usługi)
│       └── ServiceTypeSelect
└── StepAvailability (Krok 3: Dostępność)
    ├── AvailabilityCalendar (Widok kalendarza)
    └── UnavailabilityDialog (Dodawanie wyjątków/godzin pracy)
```

## 4. Szczegóły komponentów

### `TrainerOnboardingView` (Parent)
- **Opis:** Główny kontener zarządzający stanem kroków (currentStep) i ogólnym stanem danych onboardingu.
- **Główne elementy:** `OnboardingStepper`, kontenery dla poszczególnych kroków, przyciski nawigacyjne (Wstecz, Dalej/Zakończ).
- **Obsługiwane interakcje:** Przejście między krokami, walidacja możliwości przejścia dalej, końcowe zatwierdzenie.
- **Typy:** `OnboardingState`.

### `StepProfile` (Krok 1)
- **Opis:** Formularz danych podstawowych trenera.
- **Główne elementy:** Inputy tekstowe (miasto, opis), input URL (zdjęcie), Select (specjalizacje).
- **Obsługiwane zdarzenia:** `update:modelValue` dla pól formularza.
- **Walidacja:**
  - `city`: wymagane, string.
  - `specializationIds`: min. 1 wybrana specjalizacja.
  - `description`: wymagane (zgodnie z UX, mimo że API pozwala na opcjonalne).
- **Typy:** `CreateTrainerProfileDto`.
- **Propsy:** `initialData` (jeśli wznawiamy onboarding).

### `StepServices` (Krok 2)
- **Opis:** Zarządzanie usługami. Użytkownik musi dodać przynajmniej jedną usługę.
- **Główne elementy:** Lista kafelków z usługami, formularz "Dodaj usługę" (Typ usługi, Cena).
- **Obsługiwane zdarzenia:** `add-service`, `remove-service`.
- **Walidacja:**
  - `price`: liczba dodatnia.
  - `serviceTypeId`: wymagany UUID.
  - Blokada przycisku "Dalej" jeśli lista usług jest pusta.
- **Typy:** `CreateServiceDto`, `ServiceResponseDto` (do wyświetlania listy).
- **Propsy:** `services` (lista pobrana z API).

### `StepAvailability` (Krok 3)
- **Opis:** Definiowanie dostępności.
- **Główne elementy:** Kalendarz (np. `v-calendar` lub implementacja na gridzie CSS), formularz dodawania blokad czasowych (`Unavailability`).
- **Obsługiwane interakcje:** Kliknięcie w dzień/godzinę, dodanie zakresu niedostępności.
- **Walidacja:** Data końcowa musi być późniejsza niż początkowa.
- **Typy:** `CreateUnavailabilityDto`.

## 5. Typy

Wykorzystujemy wygenerowane DTO oraz typy pomocnicze dla UI.

### DTOs (Backend Parity)

```typescript
// Zgodne z create-trainer-profile.dto.ts
interface CreateTrainerProfileDto {
  description?: string;
  city?: string;
  profilePictureUrl?: string;
  specializationIds?: string[]; // Array of UUIDs
}

// Zgodne z create-service.dto.ts
interface CreateServiceDto {
  trainerId?: string; // Często pobierane z tokenu, ale może być wymagane w body
  serviceTypeId: string;
  price: number;
  durationMinutes: number; // Default 60
}

// Zgodne z create-unavailability.dto.ts
interface CreateUnavailabilityDto {
  startTime: string; // ISO Date String
  endTime: string;   // ISO Date String
}
```

### View Models

```typescript
interface OnboardingState {
  currentStep: number;
  isLoading: boolean;
  profileCreated: boolean; // Czy krok 1 został już zapisany w bazie
  profileData: CreateTrainerProfileDto;
  addedServices: ServiceResponseDto[]; // Usługi już zapisane w bazie
}

interface SelectOption {
  label: string;
  value: string; // UUID
}
```

## 6. Zarządzanie stanem

Zalecane użycie custom hooka `useOnboarding` (`composables/useOnboarding.ts`), który będzie zarządzał logiką biznesową oddzieloną od widoku.

- **Reactive State:** `step`, `loading`, `errors`.
- **Logic:**
  - `submitProfileStep`: Wysyła `POST /trainers`. W przypadku sukcesu ustawia flagę `profileCreated` i przechodzi do kroku 2.
  - `submitService`: Wysyła `POST /services` i odświeża listę usług.
  - `submitUnavailability`: Wysyła `POST /unavailabilities`.
  - `checkExistingProfile`: Na `onMounted` sprawdza `GET /trainers/me`. Jeśli profil istnieje, pomija krok 1 lub wypełnia dane.

## 7. Integracja API

### Krok 1: Profil
- **GET /specializations**: Pobranie słownika do dropdowna.
- **POST /trainers**: Zapisanie profilu.
  - *Request:* `CreateTrainerProfileDto`
  - *Response:* `TrainerProfile` (z ID).

### Krok 2: Usługi
- **GET /service-types**: Pobranie słownika typów usług.
- **GET /services**: Pobranie istniejących usług (jeśli użytkownik odświeży stronę).
- **POST /services**: Dodanie pojedynczej usługi.
  - *Request:* `CreateServiceDto`
  - *Response:* `ServiceResponseDto`.

### Krok 3: Dostępność
- **POST /unavailabilities**: Dodanie blokady terminu.
  - *Request:* `CreateUnavailabilityDto`
  - *Response:* `Unavailability`.

## 8. Interakcje użytkownika

1. **Start:** Użytkownik widzi pusty formularz profilu (chyba że wrócił do onboardingu).
2. **Wypełnianie profilu:** Wybiera specjalizacje, wpisuje miasto. Kliknięcie "Dalej" wysyła request do API.
3. **Sukces profilu:** System przechodzi do kroku 2.
4. **Dodawanie usług:**
   - Klika "Dodaj usługę".
   - Otwiera się dialog/formularz.
   - Wybiera "Trening Personalny", wpisuje cenę "150".
   - Klika "Zapisz". Usługa pojawia się na liście poniżej.
   - Musi dodać min. 1 usługę, aby przycisk "Dalej" stał się aktywny.
5. **Dostępność:**
   - Zaznacza dni wolne w kalendarzu.
6. **Finał:** Klika "Zakończ Onboarding", co przekierowuje do głównego Dashboardu trenera.

## 9. Warunki i walidacja

Walidacja odbywa się na poziomie frontendu przed wysłaniem żądania (np. przy użyciu `zod` lub `vee-validate`).

1. **Step 1:**
   - `specializationIds.length > 0`: Trener musi mieć specjalizację.
   - `city.length > 0`.
2. **Step 2:**
   - `services.length > 0`: Nie można przejść dalej bez zdefiniowania oferty.
   - Cena > 0.
3. **Step 3:**
   - Walidacja dat (koniec > początek).

## 10. Obsługa błędów

- **Konflikt (409):** Jeśli użytkownik próbuje utworzyć profil, który już istnieje (np. po cofnięciu w przeglądarce), system powinien obsłużyć błąd i pobrać istniejące dane (`GET /trainers/me`).
- **Błędy walidacji (400):** Wyświetlenie komunikatów pod polami formularza.
- **Błędy serwera (500):** Wyświetlenie `Toast` z komunikatem "Wystąpił błąd, spróbuj ponownie".
- **Utrata sesji (401):** Przekierowanie do logowania.

## 11. Kroki implementacji

1. **Przygotowanie typów i API:** Upewnij się, że w folderze `src/api` istnieją funkcje do obsługi endpointów trenerów, usług i słowników.
2. **Stworzenie Composable (`useOnboarding`):** Zaimplementuj logikę stanu, pobierania słowników i obsługi formularzy.
3. **Implementacja Layoutu:** Stwórz `TrainerOnboardingView.vue` z komponentem `Stepper` z biblioteki UI.
4. **Implementacja Kroku 1 (Profil):**
   - Zbuduj formularz.
   - Podepnij `GET /specializations`.
   - Podepnij `POST /trainers`.
5. **Implementacja Kroku 2 (Usługi):**
   - Zbuduj listę i formularz dodawania.
   - Podepnij `GET /service-types`.
   - Podepnij `POST /services`.
6. **Implementacja Kroku 3 (Dostępność):**
   - Zintegruj prosty kalendarz.
   - Podepnij `POST /unavailabilities`.
7. **Testowanie E2E:** Przejdź cały proces jako nowy użytkownik, sprawdź walidację i obsługę błędów (np. odświeżenie strony w połowie procesu).

