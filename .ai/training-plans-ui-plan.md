# Architektura UI dla Modułu Planów Treningowych (CoachFlow)

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika dla modułu Planów Treningowych została zaprojektowana z wyraźnym podziałem na dwa odrębne doświadczenia: **Desktop-first dla Trenera** (narzędzie typu "Builder" o wysokiej gęstości informacji) oraz **Mobile-first dla Klienta** (narzędzie do konsumpcji treści w trakcie treningu).

Głównym założeniem architektonicznym jest model **"Live Updates"** (Brak przycisku "Zapisz"), co wymusza zastosowanie wzorca **Optimistic UI**. Interfejs reaguje natychmiast na akcje użytkownika, synchronizując dane z API w tle.

### Główne założenia projektowe:

- **Reaktywność:** Natychmiastowa informacja zwrotna dla użytkownika (Toast, statusy zapisu).
- **Bezpieczeństwo danych:** Mechanizm `Re-auth Modal` zapobiegający utracie pracy w przypadku wygaśnięcia sesji.
- **Dostępność mobilna:** Rezygnacja z tabel na rzecz układów wertykalnych (Stack/Grid) w widoku klienta.

## 2. Lista widoków

### A. Panel Trenera (Desktop)

#### 1. Biblioteka Ćwiczeń (Exercise Library)

- **Ścieżka:** `/trainer/exercises`
- **Główny cel:** Zarządzanie bazą wiedzy trenera, przeglądanie ćwiczeń systemowych.
- **Kluczowe informacje:** Nazwa ćwiczenia, Partia mięśniowa, Źródło (Systemowe/Własne).
- **Kluczowe komponenty:**
  - `ExerciseListTable`: Tabela z sortowaniem i kolumnami (Nazwa, Partia, Akcje).
  - `FiltersSidebar`: Filtry checkboxowe dla partii mięśniowych.
  - `ExerciseModal`: Formularz dodawania/edycji ćwiczenia.
- **UX/Bezpieczeństwo:**
  - Wyróżnienie wizualne (Badge) dla ćwiczeń systemowych (Read-only).
  - Ostrzeżenie przy usuwaniu (Soft Delete) o wpływie na historyczne plany.

#### 2. Lista Planów (Training Plans List)

- **Ścieżka:** `/trainer/plans`
- **Główny cel:** Centrum zarządzania przydziałami dla podopiecznych.
- **Kluczowe informacje:** Nazwa planu, Przypisany Klient, Status (Aktywny/Archiwalny), Data modyfikacji.
- **Kluczowe komponenty:**
  - `PlansGrid`: Widok kafelkowy lub lista (przełączalny).
  - `CreatePlanButton`: Przycisk inicjujący proces tworzenia.
  - `StatusTabs`: Przełącznik "Aktywne" / "Zarchiwizowane".

#### 3. Kreator Planu (Plan Builder)

- **Ścieżka:** `/trainer/plans/:id/edit`
- **Główny cel:** Tworzenie i edycja struktury planu w czasie rzeczywistym.
- **Kluczowe informacje:** Nagłówek planu, Lista jednostek treningowych, Szczegółowe parametry ćwiczeń.
- **Kluczowe komponenty:**
  - `PlanHeader`: Input nazwy, Select klienta, Status toggle.
  - `UnitTabsNavigation`: Pasek zakładek do przełączania między dniami treningowymi (np. Dzień A, Dzień B).
  - `ExerciseEditorList`: Lista Drag & Drop (`VueDraggable`) z kartami ćwiczeń.
  - `ExerciseSearchModal`: Modal do szybkiego dodawania ćwiczeń do aktywnej jednostki.
- **UX/Bezpieczeństwo:**
  - **Auto-save indicator**: Ikona informująca o statusie synchronizacji (Zapisano / Zapisywanie...).
  - **Debounce**: Opóźnienie zapisu pól tekstowych, aby nie zalewać API requestami.
  - **Undo Toast**: Możliwość cofnięcia usunięcia ćwiczenia/jednostki.

### B. Panel Klienta (Mobile Web)

#### 1. Dashboard Klienta

- **Ścieżka:** `/dashboard`
- **Główny cel:** Szybki dostęp do bieżących zadań.
- **Kluczowe informacje:** Powiadomienia o nowych planach, Skrót do obecnego treningu.
- **Kluczowe komponenty:**
  - `NotificationWidget`: Lista ostatnich zdarzeń ("Trener dodał nowy plan...").
  - `ActivePlanCard`: Karta wyróżniona, prowadząca bezpośrednio do aktywnego planu.

#### 2. Lista Moich Planów

- **Ścieżka:** `/client/plans`
- **Główny cel:** Dostęp do historii i wszystkich przypisanych planów.
- **Kluczowe informacje:** Nazwa planu, Trener prowadzący, Status.
- **Kluczowe komponenty:**
  - `PlanTile`: Prosty kafelek z nazwą i statusem.

#### 3. Widok Realizacji Planu (Workout View)

- **Ścieżka:** `/client/plans/:id`
- **Główny cel:** Wykonywanie treningu na urządzeniu mobilnym.
- **Kluczowe informacje:** Jednostki treningowe, Lista ćwiczeń, Parametry (Serie, Powtórzenia, Tempo).
- **Kluczowe komponenty:**
  - `UnitSelector`: Dropdown lub poziome karty do wyboru dnia treningowego (jeśli plan ma >1).
  - `ExerciseAccordion`: Lista ćwiczeń. Kliknięcie rozwija szczegóły.
  - `ExerciseDetails`: Grid 2-kolumnowy wyświetlający parametry (Label + Value).
  - `CompletionCheckbox`: Duży, łatwo dostępny przycisk odhaczenia ćwiczenia.
- **UX/Dostępność:**
  - **Single Expand**: Tylko jedno ćwiczenie rozwinięte na raz (focus mode).
  - **Sticky Header**: Nazwa ćwiczenia "przyklejona" do góry ekranu podczas scrollowania długiego opisu/notatki.
  - **Font Size**: Powiększone czcionki dla parametrów liczbowych.

## 3. Mapa podróży użytkownika

### Scenariusz A: Trener tworzy plan (Core Flow)

1.  **Inicjacja**: Trener na liście planów klika "Utwórz plan". System tworzy pusty zasób (POST) i przekierowuje do **Kreatora**.
2.  **Konfiguracja**: Trener edytuje nazwę "Plan na Masę" i wybiera klienta z listy (Autosave w tle).
3.  **Struktura**: Trener widzi domyślną "Jednostkę 1". Zmienia jej nazwę na "Poniedziałek - Klatka".
4.  **Dodawanie treści**:
    - Klika "Dodaj ćwiczenie".
    - W Modalu wpisuje "Wyciskanie". Wybiera z listy.
    - Ćwiczenie pojawia się na liście w tle (Optimistic UI).
5.  **Parametryzacja**:
    - Trener wpisuje "4" w pole Serie i "8-10" w pole Powtórzenia.
    - Wpisuje notatkę "Pamiętaj o oddechu".
    - Każda zmiana jest zapisywana automatycznie po przestaniu pisania (debounce).
6.  **Organizacja**: Trener łapie za uchwyt (handle) i przesuwa ćwiczenie na górę listy (Drag & Drop).
7.  **Publikacja**: Trener nie musi nic "publikować" - zmiany są widoczne dla klienta natychmiast (Live Updates). Może ewentualnie wysłać powiadomienie (osobna akcja, poza MVP, lub automatyczna).

### Scenariusz B: Klient realizuje trening

1.  **Dostęp**: Klient otrzymuje powiadomienie lub wchodzi na Dashboard. Klika w "Plan na Masę".
2.  **Wybór**: Wybiera "Poniedziałek - Klatka" z selektora jednostek.
3.  **Realizacja**:
    - Widzi listę ćwiczeń (zwiniętą).
    - Klika w pierwsze ćwiczenie. Akordeon się rozwija.
    - Czyta: "4 serie, 8-10 powtórzeń".
    - Wykonuje ćwiczenie.
4.  **Raportowanie**: Klika checkbox przy ćwiczeniu. Stan zmienia się na "Wykonane" (zielony kolor/ikona). Zmiana jest trwała.

## 4. Układ i struktura nawigacji

### Trener (Desktop)

- **Sidebar (Lewa strona)**: Główna nawigacja globalna (Dashboard, Kalendarz, Klienci, **Baza Ćwiczeń**, **Plany Treningowe**, Ustawienia).
- **Breadcrumbs (Góra)**: Ścieżka powrotu, np. `Plany / Plan Jana Kowalskiego / Edycja`.
- **Local Tabs (Wewnątrz widoku Kreatora)**: Nawigacja między Jednostkami Treningowymi.

### Klient (Mobile)

- **Bottom Navigation Bar**: Stała nawigacja na dole ekranu (Dashboard, **Moje Plany**, Profil).
- **Top Bar (Contextual)**:
  - W widoku listy: Tytuł "Moje Plany".
  - W widoku treningu: Przycisk "Wróć" (<), Nazwa Planu, Selektor Jednostki.

## 5. Kluczowe komponenty

### Komponenty Współdzielone (Shared)

- **`StatusBadge`**: Komponent wizualizujący stan (Aktywny - Zielony, Archiwalny - Szary).
- **`MuscleGroupIcon`**: Ikona lub skrót literowy reprezentujący partię mięśniową (używane w liście ćwiczeń).

### Komponenty Trenera (Trainer-specific)

- **`PlanEditorLayout`**: Wrapper obsługujący logikę Autosave i wyświetlanie statusu synchronizacji.
- **`SortableExerciseList`**: Lista implementująca bibliotekę `VueDraggable` z obsługą zdarzeń `@end` do aktualizacji `sortOrder`.
- **`ExerciseSearchModal`**: Modal z polem wyszukiwania (`input type="search"`) i listą wyników, obsługujący dodawanie wielu elementów na raz.

### Komponenty Klienta (Client-specific)

- **`MobileAccordionItem`**: Komponent listy rozwijanej, zoptymalizowany pod dotyk (min. 44px wysokości nagłówka).
- **`AttributeGrid`**: Siatka CSS wyświetlająca parametry ćwiczenia (Serie, Reps, Tempo, Przerwa) w czytelny sposób, bez użycia tabeli HTML.
- **`ReAuthModal`**: Modal "blokujący" ekran w przypadku wygaśnięcia tokenu, pozwalający na ponowne logowanie w tle bez przeładowania aplikacji (krytyczne dla zachowania kontekstu).
