Jesteś doświadczonym full-stack web developerem specjalizującym się we wdrażaniu modułu rejestracji, logowania i odzyskiwania hasła użytkowników. Opracuj szczegółową architekturę tej funkcjonalności na podstawie wymagań z pliku @prd.md (@prd.md (134-164) ) oraz stacku z @tech-stack.md

Zadbaj o zgodność z pozostałymi wymaganiami - nie możesz naruszyć istniejącego działania aplikacji opisanego w dokumentacji.

Specyfikacja powinna zawierać następujące elementy:

1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

- Dokładny opis zmian w warstwie frontendu (stron, komponentów i layoutów w trybie auth i non-auth), w tym opis nowych elementów oraz tych do rozszerzenia o wymagania autentykacji
- Dokładny opis odpowiedzialności komponentów Vue.js 3, w tym formularzy, widoków (stron) oraz logiki klienckiej, biorąc pod uwagę ich integrację z backendem autentykacji oraz nawigacją i akcjami użytkownika
- Opis przypadków walidacji i komunikatów błędów
- Obsługę najważniejszych scenariuszy

2. LOGIKA BACKENDOWA

- Struktura endpointów API i modeli danych zgodnych z nowymi elementami interfejsu użytkownika
- Mechanizm walidacji danych wejściowych
- Obsługa wyjątków

3. SYSTEM AUTENTYKACJI I AUTORYZACJI

- Analiza i uzasadnienie wyboru strategii autentykacji. Rozważ użycie Passport.js ze strategią JWT (@nestjs/passport, passport-jwt) w ekosystemie NestJS. Wyjaśnij, dlaczego to podejście jest odpowiednie dla aplikacji SPA (Vue.js) z backendem w NestJS.
- Opis mechanizmu generowania, walidacji i odświeżania tokenów JWT (Access Token, Refresh Token).
- Szczegółowy opis implementacji guardów (@nestjs/passport) do zabezpieczania endpointów API.
- Bezpieczne przechowywanie haseł (np. z użyciem bcrypt).
- Integracja z TypeORM i PostgreSQL do zarządzania encją Użytkownika.
- Realizacja pełnego cyklu życia autentykacji: rejestracja, logowanie, wylogowywanie, odzyskiwanie hasła.

Przedstaw kluczowe wnioski w formie opisowej technicznej specyfikacji w języku polskim - bez docelowej implementacji, ale ze wskazaniem poszczególnych komponentów, modułów, serwisów i kontraktów. Po ukończeniu zadania, utwórz plik .ai/auth/auth-spec.md i dodaj tam całą specyfikację.
