# Plan Interfejsu API REST

Ten dokument przedstawia projekt interfejsu API REST dla aplikacji CoachFlow, oparty na schemacie bazy danych projektu, wymaganiach produktu i stosie technologicznym.

## 1. Zasoby

API jest zbudowane wokół następujących głównych zasobów:

| Zasób                | Tabela w Bazie Danych       | Opis                                                                                  |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| **Uwierzytelnianie** | `users`                     | Obsługuje rejestrację, logowanie i zarządzanie sesją użytkownika.                     |
| **Użytkownicy**      | `users`                     | Zarządza danymi użytkownika. Głównie do pobierania informacji o bieżącym użytkowniku. |
| **Trenerzy**         | `users`, `trainer_profiles` | Reprezentuje publiczne profile trenerów i umożliwia ich wyszukiwanie/listowanie.      |
| **Profil Trenera**   | `trainer_profiles`          | Zagnieżdżony zasób dla trenera do zarządzania szczegółami własnego profilu.           |
| **Usługi**           | `services`                  | Reprezentuje usługi oferowane przez trenerów. Zarządzane przez trenera.               |
| **Specjalizacje**    | `specializations`           | Lista tylko do odczytu dostępnych specjalizacji, które trenerzy mogą wybrać.          |
| **Rezerwacje**       | `bookings`                  | Zarządza żądaniami rezerwacji, potwierdzeniami i anulowaniami.                        |
| **Niedostępności**   | `unavailabilities`          | Umożliwia trenerom zarządzanie swoimi niedostępnymi terminami.                        |

---

## 2. Punkty końcowe (Endpoints)

### 2.1. Uwierzytelnianie

#### `POST /auth/register`

- **Opis**: Rejestruje nowego użytkownika (Klienta lub Trenera).
- **Ciało Żądania (Request Body)**:
  ```json
  {
    "name": "Jan Kowalski",
    "email": "jan.kowalski@example.com",
    "password": "mocnehaslo123",
    "role": "CLIENT"
  }
  ```
- **Ciało Odpowiedzi (Response Body)**:
  ```json
  {
    "accessToken": "ey...",
    "user": {
      "id": "a1b2c3d4-...",
      "name": "Jan Kowalski",
      "email": "jan.kowalski@example.com",
      "role": "CLIENT"
    }
  }
  ```
- **Sukces**: `201 Created`
- **Błąd**: `400 Bad Request` (Błąd walidacji), `409 Conflict` (Email już istnieje)

#### `POST /auth/login`

- **Opis**: Uwierzytelnia użytkownika i zwraca token JWT.
- **Ciało Żądania**:
  ```json
  {
    "email": "jan.kowalski@example.com",
    "password": "mocnehaslo123"
  }
  ```
- **Ciało Odpowiedzi**:
  ```json
  {
    "accessToken": "ey...",
    "user": {
      "id": "a1b2c3d4-...",
      "name": "Jan Kowalski",
      "email": "jan.kowalski@example.com",
      "role": "CLIENT"
    }
  }
  ```
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized` (Nieprawidłowe dane uwierzytelniające)

---

### 2.2. Użytkownicy

#### `GET /users/me`

- **Opis**: Pobiera profil aktualnie uwierzytelnionego użytkownika.
- **Uwierzytelnianie**: Wymagane.
- **Ciało Odpowiedzi**:
  ```json
  {
    "id": "a1b2c3d4-...",
    "name": "Jan Kowalski",
    "email": "jan.kowalski@example.com",
    "role": "CLIENT",
    "createdAt": "2023-10-27T10:00:00Z"
  }
  ```
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`

---

### 2.3. Trenerzy (Publiczne)

#### `GET /trainers`

- **Opis**: Pobiera paginowaną listę wszystkich publicznych profili trenerów.
- **Parametry Zapytania (Query Params)**:
  - `page` (number, opcjonalnie, domyślnie: 1)
  - `limit` (number, opcjonalnie, domyślnie: 10)
  - `city` (string, opcjonalnie): Filtruj po mieście.
  - `specializationId` (UUID, opcjonalnie): Filtruj po specjalizacji.
- **Ciało Odpowiedzi**:
  ```json
  {
    "data": [
      {
        "id": "b1c2d3e4-...",
        "name": "Anna Nowak",
        "city": "Warszawa",
        "description": "Certyfikowany trener personalny...",
        "profilePictureUrl": "http://...",
        "specializations": [{ "id": "s1...", "name": "Utrata wagi" }]
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10
    }
  }
  ```
- **Sukces**: `200 OK`

#### `GET /trainers/:id`

- **Opis**: Pobiera pojedynczy publiczny profil trenera na podstawie jego ID użytkownika.
- **Ciało Odpowiedzi**:
  ```json
  {
    "id": "b1c2d3e4-...",
    "name": "Anna Nowak",
    "city": "Warszawa",
    "description": "Certyfikowany trener personalny...",
    "profilePictureUrl": "http://...",
    "specializations": [{ "id": "s1...", "name": "Utrata wagi" }],
    "services": [
      {
        "id": "svc1...",
        "name": "Trening personalny",
        "price": 50.0,
        "durationMinutes": 60
      }
    ]
  }
  ```
- **Sukces**: `200 OK`
- **Błąd**: `404 Not Found`

---

### 2.4. Profil Trenera (Zarządzanie Prywatne)

#### `POST /trainers`

- **Opis**: Tworzy nowy profil trenera dla uwierzytelnionego użytkownika.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Żądania**:
  ```json
  {
    "description": "Opis profilu.",
    "city": "Warszawa",
    "profilePictureUrl": "http://...",
    "specializationIds": ["s1...", "s2..."]
  }
  ```
- **Ciało Odpowiedzi**: Utworzony profil trenera.
- **Sukces**: `201 Created`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict` (profil już istnieje)

#### `GET /trainers/me`

- **Opis**: Pobiera własny profil uwierzytelnionego trenera, w tym dane użytkownika, specjalizacje i usługi.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Odpowiedzi**: Pełny profil trenera (z email i szczegółami użytkownika).
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `PATCH /trainers/:id`

- **Opis**: Aktualizuje profil trenera po ID profilu (nie userId). Dostępne dla właściciela profilu lub ADMIN.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER lub ADMIN).
- **Ciało Żądania**:
  ```json
  {
    "description": "Zaktualizowany opis.",
    "city": "Kraków",
    "profilePictureUrl": "http://...",
    "specializationIds": ["s1...", "s2..."]
  }
  ```
- **Ciało Odpowiedzi**: Zaktualizowany profil trenera.
- **Sukces**: `200 OK`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `DELETE /trainers/:id`

- **Opis**: Usuwa profil trenera po ID profilu. Dostępne dla właściciela profilu lub ADMIN.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER lub ADMIN).
- **Sukces**: `204 No Content`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

### 2.5. Usługi (Zarządzane przez Trenera)

#### `GET /services`

- **Opis**: Pobiera listę wszystkich usług w systemie (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Parametry Zapytania**: `page`, `limit`.
- **Ciało Odpowiedzi**: Paginowana lista obiektów usług.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`

#### `GET /services/:id`

- **Opis**: Pobiera pojedynczą usługę (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Odpowiedzi**: Obiekt usługi.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `POST /services`

- **Opis**: Tworzy nową usługę dla uwierzytelnionego trenera.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Żądania**:
  ```json
  {
    "serviceTypeId": "st1...",
    "price": 60.0,
    "durationMinutes": 60
  }
  ```
- **Ciało Odpowiedzi**: Nowo utworzony obiekt usługi.
- **Sukces**: `201 Created`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

#### `PATCH /services/:id`

- **Opis**: Aktualizuje jedną z własnych usług trenera.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Żądania**:
  ```json
  {
    "price": 65.0
  }
  ```
- **Ciało Odpowiedzi**: Zaktualizowany obiekt usługi.
- **Sukces**: `200 OK`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `DELETE /services/:id`

- **Opis**: Usuwa (miękko) jedną z własnych usług trenera.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Sukces**: `204 No Content`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

### 2.6. Specjalizacje (Publiczne)

#### `GET /specializations`

- **Opis**: Pobiera listę wszystkich dostępnych specjalizacji.
- **Ciało Odpowiedzi**:
  ```json
  [
    {
      "id": "s1...",
      "name": "Utrata wagi"
    },
    {
      "id": "s2...",
      "name": "Trening siłowy"
    }
  ]
  ```
- **Sukces**: `200 OK`

#### `POST /specializations`

- **Opis**: Tworzy nową specjalizację (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Żądania**:
  ```json
  {
    "name": "Nowa specjalizacja"
  }
  ```
- **Ciało Odpowiedzi**: Nowo utworzony obiekt specjalizacji.
- **Sukces**: `201 Created`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

#### `PATCH /specializations/:id`

- **Opis**: Aktualizuje istniejącą specjalizację (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Żądania**:
  ```json
  {
    "name": "Zaktualizowana nazwa specjalizacji"
  }
  ```
- **Ciało Odpowiedzi**: Zaktualizowany obiekt specjalizacji.
- **Sukces**: `200 OK`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `DELETE /specializations/:id`

- **Opis**: Usuwa specjalizację (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Sukces**: `204 No Content`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `GET /specializations/:id`

- **Opis**: Pobiera pojedynczą specjalizację.
- **Ciało Odpowiedzi**:
  ```json
  {
    "id": "s1...",
    "name": "Utrata wagi"
  }
  ```
- **Sukces**: `200 OK`
- **Błąd**: `404 Not Found`

---

### 2.7. Typy Usług (Słownikowe)

#### `GET /service-types`

- **Opis**: Pobiera listę wszystkich dostępnych typów usług.
- **Ciało Odpowiedzi**:
  ```json
  [
    {
      "id": "st1...",
      "name": "Trening personalny"
    },
    {
      "id": "st2...",
      "name": "Konsultacja dietetyczna"
    }
  ]
  ```
- **Sukces**: `200 OK`

#### `GET /service-types/:id`

- **Opis**: Pobiera pojedynczy typ usługi.
- **Ciało Odpowiedzi**:
  ```json
  {
    "id": "st1...",
    "name": "Trening personalny"
  }
  ```
- **Sukces**: `200 OK`
- **Błąd**: `404 Not Found`

#### `POST /service-types`

- **Opis**: Tworzy nowy typ usługi (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Żądania**:
  ```json
  {
    "name": "Nowy typ usługi"
  }
  ```
- **Ciało Odpowiedzi**: Nowo utworzony obiekt typu usługi.
- **Sukces**: `201 Created`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

#### `PATCH /service-types/:id`

- **Opis**: Aktualizuje istniejący typ usługi (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Żądania**:
  ```json
  {
    "name": "Zaktualizowana nazwa"
  }
  ```
- **Ciało Odpowiedzi**: Zaktualizowany obiekt typu usługi.
- **Sukces**: `200 OK`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `DELETE /service-types/:id`

- **Opis**: Usuwa typ usługi (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Sukces**: `204 No Content`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

### 2.8. Rezerwacje

#### `GET /bookings`

- **Opis**: Pobiera listę rezerwacji dla uwierzytelnionego użytkownika (klienta lub trenera).
- **Uwierzytelnianie**: Wymagane.
- **Parametry Zapytania**:
  - `status` (string, opcjonalnie): Filtruj po `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`.
  - `role` (string, opcjonalnie): Dla użytkownika będącego jednocześnie klientem i trenerem, filtruj widok `client` lub `trainer`.
  - `page`, `limit`
- **Ciało Odpowiedzi**: Paginowana lista obiektów rezerwacji.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`

#### `POST /bookings`

- **Opis**: Klient tworzy nowe żądanie rezerwacji u trenera.
- **Uwierzytelnianie**: Wymagane (Rola: CLIENT).
- **Ciało Żądania**:
  ```json
  {
    "trainerId": "b1c2d3e4-...",
    "serviceId": "svc1...",
    "startTime": "2023-11-15T14:00:00Z"
  }
  ```
- **Ciało Odpowiedzi**: Nowo utworzony obiekt rezerwacji ze statusem `PENDING`.
- **Sukces**: `201 Created`
- **Błąd**: `400 Bad Request` (np. termin niedostępny), `401 Unauthorized`, `403 Forbidden`

#### `POST /bookings/:id/approve`

- **Opis**: Trener akceptuje oczekujące żądanie rezerwacji.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Odpowiedzi**: Zaktualizowany obiekt rezerwacji ze statusem `ACCEPTED`.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (Rezerwacja nie jest w stanie `PENDING`).

#### `POST /bookings/:id/reject`

- **Opis**: Trener odrzuca oczekujące żądanie rezerwacji.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Odpowiedzi**: Zaktualizowany obiekt rezerwacji ze statusem `REJECTED`.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.

#### `POST /bookings/:id/cancel`

- **Opis**: Użytkownik (klient lub trener) anuluje zaakceptowaną rezerwację.
- **Uwierzytelnianie**: Wymagane.
- **Logika Biznesowa**: Jeśli klient anuluje rezerwację mniej niż 12 godzin przed `startTime`, tworzony jest `booking_ban`.
- **Ciało Odpowiedzi**: Zaktualizowany obiekt rezerwacji ze statusem `CANCELLED`.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.

#### `GET /bookings/:id`

- **Opis**: Pobiera szczegóły pojedynczej rezerwacji.
- **Uwierzytelnianie**: Wymagane. Użytkownik musi być klientem lub trenerem powiązanym z rezerwacją.
- **Ciało Odpowiedzi**: Obiekt rezerwacji.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

### 2.9. Niedostępności

#### `GET /unavailabilities`

- **Opis**: Pobiera listę niedostępności dla uwierzytelnionego trenera. Można filtrować według zakresu dat.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Parametry Zapytania**:
  - `from` (Data ISO8601)
  - `to` (Data ISO8601)
- **Ciało Odpowiedzi**: Tablica obiektów niedostępności.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`

#### `POST /unavailabilities`

- **Opis**: Tworzy nowy blok niedostępności dla trenera.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Żądania**:
  ```json
  {
    "startTime": "2023-12-24T09:00:00Z",
    "endTime": "2023-12-26T17:00:00Z"
  }
  ```
- **Ciało Odpowiedzi**: Nowo utworzony obiekt niedostępności.
- **Sukces**: `201 Created`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict` (Nakłada się na istniejącą rezerwację).

#### `DELETE /unavailabilities/:id`

- **Opis**: Usuwa blok niedostępności.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Sukces**: `204 No Content`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `GET /unavailabilities/:id`

- **Opis**: Pobiera pojedynczy blok niedostępności.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Odpowiedzi**: Obiekt niedostępności.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `PATCH /unavailabilities/:id`

- **Opis**: Aktualizuje blok niedostępności.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Żądania**:
  ```json
  {
    "startTime": "2023-12-24T10:00:00Z",
    "endTime": "2023-12-26T18:00:00Z"
  }
  ```
- **Ciało Odpowiedzi**: Zaktualizowany obiekt niedostępności.
- **Sukces**: `200 OK`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

### 2.10. Blokady Rezerwacji (Booking Bans)

#### `GET /booking-bans`

- **Opis**: Pobiera listę wszystkich blokad rezerwacji (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Parametry Zapytania**: `page`, `limit`.
- **Ciało Odpowiedzi**: Paginowana lista obiektów blokad.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`

#### `POST /booking-bans`

- **Opis**: Tworzy nową blokadę rezerwacji (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Żądania**:
  ```json
  {
    "clientId": "a1b2c3d4-...",
    "trainerId": "b1c2d3e4-...",
    "bannedUntil": "2024-01-01T00:00:00Z"
  }
  ```
- **Ciało Odpowiedzi**: Nowo utworzony obiekt blokady.
- **Sukces**: `201 Created`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

#### `GET /booking-bans/:id`

- **Opis**: Pobiera pojedynczą blokadę (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Odpowiedzi**: Obiekt blokady.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `PATCH /booking-bans/:id`

- **Opis**: Aktualizuje blokadę, np. zmieniając datę `bannedUntil` (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Żądania**:
  ```json
  {
    "bannedUntil": "2024-02-01T00:00:00Z"
  }
  ```
- **Ciało Odpowiedzi**: Zaktualizowany obiekt blokady.
- **Sukces**: `200 OK`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `DELETE /booking-bans/:id`

- **Opis**: Usuwa blokadę (prawdopodobnie dla Administratora).
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Sukces**: `204 No Content`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

### 2.11. Zarządzanie Użytkownikami (Admin)

#### `GET /users`

- **Opis**: Pobiera paginowaną listę wszystkich użytkowników.
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Parametry Zapytania**: `page`, `limit`.
- **Ciało Odpowiedzi**: Paginowana lista obiektów użytkowników.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`

#### `GET /users/:id`

- **Opis**: Pobiera pojedynczego użytkownika.
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Odpowiedzi**: Obiekt użytkownika.
- **Sukces**: `200 OK`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `PATCH /users/:id`

- **Opis**: Aktualizuje użytkownika.
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Ciało Żądania**:
  ```json
  {
    "name": "Nowe Imię",
    "role": "TRAINER"
  }
  ```
- **Ciało Odpowiedzi**: Zaktualizowany obiekt użytkownika.
- **Sukces**: `200 OK`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `DELETE /users/:id`

- **Opis**: Usuwa (miękko) użytkownika.
- **Uwierzytelnianie**: Wymagane (Rola: ADMIN - do zdefiniowania).
- **Sukces**: `204 No Content`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

### 2.12. Zarządzanie Profilami Trenerów (Admin)

**Uwaga:** Endpointy zarządzania profilami trenerów przez ADMIN są wspólne z endpointami w sekcji 2.3 i 2.4, z odpowiednią autoryzacją opartą na rolach.

#### `GET /trainers`

- **Opis**: Pobiera paginowaną listę publicznych profili trenerów (z możliwością filtrowania).
- **Uwierzytelnianie**: Nie wymagane (publiczny endpoint).
- **Parametry Zapytania**: `page`, `limit`, `city`, `specializationId`.
- **Ciało Odpowiedzi**: Paginowana lista publicznych profili.
- **Sukces**: `200 OK`

#### `GET /trainers/:id`

- **Opis**: Pobiera publiczny profil trenera po userId, w tym specjalizacje i usługi.
- **Uwierzytelnianie**: Nie wymagane (publiczny endpoint).
- **Ciało Odpowiedzi**: Pełny publiczny profil trenera.
- **Sukces**: `200 OK`
- **Błąd**: `404 Not Found`

#### `POST /trainers`

- **Opis**: Tworzy nowy profil trenera dla uwierzytelnionego użytkownika TRAINER.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER).
- **Ciało Żądania**:
  ```json
  {
    "description": "Opis profilu.",
    "city": "Miasto",
    "specializationIds": ["s1..."]
  }
  ```
- **Ciało Odpowiedzi**: Nowo utworzony profil.
- **Sukces**: `201 Created`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`

#### `PATCH /trainers/:id`

- **Opis**: Aktualizuje profil trenera. Dostępne dla właściciela (TRAINER) lub ADMIN.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER lub ADMIN).
- **Ciało Żądania**:
  ```json
  {
    "city": "Nowe Miasto",
    "description": "Nowy opis"
  }
  ```
- **Ciało Odpowiedzi**: Zaktualizowany profil.
- **Sukces**: `200 OK`
- **Błąd**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

#### `DELETE /trainers/:id`

- **Opis**: Usuwa profil trenera. Dostępne dla właściciela (TRAINER) lub ADMIN.
- **Uwierzytelnianie**: Wymagane (Rola: TRAINER lub ADMIN).
- **Sukces**: `204 No Content`
- **Błąd**: `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

## 3. Uwierzytelnianie i Autoryzacja

- **Uwierzytelnianie**: API będzie używać tokenów JWT (JSON Web Tokens). Klient otrzyma `accessToken` po pomyślnym zalogowaniu, który musi być wysyłany w nagłówku `Authorization` kolejnych żądań jako token Bearer (`Authorization: Bearer <token>`).
- **Autoryzacja**: Autoryzacja jest oparta na rolach.
  - Punkty końcowe wymagające określonej roli (np. `TRAINER`) będą chronione przez strażnika (guard), który sprawdza pole `role` w payloadzie JWT.
  - W przypadku dostępu na poziomie zasobów (np. trener modyfikujący tylko własne usługi), logika aplikacji zweryfikuje własność, porównując `trainer_id` zasobu z ID uwierzytelnionego użytkownika z JWT. Odzwierciedla to polityki RLS zdefiniowane w schemacie bazy danych.

---

## 4. Walidacja i Logika Biznesowa

- **Walidacja Danych Wejściowych**: Wszystkie przychodzące ciała żądań (`POST`, `PATCH`) będą walidowane przy użyciu pakietów `class-validator` i `class-transformer` z NestJS. Zdefiniowane zostaną DTO (Data Transfer Objects) dla każdego payloadu z dekoratorami odpowiadającymi ograniczeniom schematu bazy danych (`@IsEmail`, `@MinLength`, `@IsUUID`, `@IsNumber` itp.). Zapobiega to dotarciu nieprawidłowych danych do warstwy logiki biznesowej.
- **Implementacja Logiki Biznesowej**:
  - **Wygasanie Rezerwacji**: Zaplanowane zadanie (np. przy użyciu cron job) będzie okresowo uruchamiane w celu wyszukiwania rezerwacji w stanie `PENDING` starszych niż 24 godziny i automatycznej zmiany ich statusu na `REJECTED`.
  - **Kary za Anulowanie**: Endpoint `POST /bookings/:id/cancel` będzie zawierał logikę sprawdzającą, czy żądanie pochodzi od `CLIENT` i czy do `startTime` pozostało mniej niż 12 godzin. Jeśli oba warunki są spełnione, utworzy nowy wpis w tabeli `booking_bans` dla tego klienta i trenera na 7 dni.
  - **Sprawdzanie Dostępności**: Endpointy `POST /bookings` i `POST /unavailabilities` będą przeprowadzać sprawdzanie konfliktów. Przed utworzeniem nowego rekordu, serwis sprawdzi, czy istnieją już zaakceptowane rezerwacje lub niedostępności dla danego trenera, które nakładają się na żądany termin. W przypadku znalezienia konfliktu, zwrócony zostanie błąd `409 Conflict`.
  - **Miękkie Usuwanie (Soft Deletes)**: Endpoint `DELETE /services/:id` wykona miękkie usunięcie, ustawiając znacznik czasu `deleted_at`. Wszystkie zapytania `GET` dotyczące usług będą domyślnie zawierały warunek `WHERE deleted_at IS NULL`.
