# Analiza i Plan Implementacji Ról

Na podstawie analizy dokumentu wymagań produktu (`prd.md`) oraz podsumowania implementacji autentykacji, zidentyfikowano następujące obszary, w których brakuje szczegółowej autoryzacji opartej na rolach (`CLIENT`, `TRAINER`, `ADMIN`).

## 1. Analiza Brakującej Autoryzacji w Modułach

### a) `trainer-profiles`

- **Problem:** Aktualnie brak kontrolera i endpointów. Zgodnie z `US-004`, tylko trenerzy powinni mieć możliwość zarządzania swoim profilem.
- **Wymagania:**
  - `GET /trainer-profiles/me`: Dostępny tylko dla roli `TRAINER`. Zwraca profil zalogowanego trenera.
  - `PATCH /trainer-profiles/me`: Dostępny tylko dla roli `TRAINER`. Aktualizuje profil zalogowanego trenera.
  - `GET /trainer-profiles`: Dostępny publicznie lub dla `CLIENT`. Zwraca listę profili trenerów do przeglądania.
  - `GET /trainer-profiles/:id`: Dostępny publicznie lub dla `CLIENT`. Zwraca szczegóły konkretnego profilu trenera.

### b) `services`

- **Problem:** Kontroler istnieje, ale nie ma zaimplementowanej logiki autoryzacji. Zgodnie z `US-005`, tylko trenerzy mogą zarządzać swoimi usługami.
- **Wymagania:**
  - `POST /services`: Dostępny tylko dla roli `TRAINER`. Trener może dodać usługę tylko do _swojego_ profilu.
  - `PATCH /services/:id`: Dostępny tylko dla roli `TRAINER`. Trener może edytować tylko _swoją_ usługę.
  - `DELETE /services/:id`: Dostępny tylko dla roli `TRAINER`. Trener może usunąć tylko _swoją_ usługę.
  - `GET /services`: Publiczny endpoint do przeglądania wszystkich usług.

### c) `unavailabilities`

- **Problem:** Kontroler istnieje, ale bez autoryzacji. Zgodnie z `US-006`, tylko trenerzy mogą zarządzać swoją niedostępnością.
- **Wymagania:**
  - `POST /unavailabilities`: Dostępny tylko dla roli `TRAINER`. Trener może dodać niedostępność tylko do _swojego_ kalendarza.
  - `DELETE /unavailabilities/:id`: Dostępny tylko dla roli `TRAINER`. Trener może usunąć tylko _swoją_ niedostępność.

### d) `bookings`

- **Problem:** Kluczowy moduł bez szczegółowej autoryzacji. Logika musi rozróżniać akcje klienta i trenera (`US-007`, `US-009`, `US-010`).
- **Wymagania:**
  - `POST /bookings`: Dostępny tylko dla roli `CLIENT`.
  - `PATCH /bookings/:id/accept`: Dostępny tylko dla roli `TRAINER` (trenera powiązanego z rezerwacją).
  - `PATCH /bookings/:id/reject`: Dostępny tylko dla roli `TRAINER` (trenera powiązanego z rezerwacją).
  - `PATCH /bookings/:id/cancel`: Dostępny dla `CLIENT` i `TRAINER` (uczestników rezerwacji). Wymaga implementacji logiki kar (`booking-bans`).
  - `GET /bookings`: Powinien zwracać inne dane w zależności od roli:
    - `CLIENT`: Widzi tylko swoje rezerwacje.
    - `TRAINER`: Widzi tylko rezerwacje powiązane z nim.
    - `ADMIN`: Widzi wszystkie rezerwacje.

### e) `booking-bans`

- **Problem:** Moduł istnieje, ale bez logiki. Kary powinny być nakładane automatycznie, ale `ADMIN` powinien mieć możliwość zarządzania nimi.
- **Wymagania:**
  - `POST /booking-bans`: Dostępny tylko dla `ADMIN`.
  - `GET /booking-bans`: Dostępny dla `ADMIN` i `TRAINER` (trener widzi tylko bany powiązane z nim).
  - `DELETE /booking-bans/:id`: Dostępny tylko dla `ADMIN`.

### f) `service-types` i `specializations`

- **Problem:** Moduły istnieją, ale bez autoryzacji. Są to dane słownikowe, którymi powinien zarządzać `ADMIN`.
- **Wymagania:**
  - CRUD dla obu modułów (`POST`, `PATCH`, `DELETE`) powinien być dostępny tylko dla roli `ADMIN`.
  - `GET` (listowanie) powinno być publiczne, aby umożliwić ich wykorzystanie w formularzach na frontendzie.

## 2. Plan Implementacji

Poniższy plan opisuje kroki niezbędne do wdrożenia pełnej autoryzacji opartej na rolach.

### Krok 1: Stworzenie Guardów Własności (Ownership Guards)

- **Cel:** Zapewnienie, że użytkownik może modyfikować tylko zasoby, które do niego należą.
- **Zadania:**
  1. Utworzyć `BookingOwnershipGuard`, który sprawdza, czy zalogowany `CLIENT` lub `TRAINER` jest częścią danej rezerwacji.
  2. Utworzyć `ServiceOwnershipGuard`, który sprawdza, czy zalogowany `TRAINER` jest właścicielem edytowanej usługi.
  3. Utworzyć `UnavailabilityOwnershipGuard`, który sprawdza, czy zalogowany `TRAINER` jest właścicielem bloku niedostępności.
  4. Utworzyć `ProfileOwnershipGuard`, który sprawdza, czy zalogowany użytkownik edytuje własny profil (`/users/:id`).

### Krok 2: Implementacja Autoryzacji w Kontrolerach

- **Cel:** Zabezpieczenie wszystkich endpointów zgodnie z powyższą analizą.
- **Zadania:**
  1. **`UsersController`**:
     - Dodać `ProfileOwnershipGuard` do endpointu `PATCH /users/:id`.
  2. **`TrainerProfilesController`**:
     - Zabezpieczyć endpointy `GET /me` i `PATCH /me` za pomocą `@Roles('TRAINER')`.
  3. **`ServicesController`**:
     - Zabezpieczyć `POST` za pomocą `@Roles('TRAINER')`.
     - Zabezpieczyć `PATCH` i `DELETE` za pomocą `@Roles('TRAINER')` oraz `ServiceOwnershipGuard`.
  4. **`UnavailabilitiesController`**:
     - Zabezpieczyć `POST` za pomocą `@Roles('TRAINER')`.
     - Zabezpieczyć `DELETE` za pomocą `@Roles('TRAINER')` oraz `UnavailabilityOwnershipGuard`.
  5. **`BookingsController`**:
     - Zabezpieczyć `POST` za pomocą `@Roles('CLIENT')`.
     - Zabezpieczyć `PATCH /:id/accept` i `PATCH /:id/reject` za pomocą `@Roles('TRAINER')` i `BookingOwnershipGuard`.
     - Zabezpieczyć `PATCH /:id/cancel` za pomocą `@Roles('CLIENT', 'TRAINER')` i `BookingOwnershipGuard`.
     - Zaimplementować dynamiczne zwracanie danych w `GET` w zależności od roli.
  6. **`BookingBansController`**:
     - Zabezpieczyć `POST` i `DELETE` za pomocą `@Roles('ADMIN')`.
     - Zaimplementować logikę w `GET`, aby `TRAINER` widział tylko swoje bany.
  7. **`ServiceTypesController` i `SpecializationsController`**:
     - Zabezpieczyć `POST`, `PATCH`, `DELETE` za pomocą `@Roles('ADMIN')`.
     - Oznaczyć endpointy `GET` jako `@Public()`.

### Krok 3: Refaktoryzacja i Testy

- **Cel:** Weryfikacja poprawności działania całego systemu autoryzacji.
- **Zadania:**
  1. Przejrzeć wszystkie kontrolery i upewnić się, że każdy endpoint ma zdefiniowaną regułę dostępu (albo jest publiczny, albo chroniony przez `JwtAuthGuard` i opcjonalnie `RolesGuard`/`OwnershipGuard`).
  2. Zaktualizować lub stworzyć testy E2E dla każdego endpointu, aby sprawdzić przypadki:
     - Dostępu bez autoryzacji (oczekiwany błąd 401).
     - Dostępu z niewystarczającymi uprawnieniami (oczekiwany błąd 403).
     - Dostępu do nie swoich zasobów (oczekiwany błąd 403).
     - Poprawnego dostępu.
  3. Zaktualizować dokumentację API (Swagger/OpenAPI), aby odzwierciedlała wymagane role dla każdego endpointu.
