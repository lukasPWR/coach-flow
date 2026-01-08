<analiza_projektu>
Thinking Process:

1.  **Analiza Komponentów Projektu:**

    - **Backend (NestJS + TypeORM):** Jest to serce systemu. Główne moduły to:
      - _Auth:_ JWT (Access/Refresh), bcrypt, zarządzanie hasłami, role (CLIENT, TRAINER, ADMIN).
      - _Users & Trainer Profiles:_ Relacja 1:1 między użytkownikiem a profilem trenera. Profil zawiera specjalizacje (relacja M:N) i usługi.
      - _Bookings (Rezerwacje):_ Najbardziej złożona logika biznesowa. Obsługa statusów (PENDING, ACCEPTED, REJECTED, CANCELLED), walidacja konfliktów czasowych, logowanie późnych anulacji.
      - _Booking Bans (Blokady):_ Mechanizm karania klientów za późne odwołania (automatyczne lub ręczne przez Admina).
      - _Services & Service Types:_ Słowniki i definicje usług oferowanych przez trenerów.
      - _Unavailabilities:_ Blokowanie czasu przez trenera.
    - **Frontend (Vue.js 3 + Vite):** Aplikacja kliencka korzystająca z Tailwind i shadcn-vue. Odpowiedzialna za prezentację kalendarza, formularzy i interakcję z API.
    - **Baza Danych (PostgreSQL):** Relacyjna baza danych. Kod wskazuje na użycie TypeORM (mimo wzmianki o Prisma w README - co jest niespójnością do zgłoszenia).

2.  **Specyfika Stosu Technologicznego:**

    - **NestJS & TypeORM:** Ułatwia pisanie testów jednostkowych (Dependency Injection) oraz integracyjnych (użycie modułów testowych NestJS). Wymaga mockowania repozytoriów.
    - **PostgreSQL:** Konieczność testowania transakcji (szczególnie przy rezerwacjach) i zapytań czasowych (strefy czasowe).
    - **Docker:** Ułatwia postawienie izolowanego środowiska testowego (kontener `postgres` w `docker-compose`).
    - **JWT Auth:** Testy muszą uwzględniać nagłówki autoryzacyjne i odświeżanie tokenów.

3.  **Priorytety Testowe:**

    1.  **Moduł Bookings:** Krytyczna ścieżka biznesowa. Błędy tutaj (np. double booking) są niedopuszczalne.
    2.  **Moduł Auth & RBAC (Role-Based Access Control):** Bezpieczeństwo danych (np. trener A nie może edytować usług trenera B).
    3.  **Logika Biznesowa Blokad (Bans):** Weryfikacja, czy zbanowany klient faktycznie nie może dokonać rezerwacji.
    4.  **Integracja Trener-Usługi-Specjalizacje:** Poprawność wyświetlania i filtrowania danych (widocznych w `TrainerProfilesController`).

4.  **Obszary Ryzyka:**
    - **Obsługa czasu (Date/Timestamp):** Kod backendu operuje na obiektach `Date`. Ryzyko błędów przy konwersji stref czasowych między klientem, serwerem a bazą danych (szczególnie przy sprawdzaniu dostępności slotów).
    - **Spójność danych (Concurrency):** Ryzyko wyścigu (Race Condition) przy jednoczesnej próbie rezerwacji tego samego terminu przez dwie osoby.
    - **Niespójność dokumentacji a kodu:** README wspomina o Prisma, kod używa TypeORM. Może to prowadzić do błędnych założeń deweloperskich.
    - **Logika "Soft Delete":** Usługi są usuwane "miękko" (`deletedAt`). Należy upewnić się, że usunięte usługi nie są dostępne do rezerwacji.

</analiza_projektu>

<plan_testów>

# Plan Testów dla Projektu CoachFlow

## 1. Wprowadzenie i Cele

Celem niniejszego planu jest zapewnienie wysokiej jakości oprogramowania platformy **CoachFlow** poprzez systematyczną weryfikację funkcjonalności, wydajności i bezpieczeństwa.
Głównym celem jest zminimalizowanie ryzyka wystąpienia błędów krytycznych w procesie rezerwacji treningów oraz zapewnienie poprawności izolacji danych między rolami użytkowników (Klient, Trener, Administrator).

Uwaga wstępna: Wykryto rozbieżność między dokumentacją (README sugeruje Prisma) a kodem (faktyczne użycie TypeORM). Plan testów opiera się na **stanie faktycznym kodu (TypeORM)**.

## 2. Zakres Testów

### W Zakresie (In-Scope):

- **Backend API (NestJS):** Wszystkie kontrolery i serwisy (Auth, Users, Trainers, Services, Bookings, Bans).
- **Baza Danych (PostgreSQL):** Poprawność migracji, więzy integralności, procedury składowane (jeśli istnieją).
- **Logika Biznesowa:** Walidacja rezerwacji, obliczanie dostępności, nakładanie blokad.
- **Bezpieczeństwo:** Weryfikacja uprawnień (RBAC) i autentykacji (JWT).
- **Frontend (Vue.js):** Podstawowe ścieżki krytyczne (E2E) z perspektywy użytkownika.

### Poza Zakresem (Out-of-Scope):

- Testy obciążeniowe infrastruktury DigitalOcean (chyba że wskazano inaczej).
- Szczegółowe testy kompatybilności przeglądarkowej dla starszych wersji (skupiamy się na nowoczesnych przeglądarkach zgodnie ze stosem Vite/Vue3).

## 3. Typy Testów

1.  **Testy Jednostkowe (Unit Tests):**
    - Skupienie na serwisach (`*.service.ts`).
    - Izolacja logiki biznesowej (mockowanie repozytoriów TypeORM).
    - Pokrycie min. 80% dla modułów `BookingsService` i `AuthService`.
2.  **Testy Integracyjne (Integration Tests):**
    - Testy kontrolerów (`*.controller.ts`) z wykorzystaniem `supertest`.
    - Weryfikacja komunikacji z testową bazą danych PostgreSQL (w kontenerze Docker).
    - Weryfikacja poprawności działania Guardów (`JwtAuthGuard`, `RolesGuard`).
3.  **Testy End-to-End (E2E):**
    - Symulacja pełnych ścieżek użytkownika (od rejestracji do rezerwacji).
    - Wykorzystanie Cypress lub Playwright (dla Frontendu) lub supertest na poziomie całego API.
4.  **Testy API (Kontraktowe):**
    - Weryfikacja zgodności odpowiedzi ze specyfikacją Swagger/OpenAPI.
    - Walidacja kodów błędów HTTP (400, 401, 403, 404, 409).

## 4. Scenariusze Testowe (Kluczowe Funkcjonalności)

### A. Moduł Rezerwacji (Bookings) - Ścieżka Krytyczna

| ID       | Nazwa Scenariusza                                | Opis                                                                   | Oczekiwany Rezultat                                                |
| :------- | :----------------------------------------------- | :--------------------------------------------------------------------- | :----------------------------------------------------------------- |
| **B-01** | Utworzenie poprawnej rezerwacji                  | Klient rezerwuje dostępny termin u trenera.                            | Status 201, rezerwacja w stanie `PENDING`.                         |
| **B-02** | Wykrywanie konfliktów czasowych (Double Booking) | Dwóch klientów próbuje zarezerwować ten sam termin.                    | Pierwszy: 201, Drugi: 400 (Bad Request - Slot not available).      |
| **B-03** | Rezerwacja w czasie niedostępności trenera       | Klient próbuje zarezerwować termin pokrywający się z `Unavailability`. | Błąd 400.                                                          |
| **B-04** | Akceptacja rezerwacji przez Trenera              | Trener akceptuje rezerwację `PENDING`.                                 | Status rezerwacji zmienia się na `ACCEPTED`.                       |
| **B-05** | Rezerwacja przez zbanowanego klienta             | Klient z aktywnym `BookingBan` próbuje dokonać rezerwacji.             | Błąd 403 (Forbidden).                                              |
| **B-06** | Późne anulowanie rezerwacji                      | Klient anuluje < 12h przed startem.                                    | Status `CANCELLED`, automatyczne utworzenie `BookingBan` na 7 dni. |

### B. Moduł Autentykacji i Uprawnień (Auth & RBAC)

| ID       | Nazwa Scenariusza                     | Opis                                                      | Oczekiwany Rezultat                                             |
| :------- | :------------------------------------ | :-------------------------------------------------------- | :-------------------------------------------------------------- |
| **A-01** | Rejestracja i Logowanie               | Rejestracja nowego konta, pobranie tokena JWT.            | Otrzymanie `accessToken` i `refreshToken`.                      |
| **A-02** | Dostęp do zasobów Trenera jako Klient | Klient próbuje edytować usługę (`PATCH /services/:id`).   | Błąd 403 (Forbidden).                                           |
| **A-03** | Izolacja danych trenerów              | Trener A próbuje usunąć/edytować usługę Trenera B.        | Błąd 403 lub 404 (zależnie od implementacji `ServicesService`). |
| **A-04** | Odświeżanie tokena                    | Użycie endpointu `/auth/refresh` z ważnym `refreshToken`. | Otrzymanie nowej pary tokenów.                                  |

### C. Zarządzanie Profilem i Usługami

| ID       | Nazwa Scenariusza         | Opis                                                       | Oczekiwany Rezultat                                                                                            |
| :------- | :------------------------ | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **P-01** | Tworzenie profilu trenera | Użytkownik z rolą TRAINER tworzy profil ze specyfikacjami. | Profil utworzony, powiązany z tabelą `specializations`.                                                        |
| **P-02** | Soft Delete usługi        | Trener usuwa usługę.                                       | Usługa ma ustawione `deletedAt`. Nie pojawia się na liście dostępnych usług dla klienta, ale istnieje w bazie. |

## 5. Środowisko Testowe

- **Lokalne:**
  - Node.js v22.14.0 (zgodnie z `.nvmrc`).
  - Docker Desktop (dla kontenerów `postgres` zdefiniowanych w `docker-compose.yml`).
  - Baza danych testowa: `CoachFlow_TEST` (oddzielna od `CoachFlow_DEV` z `init.sql`).
- **CI/CD (GitHub Actions):**
  - Automatyczne uruchamianie testów jednostkowych i linterów przy każdym Pull Request.
  - Efemeryczne kontenery PostgreSQL do testów integracyjnych.

## 6. Narzędzia do Testowania

- **Jest:** Główny framework do testów jednostkowych i integracyjnych (skonfigurowany w `package.json`).
- **Supertest:** Do testowania endpointów HTTP w testach integracyjnych.
- **Postman / Swagger UI:** Do manualnych testów eksploracyjnych API.
- **ESLint / Prettier:** Do statycznej analizy kodu (zapewnienie jakości kodu testowego).
- **PgAdmin / DBeaver:** Do weryfikacji stanu bazy danych.

## 7. Harmonogram Testów

1.  **Faza 1: Testy Jednostkowe i Statyczna Analiza**
    - Wykonywane na bieżąco przez deweloperów.
    - Blokada merge'a w przypadku spadku pokrycia kodu lub błędów lintera.
2.  **Faza 2: Testy Integracyjne API**
    - Tworzone równolegle z nowymi endpointami.
    - Uruchamiane w pipeline CI/CD.
3.  **Faza 3: Testy Manualne / Eksploracyjne**
    - Przed wydaniem wersji demonstracyjnej (np. sprawdzenie flow "Późne anulowanie -> Ban").
4.  **Faza 4: Regresja**
    - Przed każdym wdrożeniem na produkcję.

## 8. Kryteria Akceptacji (Entry/Exit Criteria)

- **Wejście do testów:**
  - Kod kompiluje się bez błędów (`npm run build`).
  - Baza danych uruchamia się i migracje przechodzą poprawnie (`npm run migration:run`).
- **Wyjście z testów (Akceptacja):**
  - 100% testów jednostkowych i integracyjnych zakończonych sukcesem.
  - Brak błędów krytycznych (Critical) i wysokich (High) w Backlogu.
  - Pokrycie kodu (Code Coverage) powyżej 80%.
  - Weryfikacja naprawienia niespójności dokumentacji (README vs Kod).

## 9. Role i Odpowiedzialności

- **QA Engineer:** Tworzenie planu testów, scenariuszy E2E, testy manualne, weryfikacja błędów.
- **Backend Developer:** Pisanie testów jednostkowych, testów integracyjnych dla swoich modułów, naprawa zgłoszonych błędów.
- **Frontend Developer:** Testy komponentów Vue, współpraca przy testach E2E.
- **DevOps:** Konfiguracja środowiska testowego w CI/CD.

## 10. Procedury Raportowania Błędów

Błędy należy zgłaszać w systemie śledzenia zagadnień (np. GitHub Issues/Jira) według szablonu:

1.  **Tytuł:** Krótki opis problemu [Moduł].
2.  **Priorytet:** (Critical, High, Medium, Low).
3.  **Środowisko:** (Lokalne, Dev, Staging).
4.  **Kroki do reprodukcji:** Dokładna lista kroków.
5.  **Oczekiwany rezultat:** Co powinno się stać.
6.  **Rzeczywisty rezultat:** Co się stało (w tym logi z backendu/błędy konsoli).
7.  **Załączniki:** Screenshoty, payload requestu/response.

---

_Autor: Senior QA Engineer_
_Data: 08.01.2026_

<koniec_planu>
