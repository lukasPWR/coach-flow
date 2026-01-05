# Plan implementacji widoku Profil Trenera (Public Trainer Profile)

## 1. Przegląd

Widok publicznego profilu trenera ma na celu zaprezentowanie szczegółowych informacji o trenerze potencjalnym klientom. Umożliwia zapoznanie się z biogramem, specjalizacjami, ofertą usług oraz (docelowo) dostępnością w kalendarzu. Widok jest dostępny publicznie i nie wymaga logowania.

## 2. Routing widoku

- **Ścieżka:** `/trainer/:id`
  - _Uwaga:_ Choć UI Plan sugeruje `:slug`, dostępne API obsługuje obecnie pobieranie po `:id`. W pierwszej fazie implementacji użyjemy ID. W przyszłości można dodać obsługę "slug" dla lepszego SEO.
- **Nazwa trasy:** `TrainerProfile`

## 3. Struktura komponentów

Hierarchia komponentów dla widoku:

```
TrainerProfileView (Views)
├── LoadingState (Shared)
├── ErrorState (Shared)
├── TrainerProfileLayout (Layout - Grid 2 kolumny na desktop, 1 na mobile)
│   ├── LeftColumn
│   │   ├── TrainerHeader (Zdjęcie, Imię, Miasto, Specjalizacje)
│   │   ├── TrainerBio (Opis)
│   │   └── TrainerServicesList (Cennik i lista usług)
│   └── RightColumn (Sticky)
│       └── TrainerAvailabilityWidget (Kalendarz i CTA)
```

## 4. Szczegóły komponentów

### 1. `TrainerProfileView`

- **Opis:** Główny kontener widoku. Odpowiada za pobranie `id` z adresu URL, wywołanie API i zarządzanie stanem ładowania/błędu.
- **Główne elementy:** `div` (wrapper), `Suspense` (opcjonalnie) lub `v-if` na stan ładowania.
- **Obsługiwane zdarzenia:**
  - `onMounted`: Inicjalizacja pobierania danych.
- **Typy:** Brak propsów (widok routingowy).

### 2. `TrainerHeader`

- **Opis:** Sekcja nagłówkowa prezentująca kluczowe dane trenera.
- **Główne elementy:**
  - `img` (Avatar trenera z fallbackiem).
  - `h1` (Imię i nazwisko).
  - `p` (Miasto/Lokalizacja).
  - `div` z listą `Badge` (Specjalizacje).
- **Propsy:**
  - `trainer: TrainerProfileViewModel`

### 3. `TrainerBio`

- **Opis:** Komponent tekstowy wyświetlający opis trenera.
- **Główne elementy:** `article` lub `div` z tekstem.
- **Propsy:**
  - `description: string`

### 4. `TrainerServicesList`

- **Opis:** Lista oferowanych usług wraz z cenami i czasem trwania.
- **Główne elementy:**
  - `ul/li` lub `div` (lista kart).
  - Formatowanie ceny (PLN).
  - Formatowanie czasu (np. "60 min").
- **Propsy:**
  - `services: TrainerServiceViewModel[]`

### 5. `TrainerAvailabilityWidget`

- **Opis:** Komponent zawierający kalendarz dostępności. W tej fazie skupiamy się na integracji UI, dane dostępności mogą być mockowane lub puste, dopóki endpoint `/availabilities` nie zostanie zdefiniowany.
- **Główne elementy:**
  - Kalendarz (np. `v-calendar` lub własna implementacja).
  - Legenda (wolne/zajęte).
- **Propsy:**
  - `trainerId: string`

## 5. Typy

Należy zdefiniować następujące interfejsy w `frontend/src/types/trainer.ts` lub podobnym:

```typescript
// DTO z API (zgodne z odpowiedzią endpointu)
export interface TrainerProfileDto {
  id: string
  name: string
  city: string
  description: string
  profilePictureUrl: string
  specializations: Array<{
    id: string
    name: string
  }>
  services: Array<{
    id: string
    name: string
    price: number
    durationMinutes: number
  }>
}

// ViewModel (używany w komponentach, może rozszerzać DTO o pola pomocnicze UI)
export interface TrainerServiceViewModel {
  id: string
  name: string
  priceFormatted: string // np. "150.00 PLN"
  durationFormatted: string // np. "1h 30m"
}

export interface TrainerProfileViewModel extends Omit<TrainerProfileDto, 'services'> {
  services: TrainerServiceViewModel[]
  initials: string // Wyliczone z imienia i nazwiska dla awatara
}
```

## 6. Zarządzanie stanem

Zalecane użycie **Composable** (`useTrainerProfile`) do inkapsulacji logiki pobierania danych.

- **Stan:**
  - `trainer`: `Ref<TrainerProfileViewModel | null>`
  - `isLoading`: `Ref<boolean>`
  - `error`: `Ref<string | null>`
- **Hook:** `useTrainerProfile(trainerId: string)`

## 7. Integracja API

Integracja z endpointem `GET /trainers/:id`.

- **Metoda:** `GET`
- **URL:** `/api/trainers/${id}` (zależnie od konfiguracji `axios`/proxy).
- **Transformacja:** Dane z API (DTO) powinny zostać przetworzone na ViewModel (formatowanie waluty, czasu) przed przekazaniem do komponentów.

## 8. Interakcje użytkownika

1. **Wejście na stronę:**
   - Użytkownik wchodzi na `/trainer/123`.
   - Widzi loader (szkielet).
   - Po załadowaniu widzi pełny profil.
2. **Błąd ładowania:**
   - Jeśli ID nie istnieje (404), wyświetlany jest komunikat "Trener nie został znaleziony" z przyciskiem powrotu do katalogu.
   - Jeśli błąd sieci, przycisk "Spróbuj ponownie".

## 9. Warunki i walidacja

- **Walidacja ID:** ID w URL musi być niepuste.
- **Formatowanie danych:**
  - Cena: Zawsze 2 miejsca po przecinku, waluta PLN.
  - Czas: Konwersja minut na format czytelny dla człowieka (np. 60 min -> 1h).
- **Brak danych:**
  - Jeśli brak zdjęcia -> wyświetl placeholder z inicjałami.
  - Jeśli brak opisu -> sekcja ukryta lub komunikat "Brak opisu".

## 10. Obsługa błędów

- **404 Not Found:** Dedykowany widok błędu lub komponent wewnątrz widoku.
- **500 Server Error:** Toast notification lub error boundary.
- **Puste stany:** Obsługa braku usług lub specjalizacji (np. "Brak zdefiniowanych usług").

## 11. Kroki implementacji

1. **Przygotowanie typów:** Utworzenie plików definicji typów (`DTO` i `ViewModel`) w `frontend/src/types`.
2. **Warstwa API:** Implementacja metody `getTrainerById` w serwisie `frontend/src/lib/api/trainers.ts`.
3. **Composable:** Stworzenie `useTrainerProfile` w `frontend/src/composables`.
4. **Komponenty UI:**
   - Implementacja `TrainerHeader.vue` (z obsługą avatara).
   - Implementacja `TrainerServicesList.vue` (z formatowaniem cen).
   - Implementacja `TrainerBio.vue`.
   - Szkielet `TrainerAvailabilityWidget.vue`.
5. **Widok Główny:** Implementacja `TrainerDirectoryView.vue` (scaffold) i złożenie komponentów.
6. **Routing:** Dodanie trasy w `router/index.ts`.
7. **Stylowanie:** Dopracowanie responsywności (Grid/Flexbox) zgodnie z wytycznymi designu.
8. **Testy manualne:** Weryfikacja poprawności wyświetlania danych i obsługi błędnych ID.
