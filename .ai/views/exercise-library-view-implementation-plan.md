# Plan implementacji widoku Biblioteka Ćwiczeń (Exercise Library)

## 1. Przegląd
Widok "Biblioteka Ćwiczeń" pozwala trenerom na zarządzanie bazą dostępnych ćwiczeń. Umożliwia przeglądanie ćwiczeń systemowych i własnych, filtrowanie ich, a także dodawanie nowych ćwiczeń niestandardowych oraz usuwanie tych, które zostały utworzone przez trenera.

## 2. Routing widoku
- **Ścieżka:** `/trainer/exercises`
- **Nazwa trasy:** `trainer-exercises`
- **Dostęp:** Wymaga roli `TRAINER`.

## 3. Struktura komponentów
```
ExerciseLibraryView (Page)
├── ExerciseStats (Opcjonalnie - statystyki liczbowe)
├── ExerciseLibraryLayout (Kontener layoutu)
│   ├── ExerciseFiltersSidebar (Panel boczny z filtrami)
│   │   ├── SearchInput
│   │   └── MuscleGroupFilter (Select/Radio)
│   └── ExerciseContent (Główna sekcja)
│       ├── ExerciseListHeader (Tytuł + Przycisk "Dodaj ćwiczenie")
│       ├── ExerciseListTable (Tabela danych)
│       │   ├── ExerciseStatusBadge (Systemowe/Własne)
│       │   └── ExerciseActions (Menu akcji: Usuń)
│       └── ExerciseEmptyState (Stan braku wyników)
├── ExerciseFormDialog (Modal dodawania)
│   └── ExerciseForm
└── ConfirmDeleteDialog (Modal potwierdzenia usunięcia)
```

## 4. Szczegóły komponentów

### `ExerciseLibraryView`
- **Opis:** Główny widok integrujący stan filtrów i dane z API.
- **Główne elementy:** `ExerciseLibraryLayout`, `ExerciseFormDialog`.
- **Zarządzanie stanem:** Przechowuje stan widoczności modali (`isCreateModalOpen`, `isDeleteModalOpen`).

### `ExerciseFiltersSidebar`
- **Opis:** Komponent boczny do filtrowania listy.
- **Obsługiwane interakcje:**
    - Wpisanie frazy w wyszukiwarkę (debounce 300ms).
    - Wybór partii mięśniowej (Single Select - zgodnie z API `ExerciseQueryDto`).
- **Propsy:**
    - `filters`: `ExerciseFilters` (aktualny stan).
- **Emits:**
    - `update:filters`: Aktualizacja obiektu filtrów.

### `ExerciseListTable`
- **Opis:** Tabela wyświetlająca listę ćwiczeń.
- **Kolumny:**
    - Nazwa ćwiczenia.
    - Partia mięśniowa (sformatowana nazwa).
    - Źródło (Badge: "Systemowe" / "Własne").
    - Akcje (ikona kosza - widoczna tylko dla `isSystem: false`).
- **Propsy:**
    - `exercises`: `Exercise[]`.
    - `isLoading`: `boolean`.
- **Emits:**
    - `delete`: `(exercise: Exercise) => void`.

### `ExerciseFormDialog`
- **Opis:** Modal z formularzem dodawania nowego ćwiczenia.
- **Główne elementy:** Formularz oparty na `vee-validate`.
- **Pola formularza:**
    - `name`: Input tekstowy.
    - `muscleGroup`: Select z listą z enuma `MuscleGroupType`.
- **Walidacja:**
    - `name`: Wymagane, min 3 znaki, max 255 znaków.
    - `muscleGroup`: Wymagane, poprawna wartość z enuma.
- **Obsługiwane interakcje:**
    - `onSubmit`: Wywołanie mutacji tworzenia.
    - `onCancel`: Zamknięcie modala i reset formularza.

## 5. Typy

```typescript
// Enums
export enum MuscleGroupType {
  CHEST = 'CHEST',
  BACK = 'BACK',
  SHOULDERS = 'SHOULDERS',
  BICEPS = 'BICEPS',
  TRICEPS = 'TRICEPS',
  LEGS = 'LEGS',
  CORE = 'CORE',
  GLUTES = 'GLUTES',
  FOREARMS = 'FOREARMS',
  CARDIO = 'CARDIO',
  FULL_BODY = 'FULL_BODY',
}

// DTOs
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroupType;
  isSystem: boolean;
  trainerId: string | null;
  createdAt?: string; // Opcjonalnie do wyświetlania
}

export interface CreateExerciseDto {
  name: string;
  muscleGroup: MuscleGroupType;
}

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: MuscleGroupType;
}
```

## 6. Zarządzanie stanem

Wykorzystanie **Vue Query (TanStack Query)** do zarządzania stanem serwerowym oraz **Composables** do logiki lokalnej.

### Custom Hook: `useExercises`
- **State:**
    - `filters`: `Ref<ExerciseFilters>`
- **Queries:**
    - `exercisesQuery`: Pobiera listę ćwiczeń z API. Klucz cache: `['exercises', filters]`.
- **Mutations:**
    - `createExerciseMutation`: `POST /exercises`. Po sukcesie inwaliduje `['exercises']`.
    - `deleteExerciseMutation`: `DELETE /exercises/{id}`. Po sukcesie inwaliduje `['exercises']`.

## 7. Integracja API

Integracja z endpointami zdefiniowanymi w `ExercisesController`.

### Endpoints
1.  **Pobranie listy:**
    -   Metoda: `GET`
    -   URL: `/exercises`
    -   Params: `search` (string), `muscleGroup` (enum value).
    -   Response: `Exercise[]`.
2.  **Utworzenie ćwiczenia:**
    -   Metoda: `POST`
    -   URL: `/exercises`
    -   Body: `CreateExerciseDto`.
    -   Response: `Exercise`.
3.  **Usunięcie ćwiczenia:**
    -   Metoda: `DELETE`
    -   URL: `/exercises/${id}`
    -   Response: `void` (200 OK).

## 8. Interakcje użytkownika

1.  **Przeglądanie:** Użytkownik wchodzi na stronę, widzi listę wszystkich ćwiczeń (systemowych i własnych).
2.  **Filtrowanie:**
    -   Użytkownik wpisuje "wyciskanie" w search -> Tabela odświeża się, pokazując wyniki pasujące do frazy.
    -   Użytkownik wybiera "Klatka piersiowa" w filtrze -> Tabela pokazuje tylko ćwiczenia na klatkę.
3.  **Dodawanie:**
    -   Kliknięcie "Dodaj ćwiczenie" otwiera modal.
    -   Wypełnienie formularza i kliknięcie "Zapisz".
    -   Modal zamyka się, lista odświeża się z nowym ćwiczeniem na górze (lub zgodnie z sortowaniem API).
4.  **Usuwanie:**
    -   Kliknięcie ikony kosza przy **własnym** ćwiczeniu (ikona niewidoczna przy systemowych).
    -   Potwierdzenie w dialogu ostrzegawczym (Soft delete).
    -   Ćwiczenie znika z listy.

## 9. Warunki i walidacja

### Frontend Validation (Formularze)
-   **Nazwa:** Pole wymagane (`required`), minimalna długość 3 znaki.
-   **Partia mięśniowa:** Pole wymagane (`required`), musi być wybrane z listy.

### Business Logic Validation (UI)
-   **Uprawnienia usuwania:** Przycisk usuwania jest renderowany **tylko** gdy `exercise.isSystem === false`.
-   **Ostrzeżenie przy usuwaniu:** Wyświetlenie komunikatu, że usunięcie ćwiczenia nie usunie go z historycznych planów, ale zablokuje użycie w nowych.

## 10. Obsługa błędów
-   **Błąd pobierania:** Wyświetlenie komunikatu "Nie udało się załadować ćwiczeń" w miejscu tabeli lub toast error.
-   **Błąd tworzenia/usuwania:** Wyświetlenie toastu (np. Sonner/Toast) z informacją o błędzie.
-   **Walidacja API:** Jeśli API zwróci 400 (Bad Request), formularz powinien wyświetlić błędy walidacji przypisane do pól.

## 11. Kroki implementacji

1.  **Setup Typów:** Utworzenie plików typów w `frontend/src/types/exercises.ts` (Enum `MuscleGroupType`, interfejsy).
2.  **API Client:** Dodanie metod w serwisie API (`services/exercises.service.ts`).
3.  **Composable:** Implementacja `useExercises` w `composables/useExercises.ts` (Query + Mutations).
4.  **UI - Filtry:** Implementacja `ExerciseFiltersSidebar` z inputem i selectem.
5.  **UI - Tabela:** Implementacja `ExerciseListTable` z obsługą wyświetlania Badges i przycisków akcji zależnych od `isSystem`.
6.  **UI - Formularz:** Implementacja `ExerciseFormDialog` z walidacją `vee-validate`.
7.  **Integracja:** Złożenie komponentów w `ExerciseLibraryView.vue` i podpięcie logiki z composable.
8.  **Testy Manualne:** Weryfikacja filtrowania, dodawania i blokady usuwania ćwiczeń systemowych.
