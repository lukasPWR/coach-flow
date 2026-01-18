# Podsumowanie Wygenerowanych Typów - Training Plans Module

Data wygenerowania: 2026-01-18

## Przegląd

Dokument ten zawiera podsumowanie wszystkich wygenerowanych DTOs (Data Transfer Objects), interfejsów i enumów dla modułu planów treningowych aplikacji CoachFlow. Typy zostały wygenerowane na podstawie planów modułów i API zawartych w dokumentach:

- `.ai/modules/training-plans-module-plan.md`
- `.ai/training-plans-api-plan.md`

---

## 1. Exercises Module

### Lokalizacja

`backend/src/exercises/`

### Wygenerowane Pliki

#### Enums (`enums/`)

##### `muscle-group-type.enum.ts`

**Typ:** Enum

**Wartości:**

- `CHEST = 'CHEST'` - Klatka piersiowa
- `BACK = 'BACK'` - Plecy
- `SHOULDERS = 'SHOULDERS'` - Barki
- `BICEPS = 'BICEPS'` - Biceps
- `TRICEPS = 'TRICEPS'` - Triceps
- `LEGS = 'LEGS'` - Nogi
- `CORE = 'CORE'` - Brzuch
- `GLUTES = 'GLUTES'` - Pośladki
- `FOREARMS = 'FOREARMS'` - Przedramiona
- `CARDIO = 'CARDIO'` - Cardio
- `FULL_BODY = 'FULL_BODY'` - Całe ciało

#### DTOs (`dto/`)

##### `create-exercise.dto.ts`

**Przeznaczenie:** Tworzenie nowego ćwiczenia w bibliotece trenera

**Pola:**

- `name: string` - Nazwa ćwiczenia (wymagane, max 255 znaków)
- `muscleGroup: MuscleGroupType` - Docelowa partia mięśniowa (enum)

**Dekoratory walidacji:**

- `@IsString()`, `@IsNotEmpty()`, `@MaxLength(255)` dla `name`
- `@IsEnum(MuscleGroupType)` dla `muscleGroup`

##### `update-exercise.dto.ts`

**Przeznaczenie:** Aktualizacja danych ćwiczenia

**Implementacja:** `extends PartialType(CreateExerciseDto)`

**Pola:** (wszystkie opcjonalne)

- `name?: string`
- `muscleGroup?: MuscleGroupType`

##### `exercise-query.dto.ts`

**Przeznaczenie:** Parametry zapytania do filtrowania listy ćwiczeń

**Pola:** (wszystkie opcjonalne)

- `search?: string` - Wyszukiwanie po nazwie (partial match)
- `muscleGroup?: MuscleGroupType` - Filtrowanie po partii mięśniowej

**Dekoratory walidacji:**

- `@IsOptional()`, `@IsString()` dla `search`
- `@IsOptional()`, `@IsEnum(MuscleGroupType)` dla `muscleGroup`

##### `exercise-response.dto.ts`

**Przeznaczenie:** Reprezentacja ćwiczenia w odpowiedziach API

**Pola:**

- `id: string` - UUID ćwiczenia
- `trainerId: string | null` - UUID trenera (null dla ćwiczeń systemowych)
- `name: string` - Nazwa ćwiczenia
- `muscleGroup: MuscleGroupType` - Partia mięśniowa
- `isSystem: boolean` - Czy ćwiczenie systemowe
- `createdAt: Date` - Data utworzenia
- `updatedAt: Date` - Data ostatniej aktualizacji

**Dekoratory:** `@Expose()` dla wszystkich pól (class-transformer)

#### Interfaces (`interfaces/`)

##### `exercise-filters.interface.ts`

**Przeznaczenie:** Interfejs filtrów dla serwisu ćwiczeń

**Pola:**

- `search?: string`
- `muscleGroup?: MuscleGroupType`

---

## 2. Training Plans Module

### Lokalizacja

`backend/src/training-plans/`

### Wygenerowane Pliki

#### Enums (`enums/`)

##### `plan-status.enum.ts`

**Typ:** Enum

**Wartości:**

- `ACTIVE = 'ACTIVE'` - Plan aktywny
- `ARCHIVED = 'ARCHIVED'` - Plan zarchiwizowany

#### DTOs (`dto/`)

##### `create-training-plan.dto.ts`

**Przeznaczenie:** Tworzenie nowego planu treningowego

**Uwaga:** `trainerId` jest automatycznie pobierany z JWT tokenu uwierzytelnionego użytkownika i nie jest częścią DTO.

**Pola:**

- `name: string` - Nazwa planu (wymagane, max 255 znaków)
- `clientId: string` - UUID klienta, do którego plan jest przypisany (wymagane)
- `description?: string` - Opis planu (opcjonalne, max 2000 znaków)

**Dekoratory walidacji:**

- `@IsString()`, `@IsNotEmpty()`, `@MaxLength(255)` dla `name`
- `@IsUUID()`, `@IsNotEmpty()` dla `clientId`
- `@IsOptional()`, `@IsString()`, `@MaxLength(2000)` dla `description`

##### `update-training-plan.dto.ts`

**Przeznaczenie:** Aktualizacja nagłówka planu treningowego

**Pola:** (wszystkie opcjonalne)

- `name?: string` - Zaktualizowana nazwa
- `description?: string` - Zaktualizowany opis
- `status?: PlanStatus` - Zmiana statusu (np. archiwizacja)

**Dekoratory walidacji:**

- `@IsOptional()`, `@IsString()`, `@MaxLength(255)` dla `name`
- `@IsOptional()`, `@IsString()`, `@MaxLength(2000)` dla `description`
- `@IsOptional()`, `@IsEnum(PlanStatus)` dla `status`

##### `training-plan-query.dto.ts`

**Przeznaczenie:** Parametry zapytania do filtrowania listy planów

**Pola:** (wszystkie opcjonalne)

- `clientId?: string` - Filtr po UUID klienta (tylko dla trenera)
- `status?: PlanStatus` - Filtr po statusie planu

**Dekoratory walidacji:**

- `@IsOptional()`, `@IsUUID()` dla `clientId`
- `@IsOptional()`, `@IsEnum(PlanStatus)` dla `status`

##### `training-plan-response.dto.ts`

**Przeznaczenie:** Reprezentacja nagłówka planu w odpowiedziach API (lista planów)

**Pola:**

- `id: string` - UUID planu
- `trainerId: string` - UUID trenera
- `clientId: string` - UUID klienta
- `name: string` - Nazwa planu
- `description: string | null` - Opis planu
- `status: PlanStatus` - Status planu
- `createdAt: Date` - Data utworzenia
- `updatedAt: Date` - Data ostatniej aktualizacji

**Dekoratory:** `@Expose()` dla wszystkich pól

##### `training-plan-details-response.dto.ts`

**Przeznaczenie:** Pełna reprezentacja planu z zagnieżdżonymi jednostkami i ćwiczeniami (szczegóły planu)

**Pola:**

- `id: string` - UUID planu
- `trainerId: string` - UUID trenera
- `clientId: string` - UUID klienta
- `name: string` - Nazwa planu
- `description: string | null` - Opis planu
- `status: PlanStatus` - Status planu
- `createdAt: Date` - Data utworzenia
- `updatedAt: Date` - Data ostatniej aktualizacji
- `units: TrainingUnitResponseDto[]` - Lista jednostek treningowych z ćwiczeniami

**Dekoratory:**

- `@Expose()` dla wszystkich pól
- `@Type(() => TrainingUnitResponseDto)` dla `units` (class-transformer)

#### Interfaces (`interfaces/`)

##### `training-plan-filters.interface.ts`

**Przeznaczenie:** Interfejs filtrów dla serwisu planów

**Pola:**

- `clientId?: string`
- `status?: PlanStatus`

---

## 3. Training Units Module

### Lokalizacja

`backend/src/training-units/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-training-unit.dto.ts`

**Przeznaczenie:** Dodawanie nowej jednostki treningowej do planu

**Uwaga:** `trainingPlanId` jest pobierany z parametru URL (`/training-plans/:planId/units`) i nie jest częścią DTO.

**Pola:**

- `name: string` - Nazwa jednostki (wymagane, max 255 znaków)
- `sortOrder?: number` - Kolejność w planie (opcjonalne, domyślnie na końcu)

**Dekoratory walidacji:**

- `@IsString()`, `@IsNotEmpty()`, `@MaxLength(255)` dla `name`
- `@IsOptional()`, `@IsInt()`, `@Min(0)` dla `sortOrder`

##### `update-training-unit.dto.ts`

**Przeznaczenie:** Aktualizacja jednostki treningowej

**Implementacja:** `extends PartialType(CreateTrainingUnitDto)`

**Pola:** (wszystkie opcjonalne)

- `name?: string`
- `sortOrder?: number`

##### `training-unit-response.dto.ts`

**Przeznaczenie:** Reprezentacja jednostki treningowej w odpowiedziach API

**Pola:**

- `id: string` - UUID jednostki
- `name: string` - Nazwa jednostki
- `sortOrder: number` - Kolejność w planie
- `exercises: PlanExerciseResponseDto[]` - Lista ćwiczeń w jednostce

**Dekoratory:**

- `@Expose()` dla wszystkich pól
- `@Type(() => PlanExerciseResponseDto)` dla `exercises`

---

## 4. Plan Exercises Module

### Lokalizacja

`backend/src/plan-exercises/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-plan-exercise.dto.ts`

**Przeznaczenie:** Dodawanie ćwiczenia do jednostki treningowej

**Uwaga:** `trainingUnitId` jest pobierany z parametru URL (`/training-units/:unitId/exercises`) i nie jest częścią DTO.

**Pola:**

- `exerciseId: string` - UUID ćwiczenia z biblioteki (wymagane)
- `sets?: string` - Liczba serii (opcjonalne, max 50 znaków)
- `reps?: string` - Liczba powtórzeń lub zakres (opcjonalne, max 50 znaków)
- `weight?: string` - Ciężar (opcjonalne, max 50 znaków)
- `tempo?: string` - Tempo wykonania (opcjonalne, max 50 znaków)
- `rest?: string` - Przerwa między seriami (opcjonalne, max 50 znaków)
- `notes?: string` - Dodatkowe notatki (opcjonalne, max 1000 znaków)
- `sortOrder?: number` - Kolejność w jednostce (opcjonalne)

**Dekoratory walidacji:**

- `@IsUUID()`, `@IsNotEmpty()` dla `exerciseId`
- `@IsOptional()`, `@IsString()`, `@MaxLength(50)` dla `sets`, `reps`, `weight`, `tempo`, `rest`
- `@IsOptional()`, `@IsString()`, `@MaxLength(1000)` dla `notes`
- `@IsOptional()`, `@IsInt()`, `@Min(0)` dla `sortOrder`

##### `update-plan-exercise.dto.ts`

**Przeznaczenie:** Aktualizacja parametrów ćwiczenia w planie (tylko dla trenera)

**Implementacja:** `extends PartialType(OmitType(CreatePlanExerciseDto, ['exerciseId']))`

**Pola:** (wszystkie opcjonalne, bez `exerciseId`)

- `sets?: string`
- `reps?: string`
- `weight?: string`
- `tempo?: string`
- `rest?: string`
- `notes?: string`
- `sortOrder?: number`

##### `update-plan-exercise-completion.dto.ts`

**Przeznaczenie:** Zmiana statusu wykonania ćwiczenia (tylko dla klienta)

**Pola:**

- `isCompleted: boolean` - Czy ćwiczenie zostało wykonane (wymagane)

**Dekoratory walidacji:**

- `@IsBoolean()`, `@IsNotEmpty()` dla `isCompleted`

##### `plan-exercise-response.dto.ts`

**Przeznaczenie:** Reprezentacja ćwiczenia w planie w odpowiedziach API

**Pola:**

- `id: string` - UUID wpisu ćwiczenia w planie
- `exerciseId: string` - UUID ćwiczenia z biblioteki
- `exerciseName: string` - Nazwa ćwiczenia (spłaszczona z relacji)
- `sets: string | null` - Liczba serii
- `reps: string | null` - Liczba powtórzeń
- `weight: string | null` - Ciężar
- `tempo: string | null` - Tempo
- `rest: string | null` - Przerwa
- `notes: string | null` - Notatki
- `sortOrder: number` - Kolejność w jednostce
- `isCompleted: boolean` - Czy wykonane przez klienta

**Dekoratory:** `@Expose()` dla wszystkich pól

---

## Statystyki

### Podsumowanie wygenerowanych plików

| Moduł          | DTOs  | Interfaces | Enums | Razem |
| -------------- | ----- | ---------- | ----- | ----- |
| exercises      | 4     | 1          | 1     | 6     |
| training-plans | 5     | 1          | 1     | 7     |
| training-units | 3     | 0          | 0     | 3     |
| plan-exercises | 4     | 0          | 0     | 4     |
| **RAZEM**      | **16** | **2**     | **2** | **20** |

### Zastosowane wzorce

1. **Nazewnictwo plików:** kebab-case (np. `create-exercise.dto.ts`)
2. **Nazewnictwo klas/interfejsów:** PascalCase (np. `CreateExerciseDto`)
3. **Struktura folderów:**
   - `dto/` dla Data Transfer Objects
   - `enums/` dla enumów
   - `interfaces/` dla interfejsów
4. **Mapped Types:** Użycie `PartialType`, `OmitType` z `@nestjs/swagger`
5. **Walidacja:** Użycie dekoratorów z `class-validator`
6. **Transformacja:** Użycie `@Expose()` i `@Type()` z `class-transformer`
7. **Opcjonalność:** Konsekwentne użycie `@IsOptional()` i `?` w TypeScript

---

## Zgodność z Architekturą

### NestJS Best Practices

✅ Każdy DTO w osobnym pliku  
✅ Separacja DTOs, enumów i interfejsów  
✅ Użycie class-validator dla walidacji  
✅ Użycie class-transformer dla transformacji  
✅ Mapped Types dla DRY (PartialType, OmitType)  
✅ Proper typing z TypeScript strict mode  
✅ Swagger decorators (@ApiProperty, @ApiPropertyOptional)

### Zgodność z Planami

✅ Wszystkie DTOs z `training-plans-module-plan.md` zaimplementowane  
✅ Zgodność z endpointami z `training-plans-api-plan.md`  
✅ Proper field validation zgodnie z requirements  
✅ Relacje między modułami uwzględnione (UUID references)  
✅ Response DTOs dla zagnieżdżonych struktur (plan → units → exercises)

### Code Style

✅ Używane double quotes (`"`) zgodnie z projektem  
✅ Explicit typing dla wszystkich pól  
✅ Proper imports organization  
✅ Barrel exports (index.ts) dla każdego folderu

---

## Struktura Plików

```
backend/src/
├── exercises/
│   ├── dto/
│   │   ├── create-exercise.dto.ts
│   │   ├── update-exercise.dto.ts
│   │   ├── exercise-query.dto.ts
│   │   ├── exercise-response.dto.ts
│   │   └── index.ts
│   ├── enums/
│   │   ├── muscle-group-type.enum.ts
│   │   └── index.ts
│   └── interfaces/
│       ├── exercise-filters.interface.ts
│       └── index.ts
├── training-plans/
│   ├── dto/
│   │   ├── create-training-plan.dto.ts
│   │   ├── update-training-plan.dto.ts
│   │   ├── training-plan-query.dto.ts
│   │   ├── training-plan-response.dto.ts
│   │   ├── training-plan-details-response.dto.ts
│   │   └── index.ts
│   ├── enums/
│   │   ├── plan-status.enum.ts
│   │   └── index.ts
│   └── interfaces/
│       ├── training-plan-filters.interface.ts
│       └── index.ts
├── training-units/
│   └── dto/
│       ├── create-training-unit.dto.ts
│       ├── update-training-unit.dto.ts
│       ├── training-unit-response.dto.ts
│       └── index.ts
└── plan-exercises/
    └── dto/
        ├── create-plan-exercise.dto.ts
        ├── update-plan-exercise.dto.ts
        ├── update-plan-exercise-completion.dto.ts
        ├── plan-exercise-response.dto.ts
        └── index.ts
```

---

## Uwagi Implementacyjne

### Zagnieżdżone Response DTOs

`TrainingPlanDetailsResponseDto` zawiera zagnieżdżone `TrainingUnitResponseDto[]`, które z kolei zawierają `PlanExerciseResponseDto[]`. Przy transformacji używaj `plainToInstance()` z `class-transformer` z opcją `excludeExtraneousValues: true`.

### Spłaszczone pola w Response

`PlanExerciseResponseDto` zawiera pole `exerciseName` - jest to spłaszczona wartość z relacji `exercise.name`. Serwis musi ręcznie mapować to pole przy zwracaniu danych.

### UUID Validation

Wszystkie relacje używają UUID v4. Dekorator `@IsUUID()` zapewnia poprawną walidację.

### Soft Deletes

Moduł `exercises` implementuje soft delete poprzez pole `deletedAt`. Przy pobieraniu ćwiczeń dla planów należy używać `withDeleted: true` dla relacji, aby zachować historyczne dane.

### Partial Updates

Update DTOs używają partial pattern - wszystkie pola opcjonalne. Implementacja powinna używać logiki merge, nie replace.

### Uprawnienia

- **Trener:** Pełny dostęp do CRUD na wszystkich zasobach własnych planów
- **Klient:** READ dla struktury planu, WRITE tylko dla `isCompleted` w `PlanExercise`

---

_Dokument wygenerowany automatycznie na podstawie planów modułów i API._
