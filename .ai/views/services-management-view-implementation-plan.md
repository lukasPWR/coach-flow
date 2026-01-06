# Plan implementacji widoku Zarządzania Usługami

## 1. Przegląd

Widok Zarządzania Usługami (`ServicesView`) umożliwia trenerom definiowanie i edytowanie ich oferty treningowej. Trener może przeglądać listę swoich aktywnych usług, dodawać nowe wybierając z predefiniowanych typów, edytować ceny oraz usuwać usługi. Widok ten jest kluczowy dla konfiguracji profilu trenera przed rozpoczęciem przyjmowania rezerwacji.

## 2. Routing widoku

- **Ścieżka:** `/trainer/services`
- **Nazwa trasy:** `TrainerServices`
- **Wymagane uprawnienia:** Rola `TRAINER` (wymaga `AuthGuard`).

## 3. Struktura komponentów

Widok zostanie zbudowany w oparciu o komponenty biblioteki `shadcn-vue`.

- `ServicesView.vue` (Główny kontener widoku)
  - `ServicesHeader` (Tytuł i przycisk "Dodaj usługę")
  - `ServicesList` (Tabela/Lista usług)
    - `ServiceActionsMenu` (Dropdown: Edytuj, Usuń)
  - `ServiceFormDialog` (Modal do tworzenia i edycji usługi)
  - `DeleteServiceAlertDialog` (Modal potwierdzenia usunięcia)

## 4. Szczegóły komponentów

### `ServicesView.vue`
- **Opis:** Główny widok orkiestrujący pobieranie danych i zarządzający stanem modali.
- **Główne elementy:** `Layout`, `Loader` (podczas pobierania danych).
- **Logika:**
  - Przy montowaniu (onMounted) inicjuje pobranie `serviceTypes` oraz `services`.
  - Przekazuje dane do komponentów dzieci.

### `ServicesList.vue`
- **Opis:** Prezentuje listę usług w formie tabeli. Mapuje `serviceTypeId` na czytelną nazwę korzystając z pobranych typów usług.
- **Główne elementy:** `Table` (shadcn-vue), `Badge` (dla ceny/czasu).
- **Propsy:**
  - `services`: `Service[]`
  - `serviceTypesMap`: `Record<string, string>` (mapa ID -> Nazwa typu)
  - `isLoading`: `boolean`
- **Zdarzenia:**
  - `@edit`: `(service: Service) => void`
  - `@delete`: `(service: Service) => void`

### `ServiceFormDialog.vue`
- **Opis:** Formularz w modalu obsługujący zarówno tworzenie jak i edycję.
- **Główne elementy:**
  - `Dialog` (shadcn-vue)
  - `Form` (vee-validate/zod)
  - `Select` (wybór typu usługi - zablokowany w trybie edycji, jeśli wymagane biznesowo, lub dostępny)
  - `Input` (Cena)
  - `Input` (Czas trwania - edytowalny, 15-180 minut, wielokrotność 15)
- **Propsy:**
  - `open`: `boolean`
  - `serviceToEdit`: `Service | null`
  - `serviceTypes`: `ServiceType[]`
  - `isSubmitting`: `boolean`
- **Zdarzenia:**
  - `@update:open`: `(value: boolean) => void`
  - `@submit`: `(formData: CreateServicePayload) => void`
- **Walidacja:**
  - `serviceTypeId`: wymagany UUID.
  - `price`: wymagana liczba, min 0.
  - `durationMinutes`: wymagana liczba, min 15, max 180, wielokrotność 15.

### `DeleteServiceAlertDialog.vue`
- **Opis:** Standardowe potwierdzenie akcji destrukcyjnej.
- **Główne elementy:** `AlertDialog` (shadcn-vue).
- **Propsy:**
  - `open`: `boolean`
  - `isDeleting`: `boolean`
- **Zdarzenia:**
  - `@confirm`: `() => void`
  - `@cancel`: `() => void`

## 5. Typy

Należy zdefiniować typy w `frontend/src/types/services.ts`.

```typescript
// Odzwierciedlenie ServiceType z backendu
export interface ServiceType {
  id: string;
  name: string;
}

// Odzwierciedlenie Service z backendu
export interface Service {
  id: string;
  trainerId: string;
  serviceTypeId: string;
  price: number;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// Typ dla formularza
export interface ServiceFormValues {
  serviceTypeId: string;
  price: number;
  durationMinutes: number; // 15-180 minut, wielokrotność 15
}
```

## 6. Zarządzanie stanem

Zalecane użycie composables do oddzielenia logiki API od widoku.

### `composables/useServices.ts`
- **State:** `services` (Ref<Service[]>), `isLoading` (Ref<boolean>).
- **Methods:**
  - `fetchServices()`: GET `/services`
  - `createService(data: ServiceFormValues)`: POST `/services`
  - `updateService(id: string, data: Partial<ServiceFormValues>)`: PATCH `/services/:id`
  - `deleteService(id: string)`: DELETE `/services/:id`

### `composables/useServiceTypes.ts`
- **State:** `serviceTypes` (Ref<ServiceType[]>).
- **Methods:**
  - `fetchServiceTypes()`: GET `/service-types`
- **Computed:**
  - `serviceTypesMap`: ComputedRef<Record<string, string>> - ułatwia szybkie mapowanie ID na nazwę w tabeli.

## 7. Integracja API

Integracja z backendem zgodnie z `api-plan.md`.

1.  **Pobranie typów usług:**
    -   `GET /service-types`
    -   Response: `ServiceType[]`
2.  **Pobranie usług trenera:**
    -   `GET /services`
    -   Response: `Service[]`
3.  **Utworzenie usługi:**
    -   `POST /services`
    -   Body: `{ serviceTypeId: string, price: number, durationMinutes: number }`
4.  **Edycja usługi:**
    -   `PATCH /services/:id`
    -   Body: `{ price?: number, durationMinutes?: number }` (Typ usługi zazwyczaj jest niezmienny).
5.  **Usunięcie usługi:**
    -   `DELETE /services/:id`

## 8. Interakcje użytkownika

1.  **Wejście na stronę:** Ładowanie listy usług i typów. Wyświetlenie szkieletów (skeleton loader) lub spinnera.
2.  **Dodawanie usługi:**
    -   Kliknięcie "Dodaj usługę".
    -   Otwarcie modala.
    -   Wypełnienie formularza (wybór typu, wpisanie ceny).
    -   Zatwierdzenie.
    -   Zamknięcie modala, odświeżenie listy (lub optymistyczna aktualizacja).
3.  **Edycja usługi:**
    -   Kliknięcie ikony edycji przy usłudze.
    -   Otwarcie modala z wypełnionymi danymi.
    -   Zmiana ceny.
    -   Zatwierdzenie.
4.  **Usuwanie usługi:**
    -   Kliknięcie ikony kosza.
    -   Wyświetlenie `AlertDialog` z pytaniem "Czy na pewno chcesz usunąć tę usługę?".
    -   Potwierdzenie -> usunięcie API -> usunięcie z listy.

## 9. Warunki i walidacja

-   **Formularz:**
    -   `serviceTypeId`: Pole wymagane.
    -   `price`: Pole wymagane, liczba dodatnia (min 0).
    -   `durationMinutes`: Pole wymagane, liczba 15-180, wielokrotność 15.
-   **Widok:**
    -   Jeśli lista usług jest pusta, wyświetl komponent `EmptyState` ("Nie dodałeś jeszcze żadnych usług").

## 10. Obsługa błędów

-   **Błąd pobierania danych:** Wyświetlenie komunikatu Toast ("Nie udało się pobrać listy usług").
-   **Błąd zapisu/edycji:** Wyświetlenie komunikatu Toast z treścią błędu z backendu (np. walidacja). Formularz pozostaje otwarty.
-   **Błąd usuwania:** Wyświetlenie Toast ("Nie udało się usunąć usługi").

## 11. Kroki implementacji

1.  **Przygotowanie typów:** Utworzenie pliku `src/types/services.ts` i `src/types/service-types.ts`.
2.  **Implementacja API:** Dodanie metod do serwisu API lub stworzenie nowych composables (`useServices`, `useServiceTypes`).
3.  **ServiceFormDialog:** Stworzenie komponentu formularza z walidacją. Domyślny czas trwania: 60 min, zakres: 15-180 min, wielokrotność 15.
4.  **ServicesList:** Implementacja tabeli wyświetlającej dane. Integracja mapowania nazw typów usług.
5.  **Integracja widoku:** Złożenie komponentów w `ServicesView.vue`. Obsługa stanów ładowania i błędów.
6.  **Routing:** Dodanie trasy w `router/index.ts`.
7.  **Testy manualne:** Weryfikacja przepływu CRUD w przeglądarce.

