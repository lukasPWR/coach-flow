# Schemat Bazy Danych PostgreSQL dla Aplikacji CoachFlow

## 1. Lista Tabel

### Typy ENUM

```sql
CREATE TYPE user_role AS ENUM ('TRAINER', 'CLIENT', 'ADMIN');
CREATE TYPE booking_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
```

### Tabela: `users`

Przechowuje dane uwierzytelniające i podstawowe informacje o użytkownikach.

| Nazwa Kolumny | Typ Danych     | Ograniczenia                               | Opis                                      |
| ------------- | -------------- | ------------------------------------------ | ----------------------------------------- |
| `id`          | `UUID`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator użytkownika.       |
| `name`        | `VARCHAR(255)` | `NOT NULL`                                 | Imię i nazwisko użytkownika.              |
| `email`       | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`                       | Adres e-mail (używany do logowania).      |
| `password`    | `VARCHAR(255)` | `NOT NULL`                                 | Zahaszowane hasło użytkownika.            |
| `role`        | `user_role`    | `NOT NULL`, `DEFAULT 'CLIENT'`             | Rola użytkownika w systemie.              |
| `createdAt`   | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.                  |
| `updatedAt`   | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu.       |
| `deletedAt`   | `TIMESTAMPTZ`  |                                            | Czas usunięcia rekordu (dla soft delete). |

### Tabela: `trainer_profiles`

Przechowuje dodatkowe informacje specyficzne dla trenerów.

| Nazwa Kolumny       | Typ Danych     | Ograniczenia                               | Opis                                |
| ------------------- | -------------- | ------------------------------------------ | ----------------------------------- |
| `id`                | `UUID`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator profilu.     |
| `userId`            | `UUID`         | `NOT NULL`, `UNIQUE`, `FK to users(id)`    | Klucz obcy do tabeli `users`.       |
| `description`       | `TEXT`         |                                            | Opis trenera.                       |
| `city`              | `VARCHAR(255)` |                                            | Miasto, w którym działa trener.     |
| `profilePictureUrl` | `VARCHAR(500)` |                                            | URL do zdjęcia profilowego.         |
| `createdAt`         | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.            |
| `updatedAt`         | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu. |

### Tabela: `specializations`

Tabela słownikowa dla specjalizacji trenerów.

| Nazwa Kolumny | Typ Danych     | Ograniczenia                               | Opis                                  |
| ------------- | -------------- | ------------------------------------------ | ------------------------------------- |
| `id`          | `UUID`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator specjalizacji. |
| `name`        | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`                       | Nazwa specjalizacji.                  |

### Tabela: `trainer_specializations`

Tabela łącząca dla relacji N:M między `trainer_profiles` a `specializations`.

| Nazwa Kolumny      | Typ Danych | Ograniczenia                                        | Opis                           |
| ------------------ | ---------- | --------------------------------------------------- | ------------------------------ |
| `trainerId`        | `UUID`     | `NOT NULL`, `FK to trainer_profiles(id)`            | Klucz obcy do profilu trenera. |
| `specializationId` | `UUID`     | `NOT NULL`, `FK to specializations(id)`             | Klucz obcy do specjalizacji.   |
|                    |            | `PRIMARY KEY (trainerId, specializationId)`         | Klucz główny złożony.          |

### Tabela: `service_types`

Tabela słownikowa dla typów usług.

| Nazwa Kolumny | Typ Danych | Ograniczenia                               | Opis                         |
| ------------- | ---------- | ------------------------------------------ | ---------------------------- |
| `id`          | `UUID`     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator typu. |
| `name`        | `VARCHAR(255)` | `UNIQUE`                               | Nazwa typu usługi.           |

### Tabela: `services`

Przechowuje informacje o usługach oferowanych przez trenerów.

| Nazwa Kolumny     | Typ Danych       | Ograniczenia                                             | Opis                                  |
| ----------------- | ---------------- | -------------------------------------------------------- | ------------------------------------- |
| `id`              | `UUID`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`               | Unikalny identyfikator usługi.        |
| `trainerId`       | `UUID`           | `NOT NULL`, `FK to users(id)`                            | Klucz obcy do trenera (`users`).      |
| `serviceTypeId`   | `UUID`           | `NOT NULL`, `FK to service_types(id)`                    | Klucz obcy do typu usługi.            |
| `price`           | `DECIMAL(10, 2)` | `NOT NULL`, `CHECK (price >= 0)`                         | Cena usługi.                          |
| `durationMinutes` | `INTEGER`        | `NOT NULL`, `CHECK (durationMinutes > 0)`                | Czas trwania usługi w minutach.       |
| `createdAt`       | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                              | Czas utworzenia rekordu.              |
| `updatedAt`       | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                              | Czas ostatniej modyfikacji rekordu.   |
| `deletedAt`       | `TIMESTAMPTZ`    |                                                          | Czas usunięcia rekordu (soft delete). |

### Tabela: `bookings`

Główna tabela transakcyjna przechowująca informacje o rezerwacjach.

| Nazwa Kolumny    | Typ Danych       | Ograniczenia                               | Opis                                |
| ---------------- | ---------------- | ------------------------------------------ | ----------------------------------- |
| `id`             | `UUID`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator rezerwacji.  |
| `clientId`       | `UUID`           | `NOT NULL`, `FK to users(id)`              | Klucz obcy do klienta (`users`).    |
| `trainerId`      | `UUID`           | `NOT NULL`, `FK to users(id)`              | Klucz obcy do trenera (`users`).    |
| `serviceId`      | `UUID`           | `NOT NULL`, `FK to services(id)`           | Klucz obcy do usługi.               |
| `startTime`      | `TIMESTAMPTZ`    | `NOT NULL`                                 | Czas rozpoczęcia rezerwacji.        |
| `endTime`        | `TIMESTAMPTZ`    | `NOT NULL`                                 | Czas zakończenia rezerwacji.        |
| `status`         | `booking_status` | `NOT NULL`, `DEFAULT 'PENDING'`            | Status rezerwacji.                  |
| `reminderSentAt` | `TIMESTAMPTZ`    |                                            | Czas wysłania przypomnienia.        |
| `createdAt`      | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.            |
| `updatedAt`      | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu. |

### Tabela: `unavailabilities`

Przechowuje bloki niedostępności zdefiniowane przez trenerów.

| Nazwa Kolumny | Typ Danych    | Ograniczenia                               | Opis                                   |
| ------------- | ------------- | ------------------------------------------ | -------------------------------------- |
| `id`          | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator niedostępności. |
| `trainerId`   | `UUID`        | `NOT NULL`, `FK to users(id)`              | Klucz obcy do trenera (`users`).       |
| `startTime`   | `TIMESTAMPTZ` | `NOT NULL`                                 | Czas rozpoczęcia niedostępności.       |
| `endTime`     | `TIMESTAMPTZ` | `NOT NULL`                                 | Czas zakończenia niedostępności.       |
| `createdAt`   | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.               |
| `updatedAt`   | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu.    |

### Tabela: `booking_bans`

Przechowuje informacje o blokadach rezerwacji dla klientów.

| Nazwa Kolumny | Typ Danych    | Ograniczenia                               | Opis                                 |
| ------------- | ------------- | ------------------------------------------ | ------------------------------------ |
| `id`          | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator blokady.      |
| `clientId`    | `UUID`        | `NOT NULL`, `FK to users(id)`              | Klucz obcy do klienta (`users`).     |
| `trainerId`   | `UUID`        | `NOT NULL`, `FK to users(id)`              | Klucz obcy do trenera (`users`).     |
| `bannedUntil` | `TIMESTAMPTZ` | `NOT NULL`                                 | Czas, do którego obowiązuje blokada. |
| `createdAt`   | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.             |
| `updatedAt`   | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu.  |

### Tabela: `refresh_tokens`

Przechowuje tokeny odświeżające sesje użytkowników.

| Nazwa Kolumny | Typ Danych     | Ograniczenia                               | Opis                            |
| ------------- | -------------- | ------------------------------------------ | ------------------------------- |
| `id`          | `UUID`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator tokenu.  |
| `userId`      | `UUID`         | `NOT NULL`, `FK to users(id)`              | Klucz obcy do użytkownika.      |
| `token`       | `TEXT`         | `NOT NULL`                                 | Token odświeżający.             |
| `expiresAt`   | `TIMESTAMP`    | `NOT NULL`                                 | Czas wygaśnięcia tokenu.        |

### Tabela: `password_reset_tokens`

Przechowuje tokeny do resetowania hasła.

| Nazwa Kolumny | Typ Danych     | Ograniczenia                               | Opis                                 |
| ------------- | -------------- | ------------------------------------------ | ------------------------------------ |
| `id`          | `UUID`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator tokenu.       |
| `userId`      | `UUID`         | `NOT NULL`, `FK to users(id)`              | Klucz obcy do użytkownika.           |
| `token`       | `TEXT`         | `NOT NULL`, `UNIQUE`                       | Token resetowania hasła.             |
| `expiresAt`   | `TIMESTAMP`    | `NOT NULL`                                 | Czas wygaśnięcia tokenu.             |

## 2. Relacje Między Tabelami

- **`users` 1-do-1 `trainer_profiles`**: Każdy profil trenera jest powiązany z dokładnie jednym użytkownikiem.
- **`users` 1-do-N `refresh_tokens`**: Użytkownik może mieć wiele aktywnych tokenów odświeżających.
- **`users` 1-do-N `password_reset_tokens`**: Użytkownik może mieć wiele tokenów do resetowania hasła.
- **`users` (jako trener) 1-do-N `services`**: Trener może oferować wiele usług.
- **`users` (jako trener) 1-do-N `unavailabilities`**: Trener może mieć wiele bloków niedostępności.
- **`service_types` 1-do-N `services`**: Każda usługa musi mieć jeden, predefiniowany typ.
- **`trainer_profiles` N-do-M `specializations`** (przez `trainer_specializations`): Trener może mieć wiele specjalizacji, a specjalizacja może być przypisana do wielu trenerów.
- **`bookings`**: Tabela łączy się z trzema innymi tabelami:
  - N-do-1 z `users` (jako klient).
  - N-do-1 z `users` (jako trener).
  - N-do-1 z `services`.
- **`booking_bans`**: Tabela łączy się z dwiema rolami z tabeli `users`:
  - N-do-1 z `users` (jako klient).
  - N-do-1 z `users` (jako trener).

## 3. Indeksy

W celu optymalizacji wydajności zapytań, utworzono następujące indeksy:

```sql
-- Tabela `users`
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tabela `trainer_profiles`
CREATE INDEX idx_trainer_profiles_user_id ON trainer_profiles("userId");

-- Tabela `services`
CREATE INDEX idx_services_trainer_id ON services("trainerId");
CREATE INDEX idx_services_service_type_id ON services("serviceTypeId");

-- Tabela `bookings`
CREATE INDEX idx_bookings_client_id ON bookings("clientId");
CREATE INDEX idx_bookings_trainer_id ON bookings("trainerId");
CREATE INDEX idx_bookings_start_time ON bookings("startTime");

-- Tabela `unavailabilities`
CREATE INDEX idx_unavailabilities_trainer_id_start_time ON unavailabilities("trainerId", "startTime");

-- Tabela `booking_bans`
CREATE INDEX idx_booking_bans_client_trainer ON booking_bans("clientId", "trainerId");
```

## 4. Zasady PostgreSQL (Row-Level Security)

RLS może zostać włączone dla kluczowych tabel, aby zapewnić bezpieczeństwo na poziomie bazy danych (uwaga: w TypeORM logika autoryzacji jest często w warstwie aplikacji).

```sql
-- Przykładowe polityki RLS (wymagają dostosowania do mechanizmu auth)

-- Polityki dla `trainer_profiles`
-- USING ("userId" = auth.uid())

-- Polityki dla `services`
-- USING ("trainerId" = auth.uid())

-- Polityki dla `bookings`
-- USING ("clientId" = auth.uid() OR "trainerId" = auth.uid())

-- Polityki dla `unavailabilities`
-- USING ("trainerId" = auth.uid())
```

## 5. Dodatkowe Uwagi

1.  **UUID**: Klucze główne są typu `UUID` (generowane przez `gen_random_uuid()`).
2.  **Naming Convention**: Nazwy kolumn w bazie danych są w formacie `camelCase`, co odpowiada właściwościom encji w TypeORM (np. `createdAt`, `userId`).
3.  **TIMESTAMPTZ**: Większość kolumn czasowych używa `TIMESTAMP WITH TIME ZONE`.
4.  **Soft Deletes**: Tabele `users` i `services` posiadają kolumnę `deletedAt`.
5.  **Walidacja**: Logika walidacji (np. nakładanie terminów) znajduje się w warstwie aplikacji.
