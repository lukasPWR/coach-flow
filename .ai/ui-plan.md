# Architektura UI dla CoachFlow

## 1. Przegląd Struktury UI

Architektura interfejsu użytkownika (UI) aplikacji CoachFlow została zaprojektowana w oparciu o silne rozdzielenie ról: **Klienta** i **Trenera**. Każda rola posiada dedykowany, chroniony obszar aplikacji z własnym układem, nawigacją i zestawem narzędzi, co zapewnia spersonalizowane i intuicyjne doświadczenie.

Struktura opiera się na następujących filarach:

- **Strefa Publiczna:** Otwarta dla wszystkich użytkowników, skoncentrowana na odkrywaniu trenerów i prezentacji wartości aplikacji.
- **Strefa Uwierzytelniona:** Dostępna po zalogowaniu, podzielona na odrębne panele dla Klienta i Trenera.
- **Architektura Komponentowa:** Wykorzystanie reużywalnych komponentów w celu zapewnienia spójności wizualnej i efektywności deweloperskiej.
- **Strategia Mobile-First:** Projektowanie interfejsu z myślą o urządzeniach mobilnych jako priorytecie, zapewniając pełną responsywność i dostępność na wszystkich ekranach.
- **Centralne Zarządzanie Stanem:** Użycie biblioteki Pinia do zarządzania sesją użytkownika, danymi i komunikacją z API.

## 2. Lista Widoków

### A. Widoki Publiczne

---

#### **1. Strona Główna (Home Page)**

- **Ścieżka:** `/`
- **Główny Cel:** Przedstawienie aplikacji, jej kluczowych korzyści dla obu ról oraz zachęcenie do rejestracji lub przeglądania trenerów.
- **Kluczowe Informacje:** Propozycja wartości, przyciski Call-to-Action (CTA) "Znajdź trenera" i "Zostań trenerem".
- **Kluczowe Komponenty:** `HeroSection`, `BenefitsSection`, `Testimonials`.
- **Uwagi (UX, A11y, Bezpieczeństwo):** Przejrzysta nawigacja i komunikaty. Semantyczny HTML dla SEO i czytników ekranu.

#### **2. Katalog Trenerów (Trainer Directory)**

- **Ścieżka:** `/trainers`
- **Główny Cel:** Umożliwienie użytkownikom przeglądania, filtrowania i wyszukiwania profili trenerów.
- **Kluczowe Informacje:** Siatka/lista kart trenerów, narzędzia do filtrowania (miasto, specjalizacje), pole wyszukiwania.
- **Kluczowe Komponenty:** `TrainerCard`, `FilterSidebar`, `SearchBar`, `InfiniteScrollLoader`.
- **Uwagi (UX, A11y, Bezpieczeństwo):** Zastosowanie "infinite scroll" dla płynnego przeglądania. Stany ładowania (skeleton loaders). Filtry dostępne z klawiatury. Oczyszczanie danych wejściowych z paska wyszukiwania.

#### **3. Publiczny Profil Trenera (Public Trainer Profile)**

- **Ścieżka:** `/trainer/:slug`
- **Główny Cel:** Dostarczenie szczegółowych informacji o trenerze i umożliwienie rezerwacji sesji.
- **Kluczowe Informacje:** Zdjęcie, opis, specjalizacje, miasto, cennik usług, interaktywny kalendarz z dostępnymi terminami.
- **Kluczowe Komponenty:** `TrainerBio`, `ServiceList`, `AvailabilityCalendar`.
- **Uwagi (UX, A11y, Bezpieczeństwo):** Kalendarz musi być intuicyjny i w pełni obsługiwany klawiaturą. Dostępne terminy powinny być jasno komunikowane czytnikom ekranu. Widok jest publiczny (tylko do odczytu), więc ryzyko bezpieczeństwa jest minimalne.

#### **4. Logowanie (Login)**

- **Ścieżka:** `/login`
- **Główny Cel:** Umożliwienie istniejącym użytkownikom dostępu do ich kont.
- **Kluczowe Komponenty:** `AuthForm` (rekomendowany komponent reużywalny).
- **Uwagi (UX, A11y, Bezpieczeństwo):** Walidacja w czasie rzeczywistym. Jasne komunikaty o błędach. Użycie atrybutów `aria` do powiązania błędów z polami. Zabezpieczenie przed atakami typu "user enumeration" poprzez ogólny komunikat o błędzie.

#### **5. Rejestracja (Register)**

- **Ścieżka:** `/register`
- **Główny Cel:** Rejestracja nowych użytkowników z wyborem roli (Klient lub Trener).
- **Kluczowe Komponenty:** `AuthForm` z dodatkowym polem wyboru roli.
- **Uwagi (UX, A11y, Bezpieczeństwo):** Wyraźne rozróżnienie między rolami. Wymagana zgoda na regulamin. Walidacja siły hasła po stronie klienta.

### B. Widoki Klienta (Rola: CLIENT)

---

#### **1. Panel Klienta (Client Dashboard)**

- **Ścieżka:** `/dashboard`
- **Główny Cel:** Zapewnienie szybkiego wglądu w nadchodzące sesje i statusy rezerwacji.
- **Kluczowe Informacje:** Lista nadchodzących spotkań, lista rezerwacji oczekujących na potwierdzenie.
- **Kluczowe Komponenty:** `UpcomingBookingList`, `PendingRequestList`, Przycisk CTA "Znajdź trenera" (szczególnie widoczny przy pustych listach).
- **Uwagi (UX, A11y, Bezpieczeństwo):** Chroniony strażnikiem (route guard). Dane pobierane dla zalogowanego użytkownika. Puste stany list powinny kierować użytkownika do katalogu trenerów.

#### **2. Moje Rezerwacje (My Bookings)**

- **Ścieżka:** `/my-bookings`
- **Główny Cel:** Zarządzanie wszystkimi rezerwacjami (aktywnymi i historycznymi).
- **Kluczowe Informacje:** Filtrowalna/zakładkowa lista rezerwacji (Nadchodzące, Oczekujące, Historia). Każdy element zawiera szczegóły i dostępne akcje (Anuluj, Zmień termin).
- **Kluczowe Komponenty:** `BookingListItem`, `Tabs`, `Pagination`.
- **Uwagi (UX, A11y, Bezpieczeństwo):** Akcje destrukcyjne (anulowanie) wymagają potwierdzenia w oknie modalnym.

### C. Widoki Trenera (Rola: TRAINER)

---

#### **1. Onboarding Trenera (Trainer Onboarding)**

- **Ścieżka:** `/onboarding`
- **Główny Cel:** Przeprowadzenie nowego trenera przez proces konfiguracji profilu, który jest wymagany do jego publikacji.
- **Kluczowe Komponenty:** `Stepper` (kroki: 1. Dane profilowe, 2. Usługi, 3. Dostępność).
- **Uwagi (UX, A11y, Bezpieczeństwo):** Obowiązkowy dla nowych trenerów. Jasne instrukcje na każdym kroku. Stan onboardingu zapisywany, aby umożliwić powrót.

#### **2. Panel Trenera (Trainer Dashboard)**

- **Ścieżka:** `/dashboard`
- **Główny Cel:** Prezentacja kluczowych informacji biznesowych i zadań wymagających natychmiastowej uwagi.
- **Kluczowe Informacje:** Widget z prośbami o rezerwację do akceptacji (z odpytywaniem), kalendarz z sesjami na bieżący dzień/tydzień.
- **Kluczowe Komponenty:** `PendingRequestWidget`, `DailySchedule`.
- **Uwagi (UX, A11y, Bezpieczeństwo):** Chroniony strażnikiem. Użycie `aria-live` do informowania o nowych prośbach.

#### **3. Kalendarz i Dostępność (Calendar & Availability)**

- **Ścieżka:** `/calendar`
- **Główny Cel:** Wizualne zarządzanie grafikiem, w tym dodawanie bloków niedostępności.
- **Kluczowe Informacje:** Interaktywny kalendarz z widokiem dziennym i tygodniowym.
- **Kluczowe Komponenty:** `FullCalendarComponent`, `UnavailabilityFormModal`.
- **Uwagi (UX, A11y, Bezpieczeństwo):** Funkcjonalność "przeciągnij i upuść" do tworzenia blokad czasowych.

#### **4. Zarządzanie Usługami (Services Management)**

- **Ścieżka:** `/services`
- **Główny Cel:** Umożliwienie trenerowi operacji CRUD na jego ofercie usług.
- **Kluczowe Komponenty:** `ServiceList`, `ServiceFormModal`.
- **Uwagi (UX, A11y, Bezpieczeństwo):** Usuwanie usług wymaga potwierdzenia.

#### **5. Zarządzanie Rezerwacjami (Bookings Management)**

- **Ścieżka:** `/bookings`
- **Główny Cel:** Centralne miejsce do zarządzania wszystkimi rezerwacjami od klientów.
- **Kluczowe Informacje:** Zakładkowa lista rezerwacji (Oczekujące, Nadchodzące, Historia). Akcje (Akceptuj, Odrzuć) dostępne dla oczekujących.
- **Kluczowe Komponenty:** `BookingListItem`, `Tabs`, `Pagination`.

#### **6. Zarządzanie Profilem (Profile Management)**

- **Ścieżka:** `/profile`
- **Główny Cel:** Edycja publicznego profilu trenera po zakończeniu onboardingu.
- **Kluczowe Komponenty:** `ProfileForm`.

## 3. Mapa Podróży Użytkownika

### Główny Scenariusz: Nowy klient rezerwuje sesję

1.  **Odkrywanie:** Użytkownik trafia na `Stronę Główną` (`/`), klika CTA i przechodzi do `Katalogu Trenerów` (`/trainers`).
2.  **Filtrowanie:** Użytkownik używa filtrów, aby zawęzić listę, i klika kartę wybranego trenera.
3.  **Analiza:** Użytkownik ląduje na `Publicznym Profilu Trenera` (`/trainer/:slug`), gdzie analizuje opis, usługi i kalendarz dostępności.
4.  **Rezerwacja:** Użytkownik wybiera usługę i dostępny termin w kalendarzu. System prosi o zalogowanie lub rejestrację.
5.  **Uwierzytelnienie:** Użytkownik jest przekierowywany na stronę `Logowania` (`/login`) lub `Rejestracji` (`/register`). Po pomyślnej akcji wraca do procesu rezerwacji.
6.  **Potwierdzenie:** Użytkownik potwierdza rezerwację, a system wysyła prośbę do trenera.
7.  **Status:** Użytkownik jest przekierowywany do swojego `Panelu Klienta` (`/dashboard`), gdzie widzi nową rezerwację ze statusem "Oczekująca".

## 4. Układ i Struktura Nawigacji

Aplikacja będzie korzystać z dynamicznych layoutów w zależności od statusu uwierzytelnienia i roli użytkownika.

- **Layout Publiczny:**
  - **Nagłówek:** Logo, linki do `Katalogu Trenerów`, `Logowania` i `Rejestracji`.
  - **Stopka:** Linki informacyjne.
- **Layout Klienta (po zalogowaniu):**
  - **Nawigacja (boczna lub w nagłówku):** `Panel`, `Moje Rezerwacje`, `Znajdź Trenera`, `Ustawienia`, `Wyloguj`.
- **Layout Trenera (po zalogowaniu):**
  - **Nawigacja (boczna):** `Panel`, `Kalendarz`, `Rezerwacje`, `Usługi`, `Mój Profil`, `Ustawienia`, `Wyloguj`.

Przejścia między stronami będą obsługiwane przez Vue Router, a dostęp do chronionych ścieżek będzie kontrolowany przez strażników nawigacji (route guards), którzy weryfikują obecność tokena JWT i rolę użytkownika.

## 5. Kluczowe Komponenty

Poniższe komponenty będą reużywalne w całej aplikacji w celu utrzymania spójności i przyspieszenia rozwoju.

- **`AuthForm.vue`:** Generyczny formularz do logowania i rejestracji z walidacją i obsługą błędów.
- **`TrainerCard.vue`:** Karta prezentująca skrócone informacje o trenerze w `Katalogu Trenerów`.
- **`AvailabilityCalendar.vue`:** Interaktywny kalendarz do wyświetlania i wybierania dostępnych terminów. Używany na profilu publicznym.
- **`BookingListItem.vue`:** Komponent do wyświetlania pojedynczej rezerwacji na listach klienta i trenera, zawierający odpowiednie akcje w zależności od statusu i roli.
- **`Stepper.vue`:** Komponent do prowadzenia użytkownika przez wieloetapowe procesy, takie jak onboarding trenera.
- **`Modal.vue`:** Generyczny komponent okna modalnego do potwierdzania akcji destrukcyjnych lub wyświetlania formularzy.
- **`Toast.vue`:** Globalny komponent do wyświetlania krótkich powiadomień o sukcesie lub błędzie.
- **`SkeletonLoader.vue`:** Komponent do wyświetlania animowanego "szkieletu" interfejsu podczas ładowania danych.
