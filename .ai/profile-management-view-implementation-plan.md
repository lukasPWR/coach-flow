# Plan implementacji widoku Zarządzania Profilem Trenera

## 1. Przegląd

Widok zarządzania profilem (`/profile`) umożliwia trenerom przeglądanie oraz edycję ich publicznych danych profilowych. Jest to kluczowy element funkcjonalności, pozwalający na uzupełnienie informacji takich jak opis, miasto, zdjęcie profilowe oraz specjalizacje, co jest niezbędne do prezentowania oferty klientom. Widok obsługuje dwa tryby: podgląd (domyślny) oraz edycję.

## 2. Routing widoku

- **Ścieżka:** `/profile`
- **Dostępność:** Wymagane uwierzytelnienie (Rola: `TRAINER` - choć obecny `ProfilePage` jest dostępny dla każdego zalogowanego, pełna edycja dotyczy trenerów).
- **Plik widoku:** `src/views/ProfilePage.vue` (istniejący plik do rozbudowy).

## 3. Struktura komponentów

Hierarchia komponentów dla tego widoku:

```text
ProfilePage.vue (Container/Controller)
├── LoadingSpinner.vue (Opcjonalnie: stan ładowania)
├── TrainerProfileView.vue (Komponent prezentacyjny - Tryb odczytu)
│   └── Badge.vue (Wyświetlanie specjalizacji)
└── TrainerProfileForm.vue (Komponent formularza - Tryb edycji)
    ├── AvatarUpload.vue (lub Input URL w wersji MVP)
    ├── SpecializationSelect.vue (Select wielokrotnego wyboru)
    └── Button.vue (Akcje formularza)
```

## 4. Szczegóły komponentów

### `ProfilePage.vue` (Istniejący - do modyfikacji)

- **Opis:** Główny kontener zarządzający stanem widoku (podgląd vs edycja) oraz pobieraniem danych profilowych z API.
- **Główne elementy:**
  - Nagłówek z przyciskiem "Wyloguj" (już istnieje).
  - Przełącznik warunkowy (`v-if`) renderujący `TrainerProfileView` lub `TrainerProfileForm`.
- **Zarządzanie stanem:**
  - `profile`: Przechowuje pobrane dane trenera.
  - `isEditing`: Boolean, steruje trybem widoku.
  - `isLoading`: Boolean, stan ładowania danych.
- **Integracja API:**
  - `onMounted`: Wywołuje `GET /trainers/me`.

### `TrainerProfileView.vue` (Nowy)

- **Opis:** Komponent wyświetlający dane profilowe w czytelnej formie.
- **Props:**
  - `profile`: Obiekt typu `TrainerProfile` (wymagany).
- **Główne elementy:**
  - Sekcja nagłówkowa ze zdjęciem (Avatar) i podstawowymi danymi (Imię, Email - z obiektu user).
  - Sekcja szczegółów: Miasto, Opis.
  - Lista specjalizacji (wyświetlana jako tagi/badge).
  - Przycisk "Edytuj profil" (emituje zdarzenie do rodzica).
- **Obsługiwane zdarzenia:**
  - `edit`: Sygnalizuje chęć przejścia w tryb edycji.

### `TrainerProfileForm.vue` (Nowy)

- **Opis:** Formularz edycji danych profilowych oparty na `vee-validate` i `zod`.
- **Props:**
  - `initialData`: Obiekt typu `TrainerProfile` (do wypełnienia formularza).
- **Główne elementy:**
  - Pole tekstowe (Textarea) dla "Opis".
  - Input tekstowy dla "Miasto".
  - Input tekstowy (lub komponent uploadu) dla "Zdjęcie profilowe" (URL).
  - Multiselect (Combobox/Select) dla "Specjalizacje".
  - Przyciski "Zapisz" i "Anuluj".
- **Obsługiwana walidacja (Schema Zod):**
  - `description`: String, opcjonalny, max 500 znaków.
  - `city`: String, opcjonalny.
  - `profilePictureUrl`: String, poprawny URL (opcjonalnie).
  - `specializationIds`: Tablica stringów (UUID).
- **Obsługiwane zdarzenia:**
  - `submit(data: UpdateTrainerProfileDto)`: Przekazuje poprawne dane do zapisu.
  - `cancel`: Anuluje edycję.
- **Wymagania dodatkowe:** Komponent musi pobrać listę dostępnych specjalizacji (`GET /specializations`) przy montowaniu, aby zasilić select.

## 5. Typy

Należy zdefiniować (lub zaktualizować) typy w `src/types/trainer.ts`:

```typescript
// Reprezentacja pełnego profilu z API (GET /trainers/me)
export interface TrainerProfile {
  id: string
  userId: string
  description: string | null
  city: string | null
  profilePictureUrl: string | null
  // Relacje
  user: {
    name: string
    email: string
    role: string
  }
  specializations: Specialization[]
}

export interface Specialization {
  id: string
  name: string
}

// DTO do aktualizacji (PATCH /trainers/:id)
export interface UpdateTrainerProfileDto {
  description?: string
  city?: string
  profilePictureUrl?: string
  specializationIds?: string[]
}
```

## 6. Zarządzanie stanem

- **Lokalny stan widoku (`ProfilePage`):** Jest wystarczający do obsługi cyklu życia edycji (pobierz -> edytuj -> zapisz -> odśwież).
- **Pinia (`useAuthStore`):** Może wymagać odświeżenia, jeśli edycja profilu wpływa na dane przechowywane w sesji (np. imię czy avatar w nagłówku aplikacji), ale główny ciężar spoczywa na komponencie strony.
- **Formularz:** Stan formularza zarządzany przez `useForm` z biblioteki `vee-validate`.

## 7. Integracja API

Należy utworzyć serwis `src/services/trainer.service.ts` obsługujący komunikację:

1.  **Pobranie profilu:**
    - Endpoint: `GET /trainers/me`
    - Odpowiedź: `TrainerProfile`
2.  **Aktualizacja profilu:**
    - Endpoint: `PATCH /trainers/:id` (ID pobieramy z wcześniej załadowanego profilu).
    - Body: `UpdateTrainerProfileDto`
    - Odpowiedź: Zaktualizowany `TrainerProfile`.
3.  **Pobranie specjalizacji:**
    - Endpoint: `GET /specializations`
    - Odpowiedź: `Specialization[]` (Można to wydzielić do `specializations.service.ts` jeśli planujemy reużywalność).

## 8. Interakcje użytkownika

1.  **Wejście na stronę:** Użytkownik widzi spinner, a następnie swój profil w trybie "tylko do odczytu".
2.  **Kliknięcie "Edytuj":** Widok zamienia się na formularz wypełniony obecnymi danymi.
3.  **Edycja specjalizacji:** Użytkownik wybiera z listy rozwijanej wiele specjalizacji.
4.  **Anulowanie:** Powrót do widoku bez zapisu zmian.
5.  **Zapis:**
    - Walidacja formularza.
    - Wysyłka żądania API.
    - Wyświetlenie powiadomienia (Toast) o sukcesie.
    - Powrót do widoku z zaktualizowanymi danymi.

## 9. Warunki i walidacja

- **Walidacja formularza (Frontend):**
  - Pola opcjonalne są dozwolone (null/empty string).
  - URL zdjęcia musi być poprawnym formatem URL (jeśli podany).
- **Mapowanie danych:**
  - Należy pamiętać, że API zwraca obiekt `specializations` (tablica obiektów), a endpoint aktualizacji oczekuje `specializationIds` (tablica ID). Formularz musi to przemapować.

## 10. Obsługa błędów

- **Błąd pobierania profilu (404):** Jeśli użytkownik nie ma profilu trenerskiego (niespójność danych), wyświetlić stosowny komunikat lub przekierować.
- **Błąd zapisu:** Wyświetlić komunikat z błędem (Toast destructive) i nie zamykać formularza, aby użytkownik mógł poprawić dane.
- **Błąd sieci:** Standardowa obsługa (np. interceptor axiosa lub catch w serwisie).

## 11. Kroki implementacji

1.  **Przygotowanie typów:** Utwórz pliki typów w `src/types` zgodnie z sekcją 5.
2.  **Warstwa serwisu:** Stwórz `trainer.service.ts` z metodami `getMe` i `update`.
3.  **Komponent View:** Stwórz `TrainerProfileView.vue` do wyświetlania danych (stylizacja Tailwind).
4.  **Komponent Select:** Zaimplementuj prosty multiselect lub użyj gotowego z biblioteki UI dla specjalizacji.
5.  **Komponent Form:** Stwórz `TrainerProfileForm.vue`:
    - Zdefiniuj schemat walidacji Zod.
    - Podłącz `vee-validate`.
    - Zaimplementuj logikę pobierania specjalizacji przy montowaniu.
    - Obsłuż mapowanie danych (Object -> ID) przy wysyłce.
6.  **Integracja w ProfilePage:**
    - Zaimportuj nowe komponenty.
    - Dodaj logikę pobierania danych w `onMounted`.
    - Dodaj obsługę przełączania trybów.
    - Zaimplementuj funkcję `handleSave`, która wywoła serwis i zaktualizuje lokalny stan.
