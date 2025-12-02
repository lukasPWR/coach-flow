# API Endpoint Implementation Plan: POST /bookings

## 1. Przegląd punktu końcowego

Punkt końcowy umożliwia zalogowanym klientom (`CLIENT`) utworzenie nowej prośby o rezerwację usługi u trenera. System weryfikuje dostępność terminu, poprawność danych oraz uprawnienia klienta (brak blokad). Nowa rezerwacja otrzymuje status `PENDING`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/bookings`
- **Uwierzytelnianie**: Bearer Token (JWT)
- **Wymagane Role**: `CLIENT`

**Parametry (Request Body - JSON):**

| Pole | Typ | Opis |
| :--- | :--- | :--- |
| `trainerId` | UUIDString | ID trenera, u którego dokonywana jest rezerwacja. |
| `serviceId` | UUIDString | ID wybranej usługi. |
| `startTime` | ISO8601 String | Data i godzina rozpoczęcia sesji (np. `2023-11-15T14:00:00Z`). |

**Kontekst (z Tokenu JWT):**
- `userId` (jako `clientId` rezerwacji)

## 3. Wykorzystywane typy

- **DTO**:
  - `CreateBookingDto` (Należy zmodyfikować istniejący DTO w `backend/src/bookings/dto/create-booking.dto.ts`, usuwając pole `clientId`, które nie powinno być przesyłane w body).
- **Encje (TypeORM)**:
  - `Booking` (`backend/src/bookings/entities/booking.entity.ts`)
  - `Service` (`backend/src/services/entities/service.entity.ts`)
  - `User` (`backend/src/users/entities/user.entity.ts`)
  - `BookingBan` (`backend/src/booking-bans/entities/booking-ban.entity.ts`)
  - `Unavailability` (`backend/src/unavailabilities/entities/unavailability.entity.ts`)

## 3. Szczegóły odpowiedzi

- **Kod sukcesu**: `201 Created`
- **Ciało odpowiedzi**: Obiekt nowo utworzonej rezerwacji.

```json
{
  "id": "uuid",
  "clientId": "uuid",
  "trainerId": "uuid",
  "serviceId": "uuid",
  "startTime": "2023-11-15T14:00:00.000Z",
  "endTime": "2023-11-15T15:00:00.000Z",
  "status": "PENDING",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## 4. Przepływ danych

1.  **Klient** wysyła żądanie `POST /bookings`.
2.  **BookingsController** przechwytuje żądanie, weryfikuje token (Guardy) i ekstrahuje `userId` (clientId).
3.  **BookingsService**:
    a.  Sprawdza, czy klient nie ma aktywnej blokady w tabeli `booking_bans`.
    b.  Pobiera szczegóły usługi (`serviceId`) z bazy danych, aby uzyskać czas trwania (`durationMinutes`) i cenę.
    c.  Weryfikuje, czy usługa należy do podanego `trainerId`.
    d.  Oblicza `endTime` (`startTime` + `durationMinutes`).
    e.  Sprawdza dostępność terminu (konflikty w tabeli `bookings` oraz `unavailabilities` dla trenera).
    f.  Tworzy encję `Booking` ze statusem `PENDING`.
    g.  Zapisuje rezerwację w bazie danych.
4.  **Baza danych** zwraca zapisaną encję.
5.  **Controller** zwraca odpowiedź do klienta.

## 5. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagany poprawny token JWT.
- **Autoryzacja**: Tylko użytkownicy z rolą `CLIENT` mogą tworzyć rezerwacje (użycie `@Roles(UserRole.CLIENT)`).
- **Integralność danych**: `clientId` jest pobierany z tokenu, co uniemożliwia tworzenie rezerwacji w imieniu innych użytkowników.
- **Walidacja**: Ścisła walidacja typów (UUID, Date) za pomocą `ValidationPipe`.
- **Blokady**: System respektuje blokady nałożone na klientów (`booking_bans`).

## 6. Obsługa błędów

| Scenariusz | Kod HTTP | Wyjątek NestJS | Komunikat |
| :--- | :--- | :--- | :--- |
| Błędy walidacji (np. zły format daty) | 400 | `BadRequestException` | Komunikaty z class-validator |
| Termin zajęty (inna rezerwacja lub niedostępność) | 400 | `BadRequestException` | "The selected time slot is not available." |
| Usługa lub trener nie istnieje | 404 | `NotFoundException` | "Service not found" / "Trainer not found" |
| Usługa nie należy do trenera | 400 | `BadRequestException` | "Service does not belong to the specified trainer" |
| Klient zbanowany | 403 | `ForbiddenException` | "You are currently banned from making bookings." |
| Termin w przeszłości | 400 | `BadRequestException` | "Cannot book a time in the past." |
| Nieautoryzowany dostęp | 401 | `UnauthorizedException` | "Unauthorized" |

## 7. Rozważania dotyczące wydajności

- **Indeksy**: Upewnić się, że istnieją indeksy na polach używanych do wyszukiwania konfliktów: `bookings(trainer_id, start_time)`, `unavailabilities(trainer_id, start_time)`.
- **Liczba zapytań**: Zminimalizować liczbę zapytań do bazy (np. jedno zapytanie sprawdzające konflikty obejmujące zarówno rezerwacje, jak i niedostępności, lub równoległe `Promise.all`).

## 8. Etapy wdrożenia

1.  **Aktualizacja DTO**: Zmodyfikować `backend/src/bookings/dto/create-booking.dto.ts` - usunąć pole `clientId` (lub uczynić je opcjonalnym/wewnętrznym), aby nie było wymagane w body requestu.
2.  **Implementacja BookingsService**:
    - Utworzyć plik `backend/src/bookings/bookings.service.ts`.
    - Zaimplementować metodę `create(clientId: string, createBookingDto: CreateBookingDto)`.
    - Dodać logikę weryfikacji dostępności (query builder lub find) oraz sprawdzania blokad.
3.  **Implementacja BookingsController**:
    - Utworzyć plik `backend/src/bookings/bookings.controller.ts`.
    - Zdefiniować endpoint `@Post()`.
    - Zastosować dekoratory `@UseGuards(JwtAuthGuard, RolesGuard)` oraz `@Roles(UserRole.CLIENT)`.
    - Wywołać serwis przekazując `user.id` i body.
4.  **Rejestracja w module**: Zaktualizować `backend/src/bookings/bookings.module.ts`, dodając kontroler, serwis oraz importując niezbędne moduły TypeORM (`TypeOrmModule.forFeature([Booking, Service, User, BookingBan, Unavailability])`).
5.  **Testy Manualne**: Sprawdzenie scenariuszy pozytywnych i obsługi błędów (zajęty termin, zbanowany klient).

