# Plan implementacji widoku Katalogu Trenerów (Trainer Directory)

## 1. Przegląd

Widok ten służy do prezentacji publicznie dostępnych profili trenerów. Umożliwia użytkownikom przeglądanie listy trenerów w formie siatki (grid), filtrowanie wyników po mieście i specjalizacji oraz dynamiczne ładowanie kolejnych wyników (infinite scroll). Głównym celem jest ułatwienie znalezienia odpowiedniego trenera.

## 2. Routing widoku

- **Ścieżka:** `/trainers`
- **Nazwa trasy:** `trainers-list`
- **Dostęp:** Publiczny (nie wymaga logowania)

### Punkty wejścia (Nawigacja)

- **Strona Główna (`/`):** Kliknięcie przycisku "Znajdź trenera" w sekcji Hero (zgodnie z planem `home-page-view-implementation-plan.md`).
- **Pasek Nawigacji (Navbar):** Link "Trenerzy" dostępny w menu głównym (zarówno dla użytkowników niezalogowanych, jak i zalogowanych klientów).

## 3. Struktura komponentów

```text
TrainerDirectoryView (Views/TrainerDirectoryView.vue)
├── TrainerDirectoryLayout (Layout wrapper)
│   ├── TrainerFiltersSidebar (Komponent filtrów - Desktop: Sidebar, Mobile: Drawer/Sheet)
│   │   ├── Input (shadcn - City search)
│   │   └── Select/Combobox (shadcn - Specialization filter)
│   └── TrainerListSection (Sekcja główna)
│       ├── TrainerList (Grid container)
│       │   ├── TrainerCard (Pojedyncza karta trenera)
│       │   │   ├── Avatar/Image
│       │   │   ├── Badge (Specjalizacje)
│       │   │   └── Button (Link do szczegółów)
│       │   └── TrainerCardSkeleton (Stan ładowania)
│       └── InfiniteScrollTrigger (Element detekcji końca listy - Sentinel)
```

## 4. Szczegóły komponentów

### `TrainerDirectoryView`

- **Opis:** Główny widok integrujący logikę pobierania danych z układem strony.
- **Główny element:** `div` (kontener layoutu).
- **Zadania:** Inicjalizacja pobierania danych, obsługa stanu filtrów.

### `TrainerFiltersSidebar`

- **Opis:** Panel boczny zawierający kontrolki do filtrowania listy.
- **Elementy:**
  - `Input` (shadcn) - pole tekstowe dla parametru `city`.
  - `Select` lub `Combobox` (shadcn) - wybór `specializationId`.
  - `Button` - przycisk "Wyczyść filtry".
- **Interakcje:** Emituje zdarzenie zmiany filtrów (`update:filters`).
- **Props:**
  - `availableSpecializations`: `SpecializationOption[]` - lista dostępnych specjalizacji do wyboru.
  - `currentFilters`: `TrainerFiltersState` - aktualny stan filtrów.

### `TrainerList`

- **Opis:** Kontener wyświetlający siatkę kart trenerów.
- **Elementy:** Grid CSS (Tailwind: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Props:**
  - `trainers`: `TrainerSummary[]` - lista trenerów do wyświetlenia.
  - `isLoading`: `boolean` - czy trwa ładowanie (pierwsze).
  - `isFetchingNextPage`: `boolean` - czy trwa doczytywanie (infinite scroll).

### `TrainerCard`

- **Opis:** Prezentuje skrócone informacje o trenerze.
- **Elementy:**
  - `Card`, `CardHeader`, `CardContent`, `CardFooter` (shadcn).
  - `Avatar` - zdjęcie profilowe.
  - `Badge` - lista specjalizacji.
- **Props:**
  - `trainer`: `TrainerSummary` - obiekt danych trenera.
- **Akcje:** Kliknięcie w kartę lub przycisk przenosi do `/trainers/:id`.

### `InfiniteScrollTrigger`

- **Opis:** Niewidoczny element na dole listy wykorzystujący `IntersectionObserver`.
- **Zdarzenia:** Emituje `loadMore` gdy pojawi się w viewport.
- **Props:**
  - `enabled`: `boolean` - czy obserwator ma być aktywny (np. false gdy załadowano wszystko).

## 5. Typy

### Modele Domenowe (Frontend)

```typescript
// Reprezentacja trenera na liście
export interface TrainerSummary {
  id: string
  name: string
  city: string
  description: string
  profilePictureUrl: string
  specializations: SpecializationBadge[]
}

// Reprezentacja specjalizacji (uproszczona dla badge/select)
export interface SpecializationBadge {
  id: string
  name: string
}

// Opcja do selecta filtrów
export interface SpecializationOption {
  value: string // UUID
  label: string
}
```

### Stan Widoku i Filtry

```typescript
export interface TrainerFiltersState {
  city: string
  specializationId: string | null
}

export interface TrainersPaginationState {
  currentPage: number
  limit: number
  total: number
  hasMore: boolean
}
```

### DTO (Zgodne z API)

```typescript
export interface GetTrainersQueryParams {
  page?: number
  limit?: number
  city?: string
  specializationId?: string
}

export interface GetTrainersResponse {
  data: TrainerSummary[] // Zmapowane z backendowego DTO
  meta: {
    total: number
    page: number
    limit: number
  }
}
```

## 6. Zarządzanie stanem

Zalecane użycie **Composable** `useTrainers` (lokalne zarządzanie stanem widoku, bez konieczności globalnego store'a Pinia, chyba że chcemy cache'ować wyniki).

### `useTrainers` Composable

- **State:**
  - `trainers`: `Ref<TrainerSummary[]>`
  - `filters`: `Reactive<TrainerFiltersState>`
  - `isLoading`: `Ref<boolean>` (stan początkowy)
  - `isFetchingMore`: `Ref<boolean>` (stan doczytywania)
  - `error`: `Ref<string | null>`
  - `pagination`: `Ref<TrainersPaginationState>`
- **Actions:**
  - `fetchTrainers(reset: boolean)`: Pobiera dane. Jeśli `reset` jest true, czyści listę i ustawia stronę na 1 (używane przy zmianie filtrów).
  - `loadMore()`: Inkrementuje stronę i woła `fetchTrainers(false)`.
  - `updateFilters(newFilters)`: Aktualizuje stan i woła `fetchTrainers(true)`.

## 7. Integracja API

**Endpoint:** `GET /trainers`

- **Biblioteka:** `axios` (skonfigurowana instancja z `src/lib/api.ts`).
- **Mapowanie:** Należy przekształcić parametry z `filters` na query string.
  - Puste stringi w filtrach powinny być pomijane w zapytaniu.
- **Cache:** Opcjonalnie wykorzystanie Vue Query (TanStack Query) dla lepszego zarządzania cache i stanem ładowania (`useInfiniteQuery`), jeśli jest w stacku (wg zasad `frontend.mdc` - "Consider TanStack Query"). Jeśli nie, standardowy `fetch` w composable.

## 8. Interakcje użytkownika

1. **Wejście na stronę:**
   - Wyświetlenie skeletonów.
   - Pobranie pierwszej strony wyników (domyślny limit: 10).
2. **Wpisanie miasta w filtrze:**
   - Debounce (np. 500ms).
   - Reset listy i paginacji.
   - Pobranie nowych wyników.
3. **Wybór specjalizacji:**
   - Natychmiastowe przeładowanie listy (reset + fetch).
4. **Przewinięcie do dołu (Infinite Scroll):**
   - Wykrycie elementu `Sentinel`.
   - Sprawdzenie czy `isLoading` jest false i czy `hasMore` jest true.
   - Pobranie kolejnej strony i doklejenie do listy (`push`).
5. **Kliknięcie w kartę:**
   - Przekierowanie routera do widoku szczegółów.

## 9. Warunki i walidacja

- **Input Miasta:**
  - Oczyszczanie whitespace (trim).
  - Opcjonalnie: minimalna długość 2-3 znaki przed wysłaniem zapytania (chyba że API obsługuje puste/krótkie stringi).
- **Select Specjalizacji:**
  - Musi przesyłać poprawny UUID lub być pomijany (null/undefined) jeśli wybrano "Wszystkie".
- **Paginacja:**
  - Blokada `loadMore` jeśli `meta.total <= currentData.length`.

## 10. Obsługa błędów

- **Błąd pobierania listy:**
  - Wyświetlenie komunikatu o błędzie w miejscu listy (np. komponent `ErrorState` z przyciskiem "Spróbuj ponownie").
  - Toast notification (opcjonalnie).
- **Pusta lista:**
  - Wyświetlenie komponentu `EmptyState` ("Nie znaleziono trenerów spełniających kryteria").

## 11. Kroki implementacji

1. **Przygotowanie API:**
   - Upewnij się, że funkcja w `src/lib/api/trainers.ts` obsługuje parametry `GetTrainersQueryParams`.
   - Jeśli brak, dodać funkcję pobierania listy specjalizacji (dla filtra).
2. **Stworzenie Typów:**
   - Utworzenie plików definicji typów w `src/types/trainer.ts`.
3. **Implementacja Composable `useTrainers`:**
   - Logika pobierania, paginacji, debounce dla filtrów.
4. **Budowa Komponentów UI (Atomic):**
   - `TrainerCard.vue` + Skeleton.
   - `TrainerFiltersSidebar.vue` (z użyciem shadcn Select/Input).
5. **Implementacja Widoku Głównego:**
   - Złożenie layoutu w `TrainerDirectoryView.vue`.
   - Podpięcie `useTrainers`.
   - Obsługa `InfiniteScroll` (np. przy użyciu `useIntersectionObserver` z `vueuse`).
6. **Testy Manualne:**
   - Weryfikacja filtrowania po mieście.
   - Weryfikacja filtrowania po specjalizacji.
   - Sprawdzenie płynności ładowania kolejnych stron.
   - Responsywność (Mobile vs Desktop).
