# Plan implementacji widoku Realizacji Planu Treningowego (Client Execution View)

## 1. Przegląd

Widok ten jest przeznaczony dla klientów korzystających z aplikacji na urządzeniach mobilnych w celu realizacji przypisanego planu treningowego. Umożliwia przeglądanie ćwiczeń w ramach jednostek treningowych, sprawdzanie parametrów (serie, powtórzenia) oraz odznaczanie wykonanych ćwiczeń. Kluczowym aspektem jest UX dostosowany do urządzeń mobilnych (Single Expand, Sticky Header).

## 2. Routing widoku

- **Ścieżka:** `/client/plans/:id`
- **Nazwa route'a:** `ClientPlanExecution`
- **Parametry:** `:id` (UUID planu treningowego)

## 3. Struktura komponentów

```text
ClientPlanExecutionView (Smart Component/View)
├── Layout (AppLayout - istniejący)
│   ├── LoadingState (Skeleton loaders)
│   ├── ErrorState (Retry button)
│   └── ContentWrapper
│       ├── PlanHeader (Nazwa planu, pasek postępu - opcjonalnie)
│       ├── UnitSelector (Wybór dnia treningowego)
│       └── ExerciseList (Kontener listy)
│           └── ExerciseItem (Pojedynczy kafelek ćwiczenia - Accordion)
│               ├── ExerciseHeader (Nazwa + Checkbox)
│               └── ExerciseDetails (Parametry, uwagi)
```

## 4. Szczegóły komponentów

### 1. `ClientPlanExecutionView`

- **Opis:** Główny widok. Pobiera dane planu na podstawie ID z URL. Zarządza stanem wybranej jednostki (`selectedUnitId`).
- **Główne elementy:** `UnitSelector`, `ExerciseList`.
- **Obsługiwane interakcje:**
  - Zmiana wybranej jednostki.
  - Obsługa błędu ładowania danych.
- **Typy:** `ClientPlanDetails`.
- **Props:** Brak (parametry z `useRoute`).

### 2. `UnitSelector`

- **Opis:** Komponent nawigacyjny pozwalający przełączać się między jednostkami treningowymi (np. "Trening A", "Trening B"). Jeśli plan ma tylko jedną jednostkę, komponent może być ukryty lub wyświetlać tylko nazwę.
- **Główne elementy:** Lista przycisków/tabów.
- **Obsługiwane interakcje:** Kliknięcie w tab -> emit `update:selectedUnitId`.
- **Props:**
  - `units`: `PlanUnit[]`
  - `selectedUnitId`: `string`

### 3. `ExerciseList`

- **Opis:** Kontener renderujący listę ćwiczeń. Odpowiada za logikę "Single Expand" (tylko jedno ćwiczenie rozwinięte na raz).
- **Główne elementy:** Pętla `v-for` renderująca `ExerciseItem`.
- **Obsługiwane interakcje:**
  - Zarządzanie stanem `expandedExerciseId`.
  - Przekazywanie żądania zmiany statusu ukończenia do rodzica (lub store'a).
- **Props:**
  - `exercises`: `PlanExercise[]`

### 4. `ExerciseItem`

- **Opis:** Pojedynczy wiersz ćwiczenia działający jako akordeon.
- **Główne elementy:**
  - **Header:** Nazwa ćwiczenia (Sticky), `CompletionCheckbox`.
  - **Body:** Grid parametrów (Serie, Powtórzenia, RPE/Tempo), opis/notatki.
- **Obsługiwane interakcje:**
  - Kliknięcie w nagłówek -> toggle expand.
  - Kliknięcie w checkbox -> toggle completion (z `event.stopPropagation`).
- **Props:**
  - `exercise`: `PlanExercise`
  - `isOpen`: `boolean`
- **Style:**
  - Nagłówek powinien mieć `position: sticky` i `top: [height of nav]`.
  - Parametry liczbowe powiększone dla czytelności.

## 5. Typy

Należy wykorzystać lub rozszerzyć typy zdefiniowane w module treningowym.

```typescript
// frontend/src/types/training-plans.ts

export interface PlanExercise {
  id: string // ID instancji ćwiczenia w planie
  exerciseId: string // ID definicji ćwiczenia
  exerciseName: string
  sets: string
  reps: string
  tempo?: string // Opcjonalne
  rpe?: string // Opcjonalne
  notes?: string
  isCompleted: boolean
  sortOrder: number
}

export interface PlanUnit {
  id: string
  name: string
  sortOrder: number
  exercises: PlanExercise[]
}

export interface ClientPlanDetails {
  id: string
  name: string
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT' // Zakładamy, że klient widzi tylko ACTIVE
  units: PlanUnit[]
}
```

## 6. Zarządzanie stanem

Rekomendowane użycie composable `useClientPlans` (utworzonego w ramach tego zadania).

### `useClientPlans.ts`

- **State:**
  - `plan`: `Ref<ClientPlanDetails | null>`
  - `isLoading`: `Ref<boolean>`
  - `error`: `Ref<string | null>`
- **Actions:**
  - `fetchPlanDetails(planId: string)`: Pobiera pełne dane planu.
  - `toggleExerciseCompletion(exerciseId: string, isCompleted: boolean)`:
    - Wykonuje optymistyczną aktualizację w UI (zmienia stan w `plan.value`).
    - Wysyła żądanie API.
    - W przypadku błędu API, cofa zmianę w UI i wyświetla notyfikację.

## 7. Integracja API

Integracja z backendem poprzez `Axios` (lub skonfigurowaną instancję `apiClient`).

### Pobranie szczegółów

- **Endpoint:** `GET /training-plans/:id`
- **Odpowiedź:** `ClientPlanDetails` (mapowanie JSON na interfejs).

### Zmiana statusu (Completion)

- **Endpoint:** `PATCH /plan-exercises/:id/completion`
- **Body:** `{ "isCompleted": boolean }`
- **Odpowiedź:** 200 OK (może zwracać zaktualizowany obiekt ćwiczenia).

## 8. Interakcje użytkownika

1.  **Wejście na widok:**
    - Wyświetla się loader.
    - Po załadowaniu, domyślnie wybierana jest pierwsza jednostka treningowa.
2.  **Zmiana jednostki:**
    - Użytkownik klika w inną jednostkę w `UnitSelector`.
    - Lista ćwiczeń podmienia się natychmiastowo.
3.  **Przeglądanie ćwiczeń:**
    - Użytkownik klika w nagłówek ćwiczenia A.
    - Ćwiczenie A rozwija się, pokazując szczegóły.
    - Użytkownik klika w nagłówek ćwiczenia B.
    - Ćwiczenie A zwija się, B rozwija się (Single Expand).
4.  **Wykonanie ćwiczenia:**
    - Użytkownik klika Checkbox przy ćwiczeniu.
    - Checkbox zmienia stan natychmiast (animacja).
    - Akordeon **nie** zmienia swojego stanu (otwarty/zamknięty).
    - W tle leci request API.

## 9. Warunki i walidacja

- **Weryfikacja istnienia planu:** Jeśli API zwróci 404, przekieruj na stronę listy planów lub wyświetl stosowny komunikat błędu.
- **Status planu:** Upewnij się, że wyświetlane są tylko plany, do których klient ma dostęp.
- **Walidacja checkboxa:** Checkbox powinien być interaktywny tylko wtedy, gdy dane zostały poprawnie załadowane. Podczas trwania requestu API, checkbox może być tymczasowo disabled lub (lepiej) obsługiwany optymistycznie z możliwością revertu.

## 10. Obsługa błędów

- **Błąd sieci (Pobieranie):** Wyświetl komponent `ErrorState` z przyciskiem "Spróbuj ponownie".
- **Błąd sieci (Toggle):**
  - Cofnij zmianę checkboxa w UI.
  - Wyświetl Toast (np. "Błąd połączenia. Nie zapisano postępu.").
- **Pusty plan:** Jeśli plan nie ma jednostek/ćwiczeń, wyświetl komunikat "Empty State" zachęcający do kontaktu z trenerem.

## 11. Kroki implementacji

1.  **API Service & Types:**
    - Zaktualizuj/Utwórz typy w `frontend/src/types/training-plans.ts`.
    - Dodaj metody do serwisu API (lub w `useClientPlans.ts`) do obsługi endpointów GET i PATCH.
2.  **Composable Logic:**
    - Zaimplementuj `useClientPlans` z logiką pobierania i optymistycznym update'em.
3.  **Komponenty UI (Dół-Góra):**
    - Stwórz `ExerciseItem.vue` (z obsługą slotów lub propsów dla detali). Zadbaj o style sticky i grid.
    - Stwórz `ExerciseList.vue` z logiką akordeonu (zarządzanie `activeId`).
    - Stwórz `UnitSelector.vue`.
4.  **Główny Widok:**
    - Stwórz `ClientPlanExecutionView.vue`.
    - Połącz composable z widokiem.
    - Obsłuż stany ładowania i błędów.
5.  **Routing:**
    - Dodaj wpis w `router/index.ts` dla ścieżki `/client/plans/:id`.
6.  **Style & Polish:**
    - Dostosuj typografię (duże cyfry dla parametrów).
    - Przetestuj na widoku mobilnym w DevTools.
