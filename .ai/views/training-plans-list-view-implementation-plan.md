# Plan implementacji widoku Lista Planów Treningowych

## 1. Przegląd
Widok "Lista Planów Treningowych" służy jako główne centrum zarządzania dla Trenera. Umożliwia przeglądanie wszystkich planów treningowych przypisanych do podopiecznych, filtrowanie ich według statusu (Aktywne/Zarchiwizowane) oraz inicjowanie procesu tworzenia nowego planu. Jest to punkt wejścia do szczegółowej edycji planów.

## 2. Routing widoku
- **Ścieżka:** `/trainer/plans`
- **Nazwa trasy:** `TrainerPlansList`
- **Wymagane uprawnienia:** Rola `TRAINER`

## 3. Struktura komponentów
```text
TrainingPlansView (Page)
├── PageHeader
│   ├── Title
│   └── CreatePlanButton (Trigger Modal)
├── PlanStatusTabs (Filter: Active | Archived)
├── PlanFilters (Optional: Client Search)
├── PlansGrid (List Container)
│   ├── EmptyState (if no plans)
│   └── PlanCard (Repeated)
│       ├── PlanHeader (Name, Status Badge)
│       ├── ClientInfo (Avatar/Name)
│       └── PlanFooter (Last Modified, Context Menu)
└── CreatePlanModal (Dialog)
    └── CreatePlanForm
        ├── PlanNameInput
        ├── ClientSelect (Dropdown from API)
        └── DescriptionInput
```

## 4. Szczegóły komponentów

### `TrainingPlansView` (Smart Component)
- **Opis:** Główny kontener widoku. Odpowiada za pobieranie danych z API, zarządzanie stanem filtrów (zakładki) i widocznością modala.
- **Główne elementy:** `PageHeader`, `PlanStatusTabs`, `PlansGrid`, `CreatePlanModal`.
- **Obsługiwane interakcje:**
  - Zmiana zakładki (aktualizacja filtru statusu).
  - Otwarcie modala tworzenia planu.
  - Obsługa zdarzenia utworzenia planu (odświeżenie listy).
- **Typy:** `TrainingPlan[]` (lista), `PlanStatus` (enum).

### `PlanStatusTabs`
- **Opis:** Komponent przełączający widok między planami aktywnymi a zarchiwizowanymi.
- **Propsy:**
  - `modelValue`: `PlanStatus` (ACTIVE | ARCHIVED).
- **Obsługiwane zdarzenia:**
  - `update:modelValue`: Emituje nowy status po kliknięciu.

### `PlansGrid`
- **Opis:** Komponent prezentacyjny wyświetlający siatkę kart lub stan pusty.
- **Propsy:**
  - `plans`: `TrainingPlan[]` - lista planów do wyświetlenia.
  - `isLoading`: `boolean`.
- **Główne elementy:** Pętla `v-for` renderująca `PlanCard`, komponent `Skeleton` lub `Spinner` podczas ładowania.

### `PlanCard`
- **Opis:** Karta reprezentująca pojedynczy plan treningowy.
- **Propsy:**
  - `plan`: `TrainingPlan` (DTO).
- **Główne elementy:**
  - Nazwa planu (nagłówek).
  - Imię i nazwisko klienta (sekcja informacyjna).
  - Data ostatniej modyfikacji (sformatowana).
  - Badge statusu (opcjonalnie, jeśli widoczne są wszystkie).
- **Obsługiwane interakcje:**
  - Kliknięcie w kartę: Przekierowanie do `/trainer/plans/:id` (Edycja planu).

### `CreatePlanModal`
- **Opis:** Modal zawierający formularz tworzenia nowego planu.
- **Propsy:**
  - `isOpen`: `boolean`.
- **Zarządzanie stanem:** Wewnętrzny stan formularza (`name`, `clientId`, `description`).
- **Główne elementy:**
  - `BaseModal` (wrapper).
  - `BaseInput` (nazwa, opis).
  - `ClientSelect` (custom select pobierający klientów).
- **Obsługiwana walidacja:**
  - `name`: Wymagane, min. 3 znaki.
  - `clientId`: Wymagane (musi być wybrany z listy).
- **Obsługiwane zdarzenia:**
  - `close`: Zamknięcie modala.
  - `success`: Po pomyślnym utworzeniu (przekazuje utworzony obiekt).

## 5. Typy

```typescript
// Enums
export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

// DTOs (Backend response structures)
export interface TrainingPlanDTO {
  id: string;
  name: string;
  status: PlanStatus;
  clientId: string; // UUID
  clientName?: string; // Może wymagać zmapowania lub backend zwraca "flattened"
  createdAt: string;
  updatedAt: string;
}

export interface ClientSimpleDTO {
  id: string;
  name: string;
  email: string;
}

// Form Models
export interface CreatePlanForm {
  name: string;
  clientId: string;
  description?: string;
}

// ViewModel (Frontend representation)
export interface TrainingPlanViewModel extends TrainingPlanDTO {
  lastModifiedFormatted: string;
  clientAvatarInitials: string;
}
```

## 6. Zarządzanie stanem
Zalecane użycie composable `useTrainingPlans` (lokalnie lub w Pinia Store, jeśli dane mają być współdzielone), który dostarczy:
- `plans`: Ref<TrainingPlan[]>
- `isLoading`: Ref<boolean>
- `filterStatus`: Ref<PlanStatus>
- `fetchPlans(status)`: Funkcja async.
- `createPlan(data)`: Funkcja async.
- `fetchClients()`: Funkcja do pobrania listy klientów do selecta.

## 7. Integracja API

### Pobieranie planów
- **Endpoint:** `GET /training-plans`
- **Parametry:** `status` (ACTIVE/ARCHIVED), opcjonalnie `clientId`.
- **Odpowiedź:** `TrainingPlanDTO[]`.

### Pobieranie klientów (do formularza)
- **Endpoint:** `GET /trainer/clients`
- **Odpowiedź:** `ClientSimpleDTO[]`.

### Tworzenie planu
- **Endpoint:** `POST /training-plans`
- **Body:**
  ```json
  {
    "name": "Siła - Cykl 1",
    "clientId": "uuid...",
    "description": "Notatki..."
  }
  ```
- **Odpowiedź:** `TrainingPlanDTO` (201 Created).

## 8. Interakcje użytkownika
1. **Wejście na stronę:** Automatyczne pobranie listy planów o statusie `ACTIVE`.
2. **Przełączenie zakładki:** Kliknięcie "Zarchiwizowane" -> przeładowanie listy z parametrem `status=ARCHIVED`.
3. **Kliknięcie "Utwórz plan":** Otwiera modal.
4. **Wypełnienie formularza:**
   - Użytkownik wpisuje nazwę.
   - Wybiera klienta z dropdownu (lista ładowana przy otwarciu).
   - Klika "Zapisz".
5. **Zapis planu (Sukces):**
   - Modal się zamyka.
   - Wyświetla się toast "Plan utworzony".
   - Lista planów jest odświeżana.
   - (Opcjonalnie) Automatyczne przekierowanie do edycji nowo utworzonego planu.
6. **Kliknięcie w kafelek planu:** Przekierowanie routera do widoku szczegółowego (`/trainer/plans/{uuid}`).

## 9. Warunki i walidacja
- **Formularz tworzenia:**
  - Przycisk "Utwórz" jest nieaktywny (disabled), dopóki pola `name` i `clientId` nie są wypełnione.
  - Pole `clientId` musi być wybranym, istniejącym ID klienta (nie sam tekst).
- **Lista planów:**
  - Jeśli API zwróci pustą tablicę, wyświetla się komponent `EmptyState` z zachętą do utworzenia planu.

## 10. Obsługa błędów
- **Błąd pobierania listy:** Wyświetlenie komunikatu błędu w miejscu listy (lub toast) z przyciskiem "Spróbuj ponownie".
- **Błąd tworzenia planu:**
  - Walidacja 400 (np. zły enum): Wyświetlenie błędu pod polem formularza.
  - Błąd serwera 500: Toast z komunikatem "Nie udało się utworzyć planu. Spróbuj później."
- **Brak klientów:** Jeśli trener nie ma klientów, dropdown w modalu powinien wyświetlić informację "Brak przypisanych klientów" lub zablokować tworzenie planu z odpowiednim komunikatem.

## 11. Kroki implementacji

1.  **Przygotowanie Typów i API:**
    - Zdefiniowanie interfejsów w `src/types/training-plans.ts`.
    - Dodanie metod do serwisu API (`api/trainingPlans.ts` i `api/trainer.ts` dla klientów).
2.  **Stworzenie Store/Composable:**
    - Implementacja `useTrainingPlans` do obsługi logiki pobierania i filtrowania.
3.  **Implementacja Komponentów UI (Atomic):**
    - Stworzenie `PlanCard.vue` (stylizacja kafelka).
    - Stworzenie `PlanStatusTabs.vue`.
4.  **Implementacja Modala Tworzenia:**
    - Stworzenie `CreatePlanModal.vue`.
    - Podpięcie pobierania listy klientów wewnątrz modala lub przekazanie ich jako prop.
    - Obsługa walidacji formularza.
5.  **Złożenie Widoku Głównego:**
    - Utworzenie `TrainingPlansView.vue`.
    - Połączenie komponentów i stanu.
    - Obsługa routingu do szczegółów.
6.  **Testy Manualne:**
    - Weryfikacja filtrowania (Active/Archived).
    - Weryfikacja tworzenia planu i walidacji.
    - Sprawdzenie responsywności (Desktop/Mobile).
