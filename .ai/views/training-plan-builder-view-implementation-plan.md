# Plan implementacji widoku Kreator Planu Treningowego (Training Plan Builder)

## 1. Przegląd

Widok "Kreator Planu" służy do kompleksowego tworzenia i edycji planów treningowych przez trenera. Umożliwia zarządzanie strukturą planu (nagłówek, przypisanie klienta), zarządzanie jednostkami treningowymi (dni treningowe) oraz szczegółową konfigurację ćwiczeń wewnątrz jednostek (serie, powtórzenia, Drag & Drop). Widok kładzie duży nacisk na UX poprzez mechanizmy Auto-save, Debounce oraz wskaźniki stanu synchronizacji.

## 2. Routing widoku

*   **Ścieżka:** `/trainer/plans/:id/edit`
*   **Nazwa trasy:** `TrainerPlanEdit`
*   **Wymagane parametry:** `:id` (UUID planu)

## 3. Struktura komponentów

```text
TrainingPlanBuilderView (Page Component)
├── PlanHeader (Nagłówek planu, nazwa, status, klient)
├── UnitTabsNavigation (Zarządzanie jednostkami - zakładki)
├── ActiveUnitEditor (Kontener edycji wybranej jednostki)
│   ├── UnitActionsBar (Menu akcji jednostki: Duplikuj, Usuń)
│   ├── ExerciseEditorList (Lista Drag & Drop)
│   │   └── PlanExerciseCard (Karta ćwiczenia z inputami)
│   └── AddExercisePlaceholder (Przycisk otwierający modal)
└── ExerciseSearchModal (Modal wyboru ćwiczeń)
    ├── ExerciseFilters (Filtrowanie: partia mięśniowa, search)
    └── ExerciseResultsList (Lista wyników do wyboru)
```

## 4. Szczegóły komponentów

### 1. `TrainingPlanBuilderView`
*   **Opis:** Główny kontener widoku. Odpowiada za pobranie danych planu (`fetchPlan`), inicjalizację `composable` do zarządzania stanem oraz obsługę globalnych powiadomień (Toasts).
*   **Główne elementy:** `div.layout-container`, `<PlanHeader>`, `<UnitTabsNavigation>`, `<ActiveUnitEditor>`, `<ExerciseSearchModal>`.
*   **Obsługiwane interakcje:** Inicjalizacja pobierania danych, obsługa błędów globalnych.
*   **Typy:** `TrainingPlanDetails`.

### 2. `PlanHeader`
*   **Opis:** Formularz edycji głównych danych planu.
*   **Główne elementy:** `Input` (Nazwa), `Select` (Klient), `StatusBadge/Toggle`, `SaveIndicator` (Ikona: Zapisano/Zapisywanie).
*   **Obsługiwane interakcje:**
    *   Zmiana nazwy (Debounce 500ms -> PATCH).
    *   Zmiana klienta (Select -> PATCH).
    *   Zmiana statusu (Active/Archived).
*   **Walidacja:** Nazwa planu wymagana (min. 3 znaki).
*   **Propsy:** `plan: TrainingPlanDetails`, `isSaving: boolean`.

### 3. `UnitTabsNavigation`
*   **Opis:** Poziomy pasek zakładek reprezentujący jednostki treningowe. Pozwala na przełączanie się między dniami oraz dodawanie nowych dni.
*   **Główne elementy:** Lista tabów, Przycisk `+` (Dodaj jednostkę).
*   **Obsługiwane interakcje:**
    *   Kliknięcie w tab -> Zmiana `activeUnitId`.
    *   Kliknięcie `+` -> Utworzenie nowej jednostki (POST).
    *   Drag & Drop zakładek (opcjonalnie, zmiana kolejności dni).
*   **Propsy:** `units: TrainingUnit[]`, `activeUnitId: string`.

### 4. `ActiveUnitEditor` & `UnitActionsBar`
*   **Opis:** Wyświetla zawartość aktualnie wybranej jednostki. Pasek akcji pozwala na zarządzanie samą jednostką.
*   **Główne elementy:** Nagłówek jednostki (Input nazwy), Przyciski: "Duplikuj", "Usuń".
*   **Obsługiwane interakcje:**
    *   Zmiana nazwy jednostki (Debounce -> PATCH).
    *   Duplikacja jednostki (POST `/duplicate`).
    *   Usunięcie jednostki (DELETE + Potwierdzenie).
*   **Propsy:** `unit: TrainingUnit`.

### 5. `ExerciseEditorList`
*   **Opis:** Lista ćwiczeń wewnątrz jednostki obsługująca Drag & Drop. Wykorzystuje bibliotekę `vuedraggable`.
*   **Główne elementy:** `<draggable>`, lista komponentów `<PlanExerciseCard>`.
*   **Obsługiwane interakcje:**
    *   Przenoszenie elementów (Reorder) -> Aktualizacja `sortOrder`.
*   **Propsy:** `exercises: PlanExercise[]`.

### 6. `PlanExerciseCard`
*   **Opis:** Rozbudowana karta pojedynczego ćwiczenia w planie. Zawiera pola edycyjne parametrów.
*   **Główne elementy:** Nazwa ćwiczenia, Inputy: `Sets`, `Reps`, `Weight`, `Tempo`, `Rest`, `Note`. Przycisk usuwania (X).
*   **Obsługiwane interakcje:**
    *   Edycja dowolnego pola tekstowego (Debounce 500-1000ms -> PATCH).
    *   Usunięcie ćwiczenia (DELETE -> Toast z opcją Undo).
*   **Propsy:** `exercise: PlanExercise`.
*   **Walidacja:** Pola tekstowe, brak ścisłej walidacji numerycznej (trener może wpisać "12-15" lub "MAX"), ale ograniczenie długości znaków.

### 7. `ExerciseSearchModal`
*   **Opis:** Modal pozwalający wyszukać ćwiczenie z bazy systemowej lub własnej trenera.
*   **Główne elementy:** Input `Search`, Select `MuscleGroup`, Lista wyników.
*   **Obsługiwane interakcje:**
    *   Wpisanie frazy -> Live search (GET `/exercises`).
    *   Wybór ćwiczenia -> Emit eventu `select` do rodzica (dodanie do jednostki).
*   **Typy:** `Exercise` (Base Entity).

## 5. Typy

```typescript
// ViewModel / DTOs

// Główny obiekt planu
export interface TrainingPlanDetails {
  id: string;
  name: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'; // Zakładam DRAFT jeśli istnieje
  clientId: string | null; // Nullable jeśli nie przypisano
  clientName?: string; // Do wyświetlenia
  units: TrainingUnit[];
}

// Jednostka treningowa
export interface TrainingUnit {
  id: string;
  planId: string;
  name: string;
  sortOrder: number;
  exercises: PlanExercise[];
}

// Ćwiczenie w planie (instancja)
export interface PlanExercise {
  id: string; // ID instancji w planie
  trainingUnitId: string;
  exerciseId: string; // ID definicji ćwiczenia
  exerciseName: string; // Spłaszczone dla wygody
  muscleGroup?: string; // Opcjonalnie do wyświetlania ikon
  sets: string;
  reps: string;
  weight: string;
  tempo: string;
  rest: string;
  notes: string | null;
  sortOrder: number;
  isCompleted: boolean;
}

// Ćwiczenie z biblioteki (definicja)
export interface ExerciseBase {
  id: string;
  name: string;
  muscleGroup: string;
  // ... inne pola z definicji
}
```

## 6. Zarządzanie stanem

Zalecane użycie composable `useTrainingPlanBuilder(planId: string)`, który enkapsuluje logikę:

*   **State:**
    *   `plan`: Ref<TrainingPlanDetails | null>
    *   `isLoading`: Ref<boolean>
    *   `savingStatus`: Ref<'saved' | 'saving' | 'error'>
    *   `activeUnitId`: Ref<string | null>
    *   `isExerciseModalOpen`: Ref<boolean>
*   **Actions:**
    *   `loadPlan()`: Pobiera dane inicjalne.
    *   `updateHeader(data)`: Optymistyczna aktualizacja lokalna + debounced API call.
    *   `addUnit()`, `deleteUnit(id)`, `duplicateUnit(id)`.
    *   `addExerciseToUnit(exerciseBase)`, `removeExercise(id)`, `updateExercise(id, data)`.
    *   `reorderExercises(newOrder)`: Aktualizacja `sortOrder` w local state i wysyłka na backend.

## 7. Integracja API

*   **Pobranie:** `GET /training-plans/:id`
*   **Nagłówek:** `PATCH /training-plans/:id` (Body: `{ name, clientId, status }`)
*   **Jednostki:**
    *   Dodanie: `POST /training-plans/:id/units` (Body: `{ name, sortOrder }`)
    *   Duplikacja: `POST /training-units/:id/duplicate`
    *   Zmiana nazwy: `PATCH /training-units/:id`
    *   Usunięcie: `DELETE /training-units/:id`
*   **Ćwiczenia:**
    *   Dodanie: `POST /training-units/:unitId/exercises` (Body: `{ exerciseId, ...params }`)
    *   Edycja: `PATCH /plan-exercises/:id` (Body: `{ sets, reps, ... }`)
    *   Usunięcie: `DELETE /plan-exercises/:id`
    *   Klienci: `GET /trainer/clients` (do Selecta w nagłówku).

## 8. Interakcje użytkownika

1.  **Otwarcie kreatora:** Ładowanie planu, domyślne otwarcie pierwszej jednostki (jeśli istnieje).
2.  **Edycja parametrów:** Użytkownik wpisuje np. "4" w pole serie. Ikona zmienia się na "Zapisywanie...". Po 500ms bezczynności leci request. Ikona zmienia się na "Zapisano".
3.  **Dodawanie ćwiczenia:** Kliknięcie "+ Dodaj ćwiczenie" otwiera modal. Wyszukanie "Przysiad". Kliknięcie w wynik zamyka modal i dodaje ćwiczenie na koniec listy w aktywnej jednostce.
4.  **Przenoszenie:** Drag & Drop ćwiczenia łapie za uchwyt (handle icon). Po upuszczeniu lista się przerysowuje, w tle leci request aktualizujący kolejność.

## 9. Warunki i walidacja

*   **Frontend:**
    *   Blokada zapisu pustej nazwy planu.
    *   Blokada dodania ćwiczenia bez wybranej jednostki (choć UI powinno to uniemożliwiać strukturalnie).
*   **Backend (do obsłużenia błędów):**
    *   Weryfikacja czy klient należy do trenera (przy przypisywaniu).
    *   Walidacja długości pól tekstowych.

## 10. Obsługa błędów

*   **Błąd zapisu (Autosave):** Jeśli request w tle zawiedzie (np. brak sieci), ikona stanu zmienia się na czerwoną "Błąd zapisu". Kliknięcie ponawia próbę.
*   **Błąd usunięcia:** Toast z komunikatem błędu, przywrócenie elementu w UI (jeśli usunięto optymistycznie).
*   **Błąd ładowania:** Ekran "Error State" z przyciskiem "Odśwież".

## 11. Kroki implementacji

1.  **Setup:** Stworzenie struktury plików i podstawowych komponentów (puste kontenery).
2.  **API Client:** Dodanie funkcji w warstwie serwisu API (`/src/api/training-plans.ts`).
3.  **State Logic:** Implementacja composable `useTrainingPlanBuilder` z obsługą pobierania danych.
4.  **Header UI:** Implementacja nagłówka, pobierania listy klientów i edycji nazwy planu.
5.  **Units Logic:** Implementacja zakładek, dodawania i usuwania jednostek.
6.  **Exercises List UI:** Implementacja listy ćwiczeń z mockowanymi danymi (bez API).
7.  **Exercises API:** Podpięcie dodawania, edycji i usuwania ćwiczeń do API.
8.  **Drag & Drop:** Integracja `vuedraggable` i obsługa zmiany kolejności.
9.  **Search Modal:** Implementacja modala wyszukiwania i dodawania ćwiczeń.
10. **Refinement:** Dodanie debounce, wskaźników ładowania, obsługi błędów i Toastów "Undo".
