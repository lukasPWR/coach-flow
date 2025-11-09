<conversation_summary>
<decisions>
Onboarding Trenera: Po rejestracji, trener jest kierowany do interaktywnego przewodnika (checklist/stepper), który prowadzi go przez proces uzupełniania profilu, dodawania usług i definiowania dostępności. Profil staje się publiczny dopiero po ukończeniu tych kroków.
Obliczanie Dostępności po Stronie Klienta: Frontend jest odpowiedzialny za obliczanie dostępnych 60-minutowych slotów czasowych poprzez pobranie istniejących rezerwacji i bloków niedostępności, a następnie odjęcie ich od zdefiniowanych godzin pracy.
Zarządzanie Stanem i Uwierzytelnianiem: Aplikacja wykorzystuje bibliotekę Pinia do zarządzania stanem, localStorage do bezpiecznego przechowywania tokena JWT oraz interceptor Axios do automatycznego dołączania nagłówka autoryzacyjnego i obsługi błędów 401.
Strategia Paginacji: Publiczna lista trenerów implementuje mechanizm "infinite scroll" dla płynnego przeglądania, podczas gdy panele użytkowników (np. historia rezerwacji) wykorzystują standardową paginację.
Layouty Oparte na Rolach: Wdrożone zostaną dedykowane layouty (TrainerLayout, ClientLayout) z unikalną nawigacją i dashboardami dla każdej z ról, co zapewni spersonalizowane i intuicyjne doświadczenie.
Globalny System Informacji Zwrotnej: Stworzony zostanie ujednolicony system do komunikacji z użytkownikiem, wykorzystujący "skeleton loaders" dla stanów ładowania, powiadomienia "toast" dla błędów oraz dedykowane widoki dla błędów krytycznych.
Optimistic UI Updates: Zastosowane zostaną optymistyczne aktualizacje UI dla operacji o niskim ryzyku (np. zarządzanie dostępnością), podczas gdy akcje krytyczne (jak rezerwacja) będą wymagały potwierdzenia z serwera.
Przyjazne Adresy URL: Publiczne profile trenerów będą używać przyjaznych dla SEO i użytkownika adresów URL opartych na slug, co wymaga modyfikacji w backendzie.
Walidacja Formularzy: Aplikacja wykorzysta VeeValidate w połączeniu z zod do walidacji formularzy po stronie klienta, zapewniając natychmiastową informację zwrotną i spójność z regułami backendu.
Responsywność (Mobile-First): Interfejs zostanie zaprojektowany zgodnie ze strategią "mobile-first", zapewniając pełną funkcjonalność i czytelność na wszystkich urządzeniach, z adaptacyjnymi widokami dla złożonych komponentów jak kalendarz.
Dedykowane Dashboardy: Dashboardy dla trenera i klienta będą zawierać spersonalizowane widżety umożliwiające szybki dostęp do kluczowych informacji i akcji (np. rezerwacje do akceptacji dla trenera, nadchodzące sesje dla klienta).
Buforowanie Danych Słownikowych: Dane słownikowe (specjalizacje, typy usług) będą pobierane jednorazowo i przechowywane w globalnym stanie aplikacji (Pinia), aby zminimalizować liczbę zapytań do API.
Odpytywanie (Polling) dla Powiadomień: W panelu trenera zostanie zaimplementowany mechanizm krótkiego odpytywania (polling) w celu sprawdzania nowych próśb o rezerwację.
Obsługa Zmiany Terminu w UI: Funkcjonalność prośby o zmianę terminu zostanie zrealizowana w UI jako dwuetapowy proces: anulowanie istniejącej rezerwacji, a następnie utworzenie nowej.
Reużywalność Komponentów: Architektura będzie oparta na reużywalnych, generycznych komponentach (np. BookingListItem.vue) w celu zapewnienia spójności i efektywności rozwoju.
Obsługa Pustych Stanów (Empty States): Zaprojektowane zostaną dedykowane widoki dla sytuacji, w których brakuje danych, z czytelnymi komunikatami i wezwaniami do działania (CTA).
Potwierdzenie Akcji Destrukcyjnych: Wszystkie akcje destrukcyjne (np. anulowanie, usunięcie) będą wymagały dodatkowego potwierdzenia od użytkownika w oknie dialogowym, które jasno komunikuje konsekwencje.
Interfejs Filtrowania: Publiczna lista trenerów zostanie wyposażona w panel filtrów umożliwiający wyszukiwanie po mieście i specjalizacjach.
Dostępność (Accessibility): Aplikacja będzie wykorzystywać standardy ARIA (np. aria-live) do informowania użytkowników korzystających z czytników ekranu o dynamicznych zmianach treści.
Komunikacja Blokady Rezerwacji: Interfejs będzie jasno komunikować nałożoną na klienta blokadę rezerwacji, dezaktywując możliwość rezerwacji u danego trenera i podając datę wygaśnięcia blokady.
</decisions>
<matched_recommendations>
Architektura oparta na rolach: Wdrożenie odrębnych layoutów, nawigacji i dashboardów dla ról "Trener" i "Klient" w celu stworzenia przejrzystego i dopasowanego doświadczenia użytkownika.
Logika dostępności po stronie klienta: Frontend powinien być odpowiedzialny za obliczanie dostępnych terminów rezerwacji poprzez pobieranie istniejących rezerwacji i niedostępności z API.
Scentralizowane zarządzanie stanem: Wykorzystanie Pinia do globalnego zarządzania stanem, w tym uwierzytelnianiem użytkownika, danymi sesji i buforowanymi danymi słownikowymi (np. specjalizacjami).
Solidna obsługa formularzy: Zastosowanie VeeValidate i zod do kompleksowej walidacji formularzy po stronie klienta w celu poprawy doświadczenia użytkownika i integralności danych przed wysłaniem do API.
System informacji zwrotnej zorientowany na użytkownika: Ustanowienie globalnego systemu do obsługi stanów ładowania (skeleton loaders), błędów (toasts, dedykowane strony błędów) i potwierdzeń (modale), aby zapewnić spójną komunikację z użytkownikiem.
Strategia RWD "Mobile-First": Projektowanie wszystkich komponentów, zwłaszcza tych złożonych, jak kalendarze i dashboardy, z podejściem "mobile-first", aby zapewnić pełną funkcjonalność na wszystkich urządzeniach.
Przepływ onboardingu dla trenerów: Prowadzenie nowych trenerów przez obowiązkowy, wieloetapowy proces onboardingu (profil, usługi, dostępność) przed upublicznieniem ich profilu.
Obsługa danych asynchronicznych: Wykorzystanie kombinacji odpytywania (dla aktualizacji quasi-rzeczywistych na pulpicie trenera) i buforowania (dla danych słownikowych) w celu efektywnego zarządzania przepływem danych.
Przejrzysty UX dla złożonych przepływów: Dekonstrukcja złożonych historyjek użytkownika, które nie są bezpośrednio wspierane przez pojedyncze punkty końcowe API (np. "zmiana terminu"), na prowadzone, wieloetapowe procesy w UI.
Dostępność i SEO: Priorytetyzacja dostępności poprzez standardy ARIA i poprawa SEO za pomocą przyjaznych dla użytkownika slugów URL dla profili publicznych.
</matched_recommendations>
<ui_architecture_planning_summary>
Na podstawie analizy dokumentacji i przeprowadzonych dyskusji, plan architektury UI dla aplikacji CoachFlow MVP opiera się na następujących filarach:
a. Główne wymagania dotyczące architektury UI:
Architektura frontendowa będzie silnie zorientowana na role użytkowników (Trener, Klient), zapewniając im oddzielne, zoptymalizowane środowiska pracy. Kluczowe jest wdrożenie prowadzonego onboardingu dla trenerów, aby zapewnić kompletność danych przed publikacją profilu. Całość zostanie zbudowana w oparciu o strategię "mobile-first", gwarantując pełną responsywność. Niezbędne jest również zapewnienie stałej i jasnej informacji zwrotnej dla użytkownika na każdym etapie interakcji z aplikacją.
b. Kluczowe widoki, ekrany i przepływy użytkownika:
Strefa publiczna: Strona główna, katalog trenerów (z filtrowaniem i "infinite scroll") oraz publiczny profil trenera (z widokiem kalendarza dostępności).
Uwierzytelnianie: Widoki logowania i rejestracji.
Panel Klienta: Dashboard (nadchodzące sesje, statusy rezerwacji), historia rezerwacji (z paginacją).
Panel Trenera: Dashboard (rezerwacje oczekujące na akceptację, nadchodzące sesje), przewodnik onboardingu, zarządzanie profilem, usługami (CRUD) i dostępnością w kalendarzu.
Główne przepływy:
Rejestracja -> Wybór roli -> (Dla Trenera) Onboarding -> Dashboard.
Klient przegląda trenerów -> Widok profilu -> Wybór terminu -> Wysłanie prośby o rezerwację.
Trener otrzymuje prośbę -> Akceptacja/Odrzucenie w panelu.
c. Strategia integracji z API i zarządzania stanem:
Zarządzanie stanem (Pinia): Centralny magazyn stanu będzie zarządzał sesją użytkownika (authStore), przechowując dane i token JWT w localStorage, oraz buforował dane słownikowe (dictionaryStore) w celu optymalizacji.
Klient API (Axios): Zostanie skonfigurowany z interceptorem, który automatycznie dołącza token autoryzacyjny do zapytań oraz globalnie obsługuje błędy, w szczególności błąd 401 (Unauthorized), przekierowując na stronę logowania.
Przepływ danych: Komponenty będą wywoływać akcje w magazynach Pinia, które realizują zapytania do API. Stan aplikacji będzie aktualizowany na podstawie odpowiedzi, co spowoduje reaktywne odświeżenie interfejsu.
d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa:
Responsywność: Strategia "mobile-first" z adaptacyjnymi layoutami. Złożone komponenty, jak kalendarz, będą miały uproszczone widoki (np. widok agendy) na urządzeniach mobilnych.
Dostępność: Stosowanie semantycznego HTML oraz atrybutów ARIA (np. aria-live dla dynamicznej treści) w celu zapewnienia zgodności z czytnikami ekranu i ułatwienia nawigacji klawiaturą.
Bezpieczeństwo: Dostęp do chronionych ścieżek będzie kontrolowany przez strażników nawigacji (route guards) w Vue Router, weryfikujących status uwierzytelnienia i rolę użytkownika. Wszystkie akcje destrukcyjne będą wymagały dodatkowego potwierdzenia, a walidacja po stronie klienta (zod) będzie stanowić pierwszą linię obrony przed niepoprawnymi danymi.
</ui_architecture_planning_summary>
<unresolved_issues>
Na obecnym etapie planowania wszystkie zidentyfikowane kwestie zostały omówione, a dla każdej z nich została przyjęta rekomendacja. Nie ma nierozwiązanych problemów, które blokowałyby przejście do kolejnego etapu rozwoju interfejsu użytkownika.
</unresolved_issues>
</conversation_summary>
