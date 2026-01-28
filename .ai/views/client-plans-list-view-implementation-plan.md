# Plan implementacji widoku Listy Planów Klienta

## 1. Przegląd

Widok "Moje Plany" dla klienta (`ClientPlansView`) pozwala użytkownikowi na przeglądanie wszystkich przypisanych do niego planów treningowych. Głównym celem jest umożliwienie szybkiego dostępu do aktualnie realizowanych planów oraz wglądu w historię (archiwum). Widok realizuje wymagania US-010, oferując podział na plany aktywne i archiwalne.

## 2. Routing widoku

- **Ścieżka:** `/client/plans`
- **Nazwa trasy:** `ClientPlans`
- **Layout:** `AppLayout`
- **Dostęp:** Tylko dla zalogowanych użytkowników z rolą `CLIENT`.
- **Punkt wejścia:**
  - Główna nawigacja (AppLayout) - pozycja "Moje Plany".
  - Dashboard - widget "Aktywny Plan" (przycisk "Zobacz wszystkie" lub kliknięcie w tytuł sekcji).

## 3. Struktura komponentów

Widok zostanie zbudowany w oparciu o następującą hierarchię komponentów:

- `ClientPlansView.vue` (Główny kontener widoku)
  - `PageHeader.vue` (Nagłówek strony z tytułem)
  - `PlanStatusTabs.vue` (Komponent zakładek: Aktywne / Archiwalne)
    - `PlanList.vue` (Generyczna lista/grid planów)
      - `PlanTile.vue` (Pojedynczy kafelek planu)
        - `PlanStatusBadge.vue` (Status wizualny)
      - `EmptyState.vue` (Widok braku danych)
  - `LoadingSkeleton.vue` (Stan ładowania)
  - `ErrorAlert.vue` (Obsługa błędów)

## 4. Szczegóły komponentów

### `ClientPlansView.vue`

- **Opis:** Główny widok orkiestrujący pobieranie danych i zarządzanie stanem wybranej zakładki (Status).
- **Główne elementy:** `div` (kontener), `Tabs` (z shadcn-vue).
- **Obsługiwane interakcje:** Zmiana zakładki (powoduje przeładowanie listy lub filtrowanie lokalne).
- **Zarządzanie stanem:** Przechowuje aktualnie wybrany tab (`ACTIVE` | `ARCHIVED`).
- **Propsy:** Brak (top-level view).

### `PlanStatusTabs.vue`

- **Opis:** Wrapper na komponent `Tabs` z shadcn-vue, sterujący wyświetlaniem odpowiedniej listy.
- **Główne elementy:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
- **Obsługiwane interakcje:** Kliknięcie w tab "Aktywne" lub "Archiwum".
- **Propsy:**
  - `activeTab`: string
  - `counts`: { active: number, archived: number } (opcjonalnie, liczzniki na badgy)

### `PlanList.vue`

- **Opis:** Kontener układający kafelki planów w responsywnym gridzie.
- **Główne elementy:** Grid CSS (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Propsy:**
  - `plans`: `ITrainingPlan[]` - lista planów do wyświetlenia.
  - `isLoading`: boolean.

### `PlanTile.vue`

- **Opis:** Karta prezentująca pojedynczy plan treningowy.
- **Główne elementy:** `Card` (shadcn-vue), Tytuł planu, Status, Data utworzenia/aktualizacji.
- **Obsługiwane interakcje:** Kliknięcie w kartę -> nawigacja do `/client/plans/{planId}`.
- **Typy:** Wymaga obiektu `ITrainingPlan`.
- **Propsy:**
  - `plan`: `ITrainingPlan` (wymagane).
- **Wyświetlane dane:**
  - Nazwa planu.
  - Status (Badge).
  - Opis (skrócony/truncate).
  - Data ostatniej modyfikacji.
  - _Uwaga:_ DTO obecnie zwraca `trainerId`, ale nie `trainerName`. Na tym etapie nie wyświetlamy nazwy trenera, chyba że zostanie pobrana osobno.

## 5. Typy

Na podstawie `training-plans-types.md` oraz DTO backendowego:

```typescript
// frontend/src/types/training-plans.ts

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface ITrainingPlan {
  id: string
  trainerId: string // UUID
  clientId: string // UUID
  name: string
  description: string | null
  status: PlanStatus
  createdAt: string // ISO Date
  updatedAt: string // ISO Date
}

// Typy pomocnicze dla widoku
export interface PlanFilters {
  status?: PlanStatus
}
```

## 6. Zarządzanie stanem

Wykorzystamy composable `useClientPlans` (zamiast dużego store'a Pinia, chyba że dane są potrzebne globalnie).

```typescript
// frontend/src/composables/useClientPlans.ts

export function useClientPlans() {
  const plans = ref<ITrainingPlan[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Pobieranie planów z możliwością filtrowania po statusie
  const fetchPlans = async (status?: PlanStatus) => {
    // Implementacja wywołania API
  }

  return {
    plans,
    isLoading,
    error,
    fetchPlans,
  }
}
```

## 7. Integracja API

Integracja z endpointem: `GET /training-plans`

- **URL:** `/training-plans`
- **Parametry query:** `status` (ACTIVE | ARCHIVED). Klient nie musi wysyłać `clientId` (backend pobiera z tokenu).
- **Typ odpowiedzi:** `ITrainingPlan[]` (tablica nagłówków planów).
- **Przykład wywołania (axios/fetch):**
  ```typescript
  api.get<ITrainingPlan[]>('/training-plans', { params: { status: 'ACTIVE' } })
  ```

## 8. Interakcje użytkownika

1.  **Wejście na widok:** Automatyczne pobranie listy planów o statusie `ACTIVE`.
2.  **Przełączenie zakładki "Archiwum":** Pobranie listy planów o statusie `ARCHIVED` (lub przefiltrowanie, jeśli pobrano wszystkie).
    - _Decyzja:_ Ze względu na potencjalną ilość danych historycznych, pobieramy dane per zakładka (API call przy zmianie taba).
3.  **Kliknięcie w kafelek planu:** Przekierowanie routera do `/client/plans/:id`.
4.  **Ładowanie:** Wyświetlenie szkieletu (Skeleton loader) w miejscu listy.
5.  **Błąd:** Wyświetlenie komunikatu o błędzie z przyciskiem "Spróbuj ponownie".

## 9. Warunki i walidacja

- **Pusty stan:** Jeśli API zwróci pustą tablicę, wyświetlamy komponent `EmptyState` z komunikatem "Nie masz jeszcze żadnych aktywnych planów" (lub odpowiednio dla archiwum).
- **Sortowanie:** Frontend powinien posortować plany po `updatedAt` (malejąco), aby najnowsze były na górze, chyba że API to gwarantuje (warto to wymusić na froncie dla pewności).

## 10. Obsługa błędów

- **401 Unauthorized:** Automatyczne wylogowanie (obsługiwane przez interceptor axios).
- **Błąd sieci/serwera:** Wyświetlenie `ErrorAlert` nad listą planów. Użytkownik nie może wejść w interakcję z listą.

## 11. Kroki implementacji

1.  **Przygotowanie typów:** Utworzenie pliku `frontend/src/types/training-plans.ts` i zdefiniowanie interfejsów zgodnych z API.
2.  **Serwis API:** Stworzenie/aktualizacja serwisu (np. `TrainingPlansService`) do obsługi zapytania `GET /training-plans`.
3.  **Composable:** Implementacja `useClientPlans.ts` z logiką pobierania danych.
4.  **Komponenty UI - Tile:** Implementacja `PlanTile.vue` z użyciem komponentu Card (shadcn-vue).
5.  **Komponenty UI - List:** Implementacja `PlanList.vue` obsługującego grid i stan ładowania.
6.  **Widok Główny:** Implementacja `ClientPlansView.vue`, złożenie zakładek (Tabs) i podpięcie logiki z composable.
7.  **Routing:** Dodanie ścieżki w `router/index.ts`.
8.  **Nawigacja:** Aktualizacja `AppLayout.vue` o link do `/client/plans` (tylko dla roli CLIENT).
9.  **Weryfikacja:** Test manualny przełączania zakładek i nawigacji do szczegółów.

**Uwaga do US-010 (Foldery):** Obecne API i model danych (`TrainingPlanResponseDto`) nie zwracają informacji o "Pakiecie" lub "Folderze". W tej iteracji "podział na pakiety" zrealizowany jest poprzez logiczny podział na statusy (Aktywne/Archiwalne). Grupowanie w foldery wymagałoby zmian w API (dodanie pola `folderId` lub `packageId`).
