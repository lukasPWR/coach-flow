# Schemat Bazy Danych PostgreSQL dla Aplikacji CoachFlow

## 1. Lista Tabel

### Typy ENUM

```sql
CREATE TYPE user_role AS ENUM ('TRAINER', 'CLIENT', 'ADMIN');
CREATE TYPE booking_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
```

### Tabela: `users`

Przechowuje dane uwierzytelniające i podstawowe informacje o użytkownikach.

| Nazwa Kolumny   | Typ Danych     | Ograniczenia                               | Opis                                      |
| --------------- | -------------- | ------------------------------------------ | ----------------------------------------- |
| `id`            | `UUID`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator użytkownika.       |
| `name`          | `VARCHAR(255)` | `NOT NULL`                                 | Imię i nazwisko użytkownika.              |
| `email`         | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`                       | Adres e-mail (używany do logowania).      |
| `password_hash` | `VARCHAR(255)` | `NOT NULL`                                 | Zahaszowane hasło użytkownika.            |
| `role`          | `user_role`    | `NOT NULL`, `DEFAULT 'CLIENT'`             | Rola użytkownika w systemie.              |
| `created_at`    | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.                  |
| `updated_at`    | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu.       |
| `deleted_at`    | `TIMESTAMPTZ`  |                                            | Czas usunięcia rekordu (dla soft delete). |

### Tabela: `trainer_profiles`

Przechowuje dodatkowe informacje specyficzne dla trenerów.

| Nazwa Kolumny         | Typ Danych     | Ograniczenia                               | Opis                                |
| --------------------- | -------------- | ------------------------------------------ | ----------------------------------- |
| `id`                  | `UUID`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator profilu.     |
| `user_id`             | `UUID`         | `NOT NULL`, `UNIQUE`, `FK to users(id)`    | Klucz obcy do tabeli `users`.       |
| `description`         | `TEXT`         |                                            | Opis trenera.                       |
| `city`                | `VARCHAR(255)` |                                            | Miasto, w którym działa trener.     |
| `profile_picture_url` | `VARCHAR(255)` |                                            | URL do zdjęcia profilowego.         |
| `created_at`          | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.            |
| `updated_at`          | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu. |

### Tabela: `specializations`

Tabela słownikowa dla specjalizacji trenerów.

| Nazwa Kolumny | Typ Danych     | Ograniczenia                               | Opis                                  |
| ------------- | -------------- | ------------------------------------------ | ------------------------------------- |
| `id`          | `UUID`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator specjalizacji. |
| `name`        | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`                       | Nazwa specjalizacji.                  |

### Tabela: `trainer_specializations`

Tabela łącząca dla relacji N:M między `trainer_profiles` a `specializations`.

| Nazwa Kolumny        | Typ Danych | Ograniczenia                                          | Opis                           |
| -------------------- | ---------- | ----------------------------------------------------- | ------------------------------ |
| `trainer_profile_id` | `UUID`     | `NOT NULL`, `FK to trainer_profiles(id)`              | Klucz obcy do profilu trenera. |
| `specialization_id`  | `UUID`     | `NOT NULL`, `FK to specializations(id)`               | Klucz obcy do specjalizacji.   |
|                      |            | `PRIMARY KEY (trainer_profile_id, specialization_id)` | Klucz główny złożony.          |

### Tabela: `service_types`

Tabela słownikowa dla typów usług.

| Nazwa Kolumny | Typ Danych | Ograniczenia                               | Opis                         |
| ------------- | ---------- | ------------------------------------------ | ---------------------------- |
| `id`          | `UUID`     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator typu. |

### Tabela: `services`

Przechowuje informacje o usługach oferowanych przez trenerów.

| Nazwa Kolumny      | Typ Danych       | Ograniczenia                                             | Opis                                  |
| ------------------ | ---------------- | -------------------------------------------------------- | ------------------------------------- |
| `id`               | `UUID`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`               | Unikalny identyfikator usługi.        |
| `trainer_id`       | `UUID`           | `NOT NULL`, `FK to users(id)`                            | Klucz obcy do trenera (`users`).      |
| `service_type_id`  | `UUID`           | `NOT NULL`, `FK to service_types(id)`                    | Klucz obcy do typu usługi.            |
| `price`            | `DECIMAL(10, 2)` | `NOT NULL`, `CHECK (price >= 0)`                         | Cena usługi.                          |
| `duration_minutes` | `INTEGER`        | `NOT NULL`, `DEFAULT 60`, `CHECK (duration_minutes > 0)` | Czas trwania usługi w minutach.       |
| `created_at`       | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                              | Czas utworzenia rekordu.              |
| `updated_at`       | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                              | Czas ostatniej modyfikacji rekordu.   |
| `deleted_at`       | `TIMESTAMPTZ`    |                                                          | Czas usunięcia rekordu (soft delete). |

### Tabela: `bookings`

Główna tabela transakcyjna przechowująca informacje o rezerwacjach.

| Nazwa Kolumny      | Typ Danych       | Ograniczenia                               | Opis                                |
| ------------------ | ---------------- | ------------------------------------------ | ----------------------------------- |
| `id`               | `UUID`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator rezerwacji.  |
| `client_id`        | `UUID`           | `NOT NULL`, `FK to users(id)`              | Klucz obcy do klienta (`users`).    |
| `trainer_id`       | `UUID`           | `NOT NULL`, `FK to users(id)`              | Klucz obcy do trenera (`users`).    |
| `service_id`       | `UUID`           | `NOT NULL`, `FK to services(id)`           | Klucz obcy do usługi.               |
| `start_time`       | `TIMESTAMPTZ`    | `NOT NULL`                                 | Czas rozpoczęcia rezerwacji.        |
| `end_time`         | `TIMESTAMPTZ`    | `NOT NULL`                                 | Czas zakończenia rezerwacji.        |
| `status`           | `booking_status` | `NOT NULL`, `DEFAULT 'PENDING'`            | Status rezerwacji.                  |
| `reminder_sent_at` | `TIMESTAMPTZ`    |                                            | Czas wysłania przypomnienia.        |
| `created_at`       | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.            |
| `updated_at`       | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu. |

### Tabela: `unavailabilities`

Przechowuje bloki niedostępności zdefiniowane przez trenerów.

| Nazwa Kolumny | Typ Danych    | Ograniczenia                               | Opis                                   |
| ------------- | ------------- | ------------------------------------------ | -------------------------------------- |
| `id`          | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator niedostępności. |
| `trainer_id`  | `UUID`        | `NOT NULL`, `FK to users(id)`              | Klucz obcy do trenera (`users`).       |
| `start_time`  | `TIMESTAMPTZ` | `NOT NULL`                                 | Czas rozpoczęcia niedostępności.       |
| `end_time`    | `TIMESTAMPTZ` | `NOT NULL`                                 | Czas zakończenia niedostępności.       |
| `created_at`  | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.               |
| `updated_at`  | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu.    |

### Tabela: `booking_bans`

Przechowuje informacje o blokadach rezerwacji dla klientów.

| Nazwa Kolumny  | Typ Danych    | Ograniczenia                               | Opis                                 |
| -------------- | ------------- | ------------------------------------------ | ------------------------------------ |
| `id`           | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator blokady.      |
| `client_id`    | `UUID`        | `NOT NULL`, `FK to users(id)`              | Klucz obcy do klienta (`users`).     |
| `trainer_id`   | `UUID`        | `NOT NULL`, `FK to users(id)`              | Klucz obcy do trenera (`users`).     |
| `banned_until` | `TIMESTAMPTZ` | `NOT NULL`                                 | Czas, do którego obowiązuje blokada. |
| `created_at`   | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                | Czas utworzenia rekordu.             |
| `updated_at`   | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                | Czas ostatniej modyfikacji rekordu.  |

## 2. Relacje Między Tabelami

- **`users` 1-do-1 `trainer_profiles`**: Każdy profil trenera jest powiązany z dokładnie jednym użytkownikiem.
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

W celu optymalizacji wydajności zapytań, zaleca się utworzenie następujących indeksów:

```sql
-- Tabela `users`
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tabela `trainer_profiles`
CREATE INDEX idx_trainer_profiles_user_id ON trainer_profiles(user_id);

-- Tabela `services`
CREATE INDEX idx_services_trainer_id ON services(trainer_id);
CREATE INDEX idx_services_service_type_id ON services(service_type_id);

-- Tabela `bookings`
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_trainer_id ON bookings(trainer_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);

-- Tabela `unavailabilities`
CREATE INDEX idx_unavailabilities_trainer_id_start_time ON unavailabilities(trainer_id, start_time);

-- Tabela `booking_bans`
CREATE INDEX idx_booking_bans_client_trainer ON booking_bans(client_id, trainer_id);
```

## 4. Zasady PostgreSQL (Row-Level Security)

RLS zostanie włączone dla kluczowych tabel, aby zapewnić, że użytkownicy mają dostęp wyłącznie do swoich danych.

```sql
-- Umożliwia odczytanie UID z bieżącej sesji
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Włączenie RLS dla tabel
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailabilities ENABLE ROW LEVEL SECURITY;

-- Polityki dla `trainer_profiles`
CREATE POLICY "Użytkownicy mogą zarządzać własnym profilem trenera" ON trainer_profiles
  FOR ALL USING (user_id = auth.uid());

-- Polityki dla `services`
CREATE POLICY "Trenerzy mogą zarządzać swoimi usługami" ON services
  FOR ALL USING (trainer_id = auth.uid());
CREATE POLICY "Wszyscy użytkownicy mogą przeglądać usługi" ON services
  FOR SELECT USING (true);

-- Polityki dla `bookings`
CREATE POLICY "Użytkownicy mogą zarządzać swoimi rezerwacjami" ON bookings
  FOR ALL USING (client_id = auth.uid() OR trainer_id = auth.uid());

-- Polityki dla `unavailabilities`
CREATE POLICY "Trenerzy mogą zarządzać swoją niedostępnością" ON unavailabilities
  FOR ALL USING (trainer_id = auth.uid());
```

## 5. Dodatkowe Uwagi

1.  **UUID jako klucze główne**: Zgodnie z decyzją, wszystkie klucze główne są typu `UUID`. Wymaga to włączenia rozszerzenia `pgcrypto` (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`) lub użycia `gen_random_uuid()` (PostgreSQL 13+).
2.  **TIMESTAMPTZ**: Wszystkie kolumny przechowujące czas używają typu `TIMESTAMPTZ` (timestamp with time zone), co jest najlepszą praktyką dla aplikacji obsługujących użytkowników z różnych stref czasowych.
3.  **Soft Deletes**: Tabele `users` i `services` posiadają kolumnę `deleted_at`. Logika aplikacji powinna domyślnie filtrować rekordy, gdzie `deleted_at IS NOT NULL`.
4.  **Seeding**: Tabele słownikowe `service_types` i `specializations` powinny zostać wstępnie wypełnione danymi (seeding) podczas inicjalizacji aplikacji.
5.  **Walidacja nakładających się terminów**: Logika zapobiegająca tworzeniu nakładających się rezerwacji i niedostępności powinna być zaimplementowana w warstwie aplikacji lub za pomocą triggerów bazodanowych z ograniczeniami `EXCLUDE`. Dla MVP logika w aplikacji jest wystarczająca.
