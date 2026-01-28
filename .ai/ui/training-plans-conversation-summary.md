<conversation_summary>

<decisions>

Zarządzanie stanem edycji: Zrezygnowano z przycisku "Zapisz" na rzecz Live Updates z wskaźnikiem stanu (Zapisano/Zapisywanie) oraz debouncowaniem inputów.

Strategia nawigacji w Kreatorze: Wybór komponentu Tabs (zakładki) do przełączania się między jednostkami treningowymi w widoku desktopowym trenera.

Obsługa usuwania: Wprowadzenie mechanizmu Undo (Toast) dla pojedynczych elementów i Confirmation Modal dla całych jednostek.

UX Mobilny Klienta: Wdrożenie akordeonu w trybie Single Expand z funkcją Sticky Header dla nagłówka aktywnego ćwiczenia.

Wizualizacja danych: Zastąpienie tabel na mobile układem Grid/Flex-col oraz użycie ikon (badges) do rozróżnienia ćwiczeń systemowych od własnych w bazie trenera.

Komunikacja spójności danych: Wyświetlanie ostrzeżeń/not przy edycji ćwiczenia w bazie o wpływie (lub jego braku - snapshot) na historyczne plany.

Architektura Dashboardu Klienta: Podział na sekcję operacyjną ("Na dziś" - deep link) i informacyjną (Powiadomienia).

Interakcje: Implementacja Drag & Drop z dedykowanym uchwytem (handle) przy użyciu biblioteki VueDraggable.

Bezpieczeństwo sesji: Obsługa błędu 401 poprzez Re-auth Modal bez przeładowania strony, w celu ochrony niezapisanych danych. </decisions>

<matched_recommendations>

Implementacja wskaźników stanu i Optimistic UI w odpowiedzi na brak endpointu "Draft".

Zastosowanie nawigacji opartej na zakładkach (Tabs) dla jednostek treningowych.

Zabezpieczenie akcji destrukcyjnych (Delete) mechanizmem Toast Undo/Modal.

Optymalizacja widoku mobilnego pod ekrany <375px (Single Expand Accordion).

Oznaczenie pochodzenia ćwiczeń (System vs Trener) wizualnymi badge'ami.

Rezygnacja z tabel na rzecz responsywnych layoutów blokowych dla parametrów ćwiczeń.

Edukacja użytkownika w UI na temat działania edycji danych historycznych (Snapshot vs Reference).

Priorytetyzacja widżetów na dashboardzie klienta (Kontekst "Tu i teraz").

Wykorzystanie VueDraggable i logiki aktualizacji sortOrder przy zdarzeniu drop.

Wdrożenie interceptora HTTP dla płynnego odnawiania sesji (Re-auth). </matched_recommendations>

<ui_architecture_planning_summary> a. Główne wymagania dotyczące architektury UI Architektura UI musi wspierać model "Live Updates" (wysoka reaktywność), co wymusza silną integrację zarządzania stanem (Pinia) z warstwą API. Kluczowe jest rozdzielenie środowiska "Desktop-first" dla Trenera (bogate formularze, drag & drop) od środowiska "Mobile-first" dla Klienta (konsumpcja treści, interakcje dotykowe). Stack technologiczny (Vue 3, Tailwind, shadcn-vue) został potwierdzony jako odpowiedni do realizacji tych celów.

b. Kluczowe widoki i przepływy użytkownika

Trener:

Dashboard: Punkt startowy.

Baza Ćwiczeń: Lista z filtrowaniem i modalem/formularzem dodawania (rozróżnienie Seed Data vs User Data).

Kreator Planu: Widok złożony z nagłówka (meta dane), paska zakładek (Jednostki) i obszaru roboczego (Lista ćwiczeń z parametrami).

Klient:

Dashboard: Widget "Na dziś" (Deep link do treningu) + Widget Powiadomień.

Widok Treningu (Mobile): Lista wertykalna, Akordeon (Single Expand), wyraźne Checkboxy stanu wykonania.

c. Strategia integracji z API i zarządzania stanem Zastosowanie Optimistic UI jest krytyczne dla UX kreatora. Stan aplikacji (Store) musi być aktualizowany natychmiast po akcji użytkownika, a synchronizacja z API odbywa się w tle (z debouncowaniem dla pól tekstowych). Obsługa błędów API musi cofać zmiany w stanie lokalnym (rollback). Sortowanie (Drag & Drop) wysyła żądanie PATCH dopiero po zakończeniu interakcji.

d. Responsywność, dostępność i bezpieczeństwo

Responsywność: Skupienie na czytelności parametrów treningowych na ekranach <375px (iPhone SE/mini) poprzez unikanie tabel i stosowanie układu wertykalnego.

Bezpieczeństwo sesji: Implementacja interceptorów HTTP w celu obsługi wygaśnięcia tokenu JWT w sposób transparentny dla procesu edycji (Re-auth Modal), co zapobiega utracie wprowadzonych danych.

e. Nierozwiązane kwestie Brak </ui_architecture_planning_summary>

<unresolved_issues>

Szczegóły obsługi pustych stanów (Empty States): Jak wygląda dashboard klienta, gdy nie ma przypisanego planu, oraz kreator trenera przed dodaniem pierwszej jednostki?

Precyzja mechanizmu Snapshot: Czy backend na pewno spłaszcza nazwę ćwiczenia (exerciseName) w PlanExercise? Jeśli nie (i jest to tylko relacja), rekomendacja dotycząca ostrzegania użytkownika o globalnej zmianie nazwy musi zostać zweryfikowana z zespołem backendowym.

Formatowanie notatek na mobile: Gdzie dokładnie w layoutcie "Grid/Flex-col" wyświetlać długie notatki tekstowe do ćwiczenia, aby nie zaburzały czytelności parametrów liczbowych?

Loading States: Definicja wyglądu szkieletów (Skeletons) podczas pierwszego ładowania planu, zanim zadziała Optimistic UI. </unresolved_issues>

</conversation_summary>