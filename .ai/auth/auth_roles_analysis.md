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

Poniższy plan opisuje kroki niezbędne do wdrożenia pełnej autoryzacji opartej na rolach, bez wprowadzania dodatkowych guardów. Weryfikacja własności zasobów będzie realizowana w warstwie serwisowej.

### Krok 1: Implementacja Autoryzacji w Kontrolerach i Serwisach

- **Cel:** Zabezpieczenie wszystkich endpointów za pomocą istniejących guardów (`JwtAuthGuard`, `RolesGuard`) oraz dodanie logiki weryfikacji własności w serwisach.
- **Zadania:**
  1. **`UsersController`**:
     - Endpoint `PATCH /users/:id` powinien być dostępny tylko dla `ADMIN` lub dla użytkownika, który jest właścicielem konta. W serwisie `users.service.ts` metoda `update` musi weryfikować, czy `id` z parametru jest zgodne z `id` zalogowanego użytkownika (lub czy użytkownik ma rolę `ADMIN`).
     - Endpoint `GET /users/:id` powinien być dostępny dla `ADMIN` lub właściciela konta.
  2. **`TrainerProfilesController`**:
     - Zabezpieczyć endpointy `GET /me` i `PATCH /me` za pomocą `@Roles('TRAINER')`. Logika w serwisie powinna operować na `id` zalogowanego trenera.
  3. **`ServicesController`**:
     - Zabezpieczyć `POST` za pomocą `@Roles('TRAINER')`. Serwis `services.service.ts` musi pobierać `id` trenera z tokenu i przypisywać je do nowej usługi.
     - Zabezpieczyć `PATCH` i `DELETE` za pomocą `@Roles('TRAINER')`. Serwis musi sprawdzać, czy zalogowany trener jest właścicielem modyfikowanej usługi.
  4. **`UnavailabilitiesController`**:
     - Zabezpieczyć `POST` i `DELETE` za pomocą `@Roles('TRAINER')`. Serwis musi weryfikować własność, podobnie jak w `ServicesController`.
  5. **`BookingsController`**:
     - Zabezpieczyć `POST` za pomocą `@Roles('CLIENT')`.
     - Zabezpieczyć `PATCH /:id/accept` i `PATCH /:id/reject` za pomocą `@Roles('TRAINER')`. Serwis musi sprawdzić, czy zalogowany trener jest przypisany do tej rezerwacji.
     - Zabezpieczyć `PATCH /:id/cancel` za pomocą `@Roles('CLIENT', 'TRAINER')`. Serwis musi sprawdzić, czy zalogowany użytkownik jest jedną ze stron rezerwacji.
     - Zaimplementować w serwisie dynamiczne zwracanie danych w `GET` w zależności od roli zalogowanego użytkownika.
  6. **`BookingBansController`**:
     - Zabezpieczyć `POST` i `DELETE` za pomocą `@Roles('ADMIN')`.
  7. **`ServiceTypesController` i `SpecializationsController`**:
     - Zabezpieczyć `POST`, `PATCH`, `DELETE` za pomocą `@Roles('ADMIN')`.
     - Oznaczyć endpointy `GET` jako `@Public()`.

### Krok 2: Refaktoryzacja i Testy

- **Cel:** Weryfikacja poprawności działania całego systemu autoryzacji.
- **Zadania:**
  1. Przejrzeć wszystkie kontrolery i upewnić się, że każdy endpoint ma zdefiniowaną regułę dostępu (`@Public()` lub odpowiednie `@Roles`).
  2. Zaktualizować lub stworzyć testy E2E dla każdego endpointu, aby sprawdzić przypadki:
     - Dostępu bez autoryzacji (oczekiwany błąd 401).
     - Dostępu z niewystarczającymi uprawnieniami (oczekiwany błąd 403).
     - Próby modyfikacji nie swoich zasobów (oczekiwany błąd 403 lub 404).
     - Poprawnego dostępu i modyfikacji.
  3. Zaktualizować dokumentację API (Swagger/OpenAPI), aby odzwierciedlała wymagane role dla każdego endpointu.
