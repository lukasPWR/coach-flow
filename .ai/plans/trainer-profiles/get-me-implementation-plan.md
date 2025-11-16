# API Endpoint Implementation Plan: GET /trainer-profile/me

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest umożliwienie uwierzytelnionemu użytkownikowi z rolą `TRAINER` pobranie własnego, szczegółowego profilu. Odpowiedź będzie zawierać zagregowane informacje z kilku powiązanych zasobów, takich jak dane osobowe, opis, specjalizacje i oferowane usługi.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/trainer-profile/me`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.
- **Nagłówki**:
  - `Authorization`: `Bearer <JWT>` (Wymagane)

## 3. Wykorzystywane typy

- **DTO Wejściowe**: Brak. Identyfikator użytkownika zostanie pobrany z obiektu `request.user` po pomyślnej walidacji tokenu JWT.
- **DTO Wyjściowe**: `TrainerProfileResponseDto`

  ```typescript
  // Definicja DTO, które będzie agregować dane.
  // Może zawierać pod-DTO dla zagnieżdżonych obiektów.

  class SpecializationDto {
    id: string
    name: string
  }

  class ServiceDto {
    id: string
    name: string // To pole wymaga dołączenia relacji do service_types
    price: number
    durationMinutes: number
  }

  class TrainerProfileResponseDto {
    id: string // user.id
    name: string // user.name
    email: string // user.email
    city: string // trainerProfile.city
    description: string // trainerProfile.description
    profilePictureUrl: string // trainerProfile.profilePictureUrl
    specializations: SpecializationDto[]
    services: ServiceDto[]
  }
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "id": "b1c2d3e4-...",
    "name": "Anna Nowak",
    "email": "anna.nowak@example.com",
    "city": "Warszawa",
    "description": "Certyfikowany trener personalny z 10-letnim doświadczeniem...",
    "profilePictureUrl": "http://example.com/path/to/image.jpg",
    "specializations": [
      { "id": "s1...", "name": "Trening siłowy" },
      { "id": "s2...", "name": "Utrata wagi" }
    ],
    "services": [
      {
        "id": "svc1...",
        "name": "Trening personalny",
        "price": 150.0,
        "durationMinutes": 60
      }
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Gdy token JWT jest nieprawidłowy, wygasł lub go brakuje.
  - `403 Forbidden`: Gdy uwierzytelniony użytkownik nie ma roli `TRAINER`.
  - `404 Not Found`: Gdy profil trenera powiązany z `userId` z tokenu nie istnieje.

## 5. Przepływ danych

1.  Żądanie `GET /trainer-profile/me` trafia do serwera.
2.  `JwtAuthGuard` przechwytuje żądanie, weryfikuje token JWT z nagłówka `Authorization` i dołącza zdekodowany `payload` (w tym `userId` i `role`) do obiektu `request.user`.
3.  `RolesGuard` sprawdza, czy `request.user.role` jest równe `TRAINER`.
4.  Jeśli oba guardy przejdą pomyślnie, sterowanie jest przekazywane do metody w `TrainerProfilesController`.
5.  Kontroler wywołuje metodę `findMyProfileByUserId(userId)` z `TrainerProfilesService`, przekazując `userId` z `request.user`.
6.  Serwis wykonuje zapytanie do bazy danych (za pomocą TypeORM Repository), aby znaleźć `TrainerProfile` wraz z powiązanymi encjami:
    - `user` (dla `name`, `email`)
    - `specializations` (relacja `ManyToMany`)
    - `services` (relacja `OneToMany`), a dla każdej usługi także `serviceType` (dla `name`).
7.  Jeśli zapytanie nie zwróci profilu, serwis rzuca `NotFoundException`.
8.  Serwis mapuje pobrane encje na `TrainerProfileResponseDto`.
9.  Kontroler zwraca `TrainerProfileResponseDto` z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Zapewnione przez `JwtAuthGuard`. Należy upewnić się, że jest on zastosowany do endpointu (globalnie lub lokalnie).
- **Autoryzacja**: Zapewniona przez `RolesGuard`, który musi być skonfigurowany do sprawdzania roli `TRAINER`.
- **Ochrona danych**: Zapytanie do bazy danych musi być precyzyjnie skonstruowane, aby nie pobierać wrażliwych danych, takich jak `password_hash` użytkownika. Należy użyć opcji `select` w TypeORM lub DTO z dekoratorami `@Exclude` w `class-transformer`.

## 7. Rozważania dotyczące wydajności

- **Zapytania do bazy danych**: Kluczowe jest zoptymalizowanie zapytania, aby pobrać wszystkie wymagane dane za jednym razem, unikając problemu N+1. Należy użyć `LEFT JOIN` (w TypeORM `relations` lub `leftJoinAndSelect` w `QueryBuilder`) do dołączenia `user`, `specializations` i `services` z ich `serviceType`.
- **Rozmiar odpowiedzi**: W przyszłości, jeśli listy specjalizacji lub usług staną się bardzo długie, można rozważyć paginację dla tych zagnieżdżonych zasobów. Na obecnym etapie nie jest to wymagane.

## 8. Etapy wdrożenia

1.  **Aktualizacja `TrainerProfilesController`**:

    - Dodać nową metodę `getMyProfile()` z dekoratorem `@Get('me')`.
    - Zabezpieczyć metodę za pomocą `@UseGuards(JwtAuthGuard, RolesGuard)` oraz `@Roles(UserRole.TRAINER)`.
    - Wstrzyknąć obiekt `Request` za pomocą `@Req()` i pobrać `userId` z `req.user.id`.
    - Wywołać odpowiednią metodę z serwisu.

2.  **Aktualizacja `TrainerProfilesService`**:

    - Dodać nową metodę asynchroniczną `findMyProfileByUserId(userId: string)`.
    - Wstrzyknąć repozytorium `TrainerProfile` (`@InjectRepository(TrainerProfile)`).
    - Zaimplementować logikę pobierania danych z bazy za pomocą `findOne` z opcją `relations` lub używając `QueryBuilder` w celu zoptymalizowania zapytania.
    - Upewnić się, że dołączane są relacje: `user`, `specializations`, `services`, `services.serviceType`.
    - Dodać obsługę błędu `NotFoundException`, jeśli profil nie zostanie znaleziony.

3.  **Utworzenie DTO**:

    - Stworzyć plik `backend/src/trainer-profiles/dto/trainer-profile-response.dto.ts`.
    - Zdefiniować w nim klasy `TrainerProfileResponseDto`, `SpecializationDto` i `ServiceDto` zgodnie z sekcją 3.

4.  **Mapowanie danych**:

    - W `TrainerProfilesService`, po pobraniu danych z bazy, zaimplementować mapowanie z encji `TrainerProfile` na `TrainerProfileResponseDto`. Można to zrobić ręcznie lub przy użyciu biblioteki `class-transformer`.

5.  **Aktualizacja modułu `Auth`**:

    - Upewnić się, że `JwtStrategy` poprawnie dodaje do payloadu `userId` i `role`.
    - Zaimplementować `RolesGuard`, jeśli jeszcze nie istnieje w `src/common/guards`.

6.  **Testy**:
    - **Testy jednostkowe**: Napisać testy dla metody `findMyProfileByUserId` w `TrainerProfilesService`, mockując repozytorium i sprawdzając, czy poprawnie zwraca dane lub rzuca błąd.
    - **Testy E2E**: Napisać testy dla endpointu `GET /trainer-profile/me`, obejmujące scenariusze:
      - Poprawne zapytanie z tokenem trenera.
      - Zapytanie bez tokenu (oczekiwany błąd 401).
      - Zapytanie z tokenem klienta (oczekiwany błąd 403).
      - Zapytanie z tokenem trenera, który nie ma jeszcze profilu (oczekiwany błąd 404).
