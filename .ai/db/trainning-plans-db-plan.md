# Schemat Bazy Danych Modułu Planów Treningowych - CoachFlow

## 1. Lista Tabel

### Typy ENUM

```sql
-- Kategorie partii mięśniowych (15 zdefiniowanych typów)
CREATE TYPE muscle_group_type AS ENUM (
    'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 
    'QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CORE', 
    'FOREARMS', 'TRAPS', 'ADDUCTORS', 'ABDUCTORS', 'FULL_BODY'
);

-- Status planu treningowego
CREATE TYPE plan_status AS ENUM ('ACTIVE', 'ARCHIVED');
```

### Tabela: `exercises`

Centralna baza ćwiczeń zawierająca zarówno ćwiczenia systemowe (seed data), jak i własne ćwiczenia trenerów.

| Nazwa Kolumny | Typ Danych | Ograniczenia | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator ćwiczenia. |
| `trainerId` | `UUID` | `NULLABLE`, `FK to users(id)` | ID trenera (właściciela). NULL dla ćwiczeń systemowych. |
| `name` | `VARCHAR(255)` | `NOT NULL` | Nazwa ćwiczenia. |
| `muscleGroup` | `muscle_group_type` | `NOT NULL` | Główna partia mięśniowa. |
| `isSystem` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Flaga określająca, czy to ćwiczenie systemowe. |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Data utworzenia. |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Data ostatniej modyfikacji. |
| `deletedAt` | `TIMESTAMPTZ` | `NULLABLE` | Data usunięcia (Soft Delete). |

### Tabela: `training_plans`

Nagłówek planu treningowego, łączący trenera z klientem i definiujący metadane planu.

| Nazwa Kolumny | Typ Danych | Ograniczenia | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator planu. |
| `trainerId` | `UUID` | `NOT NULL`, `FK to users(id)` | ID trenera tworzącego plan. |
| `clientId` | `UUID` | `NOT NULL`, `FK to users(id)` | ID klienta, dla którego plan jest przeznaczony. |
| `name` | `VARCHAR(255)` | `NOT NULL` | Nazwa planu (np. "Siła styczeń 2026"). |
| `description` | `TEXT` | `NULLABLE` | Opcjonalny opis lub uwagi ogólne do planu. |
| `status` | `plan_status` | `NOT NULL`, `DEFAULT 'ACTIVE'` | Status planu (Aktywny/Zarchiwizowany). |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Data utworzenia. |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Data ostatniej modyfikacji. |

### Tabela: `training_units`

Reprezentuje pojedynczą jednostkę treningową w planie (np. "Dzień A", "Trening Nóg").

| Nazwa Kolumny | Typ Danych | Ograniczenia | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator jednostki. |
| `trainingPlanId` | `UUID` | `NOT NULL`, `FK to training_plans(id)` | Powiązanie z planem głównym. |
| `name` | `VARCHAR(255)` | `NOT NULL` | Nazwa jednostki (np. "Push", "Dzień 1"). |
| `sortOrder` | `INTEGER` | `NOT NULL`, `DEFAULT 0` | Kolejność wyświetlania jednostki w planie. |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Data utworzenia. |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Data ostatniej modyfikacji. |

### Tabela: `plan_exercises`

Konkretne wystąpienie ćwiczenia w jednostce treningowej wraz z parametrami (serie, powtórzenia itp.).

| Nazwa Kolumny | Typ Danych | Ograniczenia | Opis |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unikalny identyfikator pozycji w planie. |
| `trainingUnitId` | `UUID` | `NOT NULL`, `FK to training_units(id)` | Powiązanie z jednostką treningową. |
| `exerciseId` | `UUID` | `NOT NULL`, `FK to exercises(id)` | Powiązanie z definicją ćwiczenia. |
| `sets` | `VARCHAR(50)` | `NULLABLE` | Liczba serii (tekst, np. "4", "3-4"). |
| `reps` | `VARCHAR(50)` | `NULLABLE` | Liczba powtórzeń (tekst, np. "8-12"). |
| `weight` | `VARCHAR(50)` | `NULLABLE` | Ciężar lub RPE (tekst). |
| `tempo` | `VARCHAR(50)` | `NULLABLE` | Tempo wykonania (np. "3010"). |
| `rest` | `VARCHAR(50)` | `NULLABLE` | Czas przerwy (np. "90s"). |
| `notes` | `TEXT` | `NULLABLE` | Dodatkowe uwagi dla klienta. |
| `sortOrder` | `INTEGER` | `NOT NULL`, `DEFAULT 0` | Kolejność ćwiczenia w jednostce. |
| `isCompleted` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Status wykonania (checkbox klienta). |
| `createdAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Data utworzenia. |
| `updatedAt` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()` | Data ostatniej modyfikacji. |

## 2. Relacje Między Tabelami

- **`exercises`**:
    - Relacja `Many-to-One` z `users` (jako `trainerId`). Ćwiczenia systemowe mają `trainerId = NULL`.
- **`training_plans`**:
    - Relacja `Many-to-One` z `users` (jako `trainerId` - twórca).
    - Relacja `Many-to-One` z `users` (jako `clientId` - odbiorca).
    - Relacja `One-to-Many` z `training_units`.
- **`training_units`**:
    - Relacja `Many-to-One` z `training_plans`.
    - Relacja `One-to-Many` z `plan_exercises`.
- **`plan_exercises`**:
    - Relacja `Many-to-One` z `training_units`.
    - Relacja `Many-to-One` z `exercises`.
    - **UWAGA**: Relacja z `exercises` nie posiada `ON DELETE CASCADE`. Jeśli ćwiczenie z bazy `exercises` zostanie usunięte (soft delete), rekordy w `plan_exercises` pozostają nienaruszone, a aplikacja powinna obsługiwać wyświetlanie nazwy ćwiczenia (np. z dołączonego snapshota lub pobierając nawet soft-deleted rekord).

## 3. Indeksy

W celu optymalizacji wydajności, zdefiniowano następujące indeksy:

```sql
-- Tabela `exercises`
-- Szybkie filtrowanie ćwiczeń trenera (Partial Index)
CREATE INDEX idx_exercises_trainer_id ON exercises("trainerId") WHERE "trainerId" IS NOT NULL;
-- Filtrowanie ćwiczeń systemowych
CREATE INDEX idx_exercises_is_system ON exercises("isSystem") WHERE "isSystem" = true;
-- Filtrowanie po grupie mięśniowej (częste w UI)
CREATE INDEX idx_exercises_muscle_group ON exercises("muscleGroup");
-- Wyszukiwanie po nazwie
CREATE INDEX idx_exercises_name_trgm ON exercises USING GIN ("name" gin_trgm_ops); -- Wymaga rozszerzenia pg_trgm

-- Tabela `training_plans`
CREATE INDEX idx_training_plans_trainer_id ON training_plans("trainerId");
CREATE INDEX idx_training_plans_client_id ON training_plans("clientId");
CREATE INDEX idx_training_plans_status ON training_plans("status");

-- Tabela `training_units`
CREATE INDEX idx_training_units_plan_id ON training_units("trainingPlanId");

-- Tabela `plan_exercises`
CREATE INDEX idx_plan_exercises_unit_id ON plan_exercises("trainingUnitId");
```

## 4. Zasady PostgreSQL (Row-Level Security)

Zgodnie z wymaganiami bezpieczeństwa, dostęp do danych jest ściśle kontrolowany na poziomie bazy danych.

```sql
-- Włączenie RLS na tabelach
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;

-- 1. Polityki dla `exercises`
-- Trener widzi systemowe (publiczne) oraz własne
CREATE POLICY exercises_select_policy ON exercises FOR SELECT
    USING ("isSystem" = true OR "trainerId" = auth.uid());

-- Trener może zarządzać tylko własnymi ćwiczeniami
CREATE POLICY exercises_modification_policy ON exercises FOR ALL
    USING ("trainerId" = auth.uid());

-- 2. Polityki dla `training_plans`
-- Trener ma pełny dostęp do swoich planów (tych, które stworzył)
CREATE POLICY plans_trainer_full_access ON training_plans FOR ALL
    USING ("trainerId" = auth.uid());

-- Klient ma dostęp do odczytu planów przypisanych do niego
CREATE POLICY plans_client_read_access ON training_plans FOR SELECT
    USING ("clientId" = auth.uid());

-- 3. Polityki dla `plan_exercises` (Specyficzne uprawnienia)
-- Trener: Pełny dostęp (przez kaskadę własności planu)
CREATE POLICY plan_exercises_trainer_all ON plan_exercises FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM training_units tu
            JOIN training_plans tp ON tu."trainingPlanId" = tp.id
            WHERE tu.id = plan_exercises."trainingUnitId" AND tp."trainerId" = auth.uid()
        )
    );

-- Klient: SELECT (widzi swoje ćwiczenia)
CREATE POLICY plan_exercises_client_select ON plan_exercises FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM training_units tu
            JOIN training_plans tp ON tu."trainingPlanId" = tp.id
            WHERE tu.id = plan_exercises."trainingUnitId" AND tp."clientId" = auth.uid()
        )
    );

-- Klient: UPDATE (może zmieniać TYLKO `isCompleted`)
-- Uwaga: W czystym SQL RLS sprawdza wiersz, kolumny ogranicza się w GRANT.
-- Tutaj RLS pozwala na update jeśli to plan klienta.
CREATE POLICY plan_exercises_client_update ON plan_exercises FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM training_units tu
            JOIN training_plans tp ON tu."trainingPlanId" = tp.id
            WHERE tu.id = plan_exercises."trainingUnitId" AND tp."clientId" = auth.uid()
        )
    )
    WITH CHECK (
        -- Opcjonalnie: Zabezpieczenie, by klient nie mógł zmienić nic poza swoim planem
        EXISTS (
            SELECT 1 FROM training_units tu
            JOIN training_plans tp ON tu."trainingPlanId" = tp.id
            WHERE tu.id = plan_exercises."trainingUnitId" AND tp."clientId" = auth.uid()
        )
    );
```

## 5. Dodatkowe Uwagi Projektowe

1.  **Parametry jako Tekst**: Zdecydowano się na typy `VARCHAR` dla parametrów treningowych (`sets`, `reps`, etc.) zamiast typów liczbowych. Pozwala to na elastyczność wymaganą przez trenerów, np. wpisanie zakresu "8-12" lub "RPE 8". W przyszłości, przy potrzebie analityki, można dodać kolumny znormalizowane lub parsujące te wartości.
2.  **Sortowanie**: Kolumna `sortOrder` (INTEGER) jest kluczowa dla UX, aby trener mógł układać ćwiczenia w logicznej kolejności. Aplikacja musi dbać o przeliczanie/aktualizację tych wartości przy zmianie kolejności (drag & drop).
3.  **Soft Delete a Historia**: Relacja `plan_exercises` -> `exercises` jest "luźna" w kontekście usuwania. Usunięcie definicji ćwiczenia (ustawienie `deletedAt`) nie wpływa na istniejące plany. TypeORM powinien być skonfigurowany tak, aby przy pobieraniu planu dołączać również ćwiczenia z `deletedAt IS NOT NULL`.
4.  **Live Plan**: Stan `isCompleted` jest przechowywany bezpośrednio w definicji planu (`plan_exercises`). To upraszcza model MVP (brak osobnej tabeli `workout_logs`), ale oznacza, że plan jest "jednorazowy" lub cykliczny w sensie "odznacz i wyczyść". W MVP klient "pracuje na planie".
5.  **Nazewnictwo**: Zachowano konwencję `camelCase` dla kolumn, zgodną z resztą systemu i TypeORM.
