Jesteś seniorem backend / NestJS odpowiedzialnym za zaplanowanie kompletnej implementacji modułu autentykacji i autoryzacji w aktualnym projekcie.

## Kontekst i źródła wiedzy

Masz dostęp do:

- dokumentacji autentykacji:
- opisu stacku technologicznego: @tech-stack.md
- dokumentu z wymaganiami biznesowymi / PRD: @prd.md
- aktualnego kodu projektu (moduły NestJS, encje TypeORM, konfiguracje, middleware, guardy itp.)
- ewentualnych dodatkowych plików dokumentacji przekazanych jako kontekst

Na podstawie tych źródeł:

1. Zidentyfikuj istniejące elementy powiązane z autentykacją/autoryzacją.
2. Dopasuj wymagania biznesowe z PRD do architektury opisanej w @auth-spec.md.
3. Uwzględnij założenia stacku z @tech-stack.md (NestJS + TypeORM + PostgreSQL, JWT itd.).

## Twoje zadanie

Przygotuj szczegółowy, techniczny plan implementacji backendowej autentykacji i autoryzacji w NestJS, który może zostać zaimplementowany krok po kroku przez mid developera.

Plan ma obejmować co najmniej:

1. **Architektura modułów**

   - Jakie moduły NestJS będą potrzebne (np. `AuthModule`, `UsersModule`, ewentualnie `TokensModule`, `PasswordResetModule`).
   - Zależności między modułami (importy/eksporty).
   - W jaki sposób moduły mają być zorganizowane w strukturze katalogów (np. `src/auth`, `src/users`, `src/common/guards`, `src/common/decorators`).

2. **Encje i warstwa danych**

   - Jakie encje TypeORM są wymagane (np. `User`, `RefreshToken`, `PasswordResetToken`).
   - Pola, typy i indeksy (unikalność e-maila, relacje z użytkownikiem, daty wygaśnięcia tokenów).
   - Wymagane migracje bazy danych oraz kolejność ich utworzenia.
   - Jeśli w kodzie istnieją już encje użytkowników – opisz potrzebne zmiany/refaktor.

3. **DTO i walidacja**

   - Zdefiniuj komplet DTO (`RegisterDto`, `LoginDto`, `RefreshTokenDto`, ewentualne DTO do odzyskiwania hasła).
   - Dla każdego DTO wypisz pola oraz dekoratory `class-validator` potrzebne do walidacji.
   - Powiązanie DTO z konkretnymi endpointami.

4. **Kontrolery i endpointy**

   - Wypisz wszystkie endpointy API powiązane z autentykacją / autoryzacją, np.:
     - `POST /api/auth/register`
     - `POST /api/auth/login`
     - `POST /api/auth/logout`
     - `POST /api/auth/refresh`
     - ewentualnie endpointy do odzyskiwania hasła.
   - Dla każdego endpointu:
     - Oczekiwane body / query / param.
     - Struktura odpowiedzi (payload).
     - Wymagane status kody (sukces + błędy).
     - Powiązane guardy/dekoratory (`@UseGuards`, `@Public`, `@Roles`, itp.).

5. **Serwisy i logika domenowa**

   - Funkcjonalności `AuthService` (np. rejestracja, logowanie, generowanie tokenów, walidacja użytkownika, wylogowanie, obsługa refresh tokenów).
   - Współpraca `AuthService` z `UsersService` (np. sprawdzanie duplikatu e-maila, pobieranie użytkownika z hasłem).
   - Logika związana z przechowywaniem/odświeżaniem/unieważnianiem refresh tokenów (hashowanie, powiązanie z użytkownikiem, usuwanie przy wylogowaniu).
   - Ewentualna logika odzyskiwania hasła (generowanie tokenu, zapis, walidacja, zmiana hasła).

6. **Tokeny, bezpieczeństwo i konfiguracja**

   - Konfiguracja JWT (sekrety, czas życia access/refresh tokenów, różne strategie jeśli wymagane).
   - Implementacja `JwtStrategy` (payload, walidacja, co trafia do `request.user`).
   - Miejsce i sposób trzymania konfiguracji (np. `ConfigModule`, zmienne środowiskowe).
   - Zasady haszowania haseł (`bcrypt` – liczba rund, miejsca użycia).

7. **Guardy, dekoratory i autoryzacja ról**

   - Definicja i użycie `JwtAuthGuard`.
   - Ewentualny `RolesGuard` + dekorator `@Roles()` i sposób nadawania ról użytkownikom.
   - Jak guardy mają być używane w innych modułach (np. moduł kalendarza, moduł treningów).

8. **Obsługa błędów i edge-case’y**

   - Jakie wyjątki NestJS są rzucane w poszczególnych scenariuszach (np. `BadRequestException`, `UnauthorizedException`, `ConflictException`).
   - Scenariusze brzegowe (np. próba logowania nieaktywnego użytkownika, nieważny refresh token, token po wygaśnięciu).
   - Spójny format odpowiedzi błędów API.

9. **Integracja z frontendem**

   - Wymagania dotyczące nagłówków, formatu odpowiedzi i miejsc, gdzie frontend powinien wysyłać token (nagłówek `Authorization: Bearer ...`).
   - Założenia co do przechowywania access/refresh tokenów po stronie frontu (zgodne z @auth-spec.md).
   - Potrzebne zmiany w istniejących endpointach, aby frontend Vue mógł korzystać z nowych mechanizmów (np. `fetchUser`).

10. **Plan wdrożenia i migracji**
    - Kolejność implementacji (krok po kroku).
    - Jak bezpiecznie wdrożyć zmiany w środowisku deweloperskim/staging/produkcyjnym.
    - Ewentualne kroki migracji istniejących użytkowników (jeśli w projekcie już są).

## Forma odpowiedzi

1. Zwróć odpowiedź w postaci dobrze zorganizowanego dokumentu markdown z nagłówkami (`##`, `###`) dla kolejnych sekcji planu.
2. Tam, gdzie to pomocne, używaj tabel, np.:
   - mapowanie endpointów na DTO i status kody,
   - mapowanie ról na uprawnienia,
   - porównanie stanu „przed” i „po” refaktorze.
3. Odnoś się do konkretnych nazw plików i ścieżek (np. `src/auth/auth.module.ts`, `src/users/user.entity.ts`) jeśli możesz je wywnioskować z kontekstu.
4. Wyraźnie oznacz:
   - „TODO / Decyzja” – miejsca, gdzie wymagane są decyzje architektoniczne,
   - „Ryzyka” – potencjalne problemy, o których trzeba pamiętać.

## Pytania wstępne

Zanim wygenerujesz plan:

1. Przeanalizuj dostępny kontekst.
2. Zadaj mi **dokładnie 5 kluczowych pytań technicznych** dotyczących niejasnych elementów implementacji (np. polityka ról, wymagania bezpieczeństwa, istniejące moduły użytkownika, integracje z innymi serwisami).
3. Dopiero po uzyskaniu odpowiedzi wygeneruj kompletny plan implementacji według powyższych wytycznych.

Jeśli jakieś informacje są całkowicie nieznane i nie da się ich wywnioskować z kontekstu, jasno je zaznacz w sekcji „Założenia” na początku planu.
