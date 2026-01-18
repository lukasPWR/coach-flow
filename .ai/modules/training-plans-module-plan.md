# Plan Implementacji Modułu: Training Plans

Ten dokument zawiera szczegółowy plan implementacji dla modułu planów treningowych w systemie CoachFlow.

## Zidentyfikowane Domeny

Na podstawie analizy schematu bazy danych i wymagań PRD, wyodrębniono następujące domeny:

1.  **Exercises** - Zarządzanie biblioteką ćwiczeń (systemowych i własnych trenera).
2.  **TrainingPlans** - Zarządzanie nagłówkami planów treningowych.
3.  **TrainingUnits** - Zarządzanie jednostkami treningowymi w ramach planu.
4.  **PlanExercises** - Zarządzanie konkretnymi ćwiczeniami przypisanymi do jednostek.

---

### `Exercises`

#### 1. Encja (`exercise.entity.ts`)

- **Klasa:** `Exercise`
- **Pola:**
  - `id: string` (UUID, Primary Key)
  - `trainerId: string` (Nullable, Foreign Key do Users)
  - `name: string`
  - `muscleGroup: MuscleGroupType` (Enum)
  - `isSystem: boolean` (Default: false)
  - `createdAt: Date`
  - `updatedAt: Date`
  - `deletedAt: Date` (Soft Delete)
  - **Relacje:**
    - `trainer: User` (ManyToOne)
    - `planExercises: PlanExercise[]` (OneToMany)

#### 2. DTOs (Data Transfer Objects)

- **`create-exercise.dto.ts`**
  - **Pola:**
    - `name: string` (@IsString, @IsNotEmpty)
    - `muscleGroup: MuscleGroupType` (@IsEnum)
    - `isSystem: boolean` (@IsBoolean, @IsOptional)
- **`update-exercise.dto.ts`**
  - **Pola:**
    - `name: string` (@IsString, @IsOptional)
    - `muscleGroup: MuscleGroupType` (@IsEnum, @IsOptional)
    - `isSystem: boolean` (@IsBoolean, @IsOptional)

#### 3. Kontroler (`exercises.controller.ts`)

- **Ścieżka bazowa:** `/exercises`
- **Endpointy:**
  - `POST /` - Tworzy nowe ćwiczenie (dla trenera lub systemowe).
  - `GET /` - Zwraca listę ćwiczeń (systemowe + trenera).
  - `GET /:id` - Zwraca pojedyncze ćwiczenie.
  - `PATCH /:id` - Aktualizuje ćwiczenie (tylko własne).
  - `DELETE /:id` - Usuwa ćwiczenie (Soft Delete, tylko własne).

#### 4. Serwis (`exercises.service.ts`)

- **Metody:**
  - `create(dto: CreateExerciseDto, trainerId: string)`
  - `findAll(trainerId: string, filters?: ExerciseFilters)`
  - `findOne(id: string)`
  - `update(id: string, dto: UpdateExerciseDto, trainerId: string)`
  - `remove(id: string, trainerId: string)`

---

### `TrainingPlans`

#### 1. Encja (`training-plan.entity.ts`)

- **Klasa:** `TrainingPlan`
- **Pola:**
  - `id: string` (UUID, Primary Key)
  - `trainerId: string` (Foreign Key do Users)
  - `clientId: string` (Foreign Key do Users)
  - `name: string`
  - `description: string` (Nullable)
  - `status: PlanStatus` (Enum: ACTIVE, ARCHIVED)
  - `createdAt: Date`
  - `updatedAt: Date`
  - **Relacje:**
    - `trainer: User` (ManyToOne)
    - `client: User` (ManyToOne)
    - `trainingUnits: TrainingUnit[]` (OneToMany)

#### 2. DTOs (Data Transfer Objects)

- **`create-training-plan.dto.ts`**
  - **Pola:**
    - `clientId: string` (@IsUUID, @IsNotEmpty)
    - `name: string` (@IsString, @IsNotEmpty)
    - `description: string` (@IsString, @IsOptional)
- **`update-training-plan.dto.ts`**
  - **Pola:**
    - `name: string` (@IsString, @IsOptional)
    - `description: string` (@IsString, @IsOptional)
    - `status: PlanStatus` (@IsEnum, @IsOptional)
    - `clientId: string` (@IsUUID, @IsOptional)

#### 3. Kontroler (`training-plans.controller.ts`)

- **Ścieżka bazowa:** `/training-plans`
- **Endpointy:**
  - `POST /` - Tworzy nowy plan.
  - `GET /` - Zwraca listę planów (dla trenera lub klienta).
  - `GET /:id` - Zwraca szczegóły planu.
  - `PATCH /:id` - Aktualizuje plan (nagłówek).
  - `DELETE /:id` - Usuwa plan (opcjonalnie, brak w PRD, ale standard w API).

#### 4. Serwis (`training-plans.service.ts`)

- **Metody:**
  - `create(dto: CreateTrainingPlanDto, trainerId: string)`
  - `findAll(userId: string, role: UserRole)`
  - `findOne(id: string, userId: string, role: UserRole)`
  - `update(id: string, dto: UpdateTrainingPlanDto, trainerId: string)`
  - `remove(id: string, trainerId: string)`

---

### `TrainingUnits`

#### 1. Encja (`training-unit.entity.ts`)

- **Klasa:** `TrainingUnit`
- **Pola:**
  - `id: string` (UUID, Primary Key)
  - `trainingPlanId: string` (Foreign Key do TrainingPlans)
  - `name: string`
  - `sortOrder: number` (Integer)
  - `createdAt: Date`
  - `updatedAt: Date`
  - **Relacje:**
    - `trainingPlan: TrainingPlan` (ManyToOne)
    - `planExercises: PlanExercise[]` (OneToMany)

#### 2. DTOs (Data Transfer Objects)

- **`create-training-unit.dto.ts`**
  - **Pola:**
    - `trainingPlanId: string` (@IsUUID, @IsNotEmpty)
    - `name: string` (@IsString, @IsNotEmpty)
    - `sortOrder: number` (@IsInt, @IsOptional)
- **`update-training-unit.dto.ts`**
  - **Pola:**
    - `name: string` (@IsString, @IsOptional)
    - `sortOrder: number` (@IsInt, @IsOptional)

#### 3. Kontroler (`training-units.controller.ts`)

- **Ścieżka bazowa:** `/training-units`
- **Endpointy:**
  - `POST /` - Dodaje jednostkę do planu.
  - `GET /` - Zwraca listę jednostek (zwykle pobierane z planem, ale może być osobno).
  - `GET /:id` - Zwraca jednostkę.
  - `PATCH /:id` - Aktualizuje jednostkę.
  - `DELETE /:id` - Usuwa jednostkę.

#### 4. Serwis (`training-units.service.ts`)

- **Metody:**
  - `create(dto: CreateTrainingUnitDto)`
  - `findAll(trainingPlanId: string)`
  - `findOne(id: string)`
  - `update(id: string, dto: UpdateTrainingUnitDto)`
  - `remove(id: string)`

---

### `PlanExercises`

#### 1. Encja (`plan-exercise.entity.ts`)

- **Klasa:** `PlanExercise`
- **Pola:**
  - `id: string` (UUID, Primary Key)
  - `trainingUnitId: string` (Foreign Key do TrainingUnits)
  - `exerciseId: string` (Foreign Key do Exercises)
  - `sets: string` (Nullable)
  - `reps: string` (Nullable)
  - `weight: string` (Nullable)
  - `tempo: string` (Nullable)
  - `rest: string` (Nullable)
  - `notes: string` (Nullable)
  - `sortOrder: number` (Integer)
  - `isCompleted: boolean` (Default: false)
  - `createdAt: Date`
  - `updatedAt: Date`
  - **Relacje:**
    - `trainingUnit: TrainingUnit` (ManyToOne)
    - `exercise: Exercise` (ManyToOne)

#### 2. DTOs (Data Transfer Objects)

- **`create-plan-exercise.dto.ts`**
  - **Pola:**
    - `trainingUnitId: string` (@IsUUID, @IsNotEmpty)
    - `exerciseId: string` (@IsUUID, @IsNotEmpty)
    - `sets: string` (@IsString, @IsOptional)
    - `reps: string` (@IsString, @IsOptional)
    - `weight: string` (@IsString, @IsOptional)
    - `tempo: string` (@IsString, @IsOptional)
    - `rest: string` (@IsString, @IsOptional)
    - `notes: string` (@IsString, @IsOptional)
    - `sortOrder: number` (@IsInt, @IsOptional)
- **`update-plan-exercise.dto.ts`**
  - **Pola:**
    - `sets: string` (@IsString, @IsOptional)
    - `reps: string` (@IsString, @IsOptional)
    - `weight: string` (@IsString, @IsOptional)
    - `tempo: string` (@IsString, @IsOptional)
    - `rest: string` (@IsString, @IsOptional)
    - `notes: string` (@IsString, @IsOptional)
    - `sortOrder: number` (@IsInt, @IsOptional)
    - `isCompleted: boolean` (@IsBoolean, @IsOptional)

#### 3. Kontroler (`plan-exercises.controller.ts`)

- **Ścieżka bazowa:** `/plan-exercises`
- **Endpointy:**
  - `POST /` - Dodaje ćwiczenie do jednostki.
  - `GET /` - Zwraca ćwiczenia (zwykle w kontekście jednostki).
  - `GET /:id` - Zwraca szczegóły przypisania.
  - `PATCH /:id` - Aktualizuje parametry ćwiczenia lub status `isCompleted`.
  - `DELETE /:id` - Usuwa ćwiczenie z planu.

#### 4. Serwis (`plan-exercises.service.ts`)

- **Metody:**
  - `create(dto: CreatePlanExerciseDto)`
  - `findAll(trainingUnitId: string)`
  - `findOne(id: string)`
  - `update(id: string, dto: UpdatePlanExerciseDto)`
  - `remove(id: string)`
