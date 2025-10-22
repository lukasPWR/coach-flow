# Dokument wymagań produktu (PRD) - CoachFlow

## 1. Przegląd produktu

CoachFlow to aplikacja internetowa (MVP) zaprojektowana w celu usprawnienia interakcji pomiędzy trenerami personalnymi a ich klientami. Platforma ma na celu rozwiązanie problemu nieefektywnej komunikacji i zarządzania w relacji trener-podopieczny poprzez centralizację kluczowych procesów, takich jak tworzenie oferty, rezerwacja terminów i zarządzanie kalendarzem. Aplikacja udostępnia dedykowane interfejsy dla dwóch ról: trenera i użytkownika (klienta), ułatwiając im planowanie i realizację celów treningowych. Główną wartością produktu jest oszczędność czasu i redukcja chaosu organizacyjnego dla obu stron.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje CoachFlow, jest brak scentralizowanego, prostego narzędzia do zarządzania współpracą trenera personalnego z klientami.

Problemy Trenera:

- Trudności w zarządzaniu dostępnością i grafikiem wielu klientów jednocześnie.
- Brak jednego miejsca do prezentowania swojej oferty, cennika i specjalizacji.
- Chaos komunikacyjny związany z rezerwacjami, odwoływaniem i przekładaniem terminów (telefony, SMSy, social media).
- Brak automatyzacji przypomnień o nadchodzących sesjach.

Problemy Użytkownika (Klienta):

- Trudności w znalezieniu informacji o dostępności preferowanego trenera.
- Niejasny i rozproszony proces rezerwacji sesji treningowej.
- Brak wspólnego, przejrzystego kalendarza z zaplanowanymi treningami.
- Ryzyko nieporozumień dotyczących terminów, cen i zakresu usług.

CoachFlow adresuje te problemy, tworząc transparentny i ustrukturyzowany ekosystem do zarządzania relacjami treningowymi.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie kontami i rolami

- Użytkownicy mogą rejestrować się w systemie, wybierając jedną z dwóch ról: Trener lub Użytkownik.
- System obsługuje logowanie i wylogowywanie dla obu typów ról.
- Procesy odzyskiwania hasła.

### 3.2. Profil trenera

- Trener może stworzyć i edytować swój publiczny profil.
- Profil zawiera pola: opis, specjalizacje, lokalizacja (miasto), zakres cen usług, zdjęcie profilowe.
- Trener zarządza swoją dostępnością w widoku kalendarza.

### 3.3. Zarządzanie usługami (CRUD)

- Trener może tworzyć, edytować i usuwać usługi.
- Katalog usług jest ograniczony do 3-4 predefiniowanych typów (np. "Trening personalny", "Konsultacja dietetyczna").
- Każda usługa ma zdefiniowaną długość (domyślnie 60 minut) oraz cenę lub widełki cenowe.

### 3.4. System rezerwacji

- Użytkownik może przeglądać katalog trenerów i ich usług.
- Użytkownik może wybrać usługę i dostępny termin w kalendarzu trenera, aby złożyć wniosek o rezerwację.
- Trener otrzymuje powiadomienie o nowym wniosku i ma 24 godziny na jego akceptację lub odrzucenie.
- W przypadku braku reakcji w ciągu 24 godzin, rezerwacja jest automatycznie odrzucana.
- Po akceptacji rezerwacji, termin jest automatycznie dodawany do kalendarzy obu stron.

### 3.5. Zarządzanie kalendarzem

- Zarówno trener, jak i użytkownik mają dostęp do swojego kalendarza.
- Kalendarz oferuje widok dzienny i tygodniowy (z możliwością edycji) oraz widok miesięczny (tylko do odczytu).
- Trener może manualnie dodawać bloki niedostępności (np. przerwy, urlopy).
- Kalendarz użytkownika synchronizuje się po akceptacji rezerwacji przez trenera.

### 3.6. Anulowanie i zmiana terminu wizyty

- Obie strony mogą zainicjować prośbę o zmianę terminu zaakceptowanej wizyty.
- Obie strony mogą anulować wizytę.
- Jeśli użytkownik anuluje wizytę na mniej niż 12 godzin przed jej rozpoczęciem, otrzymuje karę: 7-dniową blokadę możliwości rezerwacji u tego konkretnego trenera.

### 3.7. Dashboardy

- Każda rola ma dedykowany dashboard.
- Dashboard wyświetla listę nadchodzących wizyt i statusy bieżących rezerwacji.

### 3.8. System powiadomień (E-mail)

- System wysyła automatyczne powiadomienia e-mail w kluczowych momentach:
  1.  Nowe zgłoszenie rezerwacyjne (do trenera).
  2.  Akceptacja lub odrzucenie rezerwacji (do użytkownika).
  3.  Prośba o zmianę terminu (do drugiej strony).
  4.  Przypomnienie o nadchodzącej wizycie na 24 godziny przed jej terminem (do obu stron).

### 3.9. Zgodność z RODO

- System wymaga od użytkowników akceptacji regulaminu i polityki prywatności podczas rejestracji.
- Zbierane dane są ograniczone do minimum niezbędnego do funkcjonowania aplikacji.

## 4. Granice produktu

### 4.1. Funkcjonalności w zakresie MVP

- Rejestracja i logowanie dla ról Trener i Użytkownik.
- Tworzenie i zarządzanie profilem trenera.
- CRUD dla predefiniowanych typów usług.
- System przypisywania podopiecznych do trenerów poprzez mechanizm rezerwacji.
- Kalendarz z widokiem dziennym, tygodniowym, miesięcznym oraz zarządzaniem dostępnością.
- Podstawowe dashboardy dla użytkownika i trenera.
- Powiadomienia e-mail o kluczowych zdarzeniach.
- W pełni responsywny interfejs webowy.

### 4.2. Funkcjonalności poza zakresem MVP

- Zintegrowany system płatności.
- Wewnętrzny komunikator (chat).
- System recenzji i ocen trenerów.
- Śledzenie statystyk i postępów użytkowników (w UI mogą pojawić się zapowiedzi "wkrótce").
- Integracja z zewnętrznymi kalendarzami (np. Google Calendar).
- Zaawansowane definiowanie planów treningowych (multimedia, AI).
- Zaawansowany panel administracyjny do zarządzania systemem.

### 4.3. Nierozwiązane kwestie (TBD - To Be Decided)

Poniższe kwestie wymagają dalszej analizy i zostaną rozważone w przyszłych iteracjach produktu:

- Zaawansowane filtry i sortowanie w katalogu trenerów.
- Obsługa różnych trybów usług (online, stacjonarnie, hybryda).
- Definiowanie cyklicznych szablonów dostępności przez trenera.
- Szczegółowe reguły obsługi konfliktów przy wielu zgłoszeniach na ten sam slot czasowy.
- Rozbudowany onboarding dla trenera z listą kroków do publikacji profilu.
- Obsługa statusów po wizycie (np. "odbyta", "no-show").

## 5. Historyjki użytkowników

### 5.1. Zarządzanie kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako gość, chcę móc zarejestrować się w systemie jako "Użytkownik", abym mógł rezerwować sesje z trenerami.
- Kryteria akceptacji:

  1.  Formularz rejestracji zawiera pola: imię, e-mail, hasło.
  2.  Muszę wybrać rolę "Użytkownik".
  3.  Muszę zaakceptować regulamin i politykę prywatności.
  4.  Po pomyślnej rejestracji jestem zalogowany i przekierowany na mój dashboard.
  5.  System waliduje unikalność adresu e-mail.

- ID: US-002
- Tytuł: Rejestracja nowego trenera
- Opis: Jako gość, chcę móc zarejestrować się w systemie jako "Trener", abym mógł oferować swoje usługi klientom.
- Kryteria akceptacji:

  1.  Formularz rejestracji zawiera pola: imię, e-mail, hasło.
  2.  Muszę wybrać rolę "Trener".
  3.  Muszę zaakceptować regulamin i politykę prywatności.
  4.  Po pomyślnej rejestracji jestem zalogowany i przekierowany na mój dashboard w celu uzupełnienia profilu.

- ID: US-003
- Tytuł: Logowanie do systemu
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto przy użyciu e-maila i hasła, aby uzyskać dostęp do moich danych.
- Kryteria akceptacji:
  1.  Formularz logowania zawiera pola: e-mail, hasło.
  2.  Po poprawnym zalogowaniu jestem przekierowany na swój dashboard.
  3.  W przypadku błędnych danych, wyświetlany jest komunikat o błędzie.

### 5.2. Funkcjonalności Trenera

- ID: US-004
- Tytuł: Zarządzanie profilem trenera
- Opis: Jako trener, chcę móc uzupełnić i edytować mój profil, aby przedstawić swoją ofertę potencjalnym klientom.
- Kryteria akceptacji:

  1.  Mam dostęp do formularza edycji profilu.
  2.  Mogę dodać/zmienić: zdjęcie profilowe, opis, specjalizacje, miasto.
  3.  Zmiany są widoczne na moim publicznym profilu.

- ID: US-005
- Tytuł: Zarządzanie usługami
- Opis: Jako trener, chcę móc dodawać, edytować i usuwać usługi, aby zarządzać swoją ofertą.
- Kryteria akceptacji:

  1.  Mogę dodać nową usługę, wybierając jej typ z predefiniowanej listy (3-4 opcje).
  2.  Dla każdej usługi mogę zdefiniować cenę (lub widełki cenowe). Długość usługi jest stała (60 min).
  3.  Mogę edytować istniejącą usługę.
  4.  Mogę usunąć usługę.

- ID: US-006
- Tytuł: Zarządzanie dostępnością w kalendarzu
- Opis: Jako trener, chcę móc zarządzać swoją dostępnością w kalendarzu, aby klienci widzieli, kiedy mogą rezerwować sesje.
- Kryteria akceptacji:

  1.  Mam dostęp do widoku kalendarza (dziennego, tygodniowego).
  2.  Mogę zaznaczać bloki czasowe jako "niedostępne".
  3.  Zaakceptowane rezerwacje automatycznie blokują odpowiednie sloty w moim kalendarzu.
  4.  Zmiany w dostępności są od razu widoczne dla użytkowników przeglądających mój profil.

- ID: US-007
- Tytuł: Zarządzanie wnioskami o rezerwację
- Opis: Jako trener, chcę otrzymywać i zarządzać wnioskami o rezerwację, aby kontrolować swój grafik.
- Kryteria akceptacji:
  1.  Otrzymuję powiadomienie e-mail o nowym wniosku o rezerwację.
  2.  Na moim dashboardzie widzę listę oczekujących wniosków.
  3.  Mogę zaakceptować lub odrzucić wniosek.
  4.  Po podjęciu decyzji, użytkownik otrzymuje powiadomienie e-mail.
  5.  Jeśli nie podejmę akcji w ciągu 24h, wniosek jest automatycznie odrzucany.

### 5.3. Funkcjonalności Użytkownika (Klienta)

- ID: US-008
- Tytuł: Przeglądanie katalogu trenerów
- Opis: Jako użytkownik, chcę móc przeglądać listę dostępnych trenerów, aby znaleźć odpowiednią osobę dla siebie.
- Kryteria akceptacji:

  1.  Widzę listę trenerów z ich podstawowymi informacjami (imię, specjalizacja, miasto).
  2.  Mogę kliknąć na profil trenera, aby zobaczyć szczegóły i listę jego usług.

- ID: US-009
- Tytuł: Składanie wniosku o rezerwację
- Opis: Jako użytkownik, chcę móc wybrać usługę i termin u trenera, aby złożyć wniosek o rezerwację sesji.
- Kryteria akceptacji:

  1.  Na profilu trenera widzę jego kalendarz z dostępnymi slotami czasowymi (60 min).
  2.  Po wybraniu usługi i terminu, mogę wysłać wniosek o rezerwację.
  3.  Status mojego wniosku ("oczekujący") jest widoczny na moim dashboardzie.
  4.  Otrzymuję e-mail z potwierdzeniem akceptacji lub odrzucenia wniosku.

- ID: US-010
- Tytuł: Przeglądanie kalendarza i dashboardu
- Opis: Jako użytkownik, chcę mieć dostęp do swojego kalendarza i dashboardu, aby śledzić nadchodzące i przeszłe sesje.
- Kryteria akceptacji:

  1.  Mój dashboard pokazuje listę nadchodzących, potwierdzonych sesji.
  2.  Mój kalendarz pokazuje wszystkie potwierdzone sesje.
  3.  Widzę statusy moich rezerwacji (oczekująca, potwierdzona, odrzucona, anulowana).

- ID: US-011
- Tytuł: Anulowanie rezerwacji
- Opis: Jako użytkownik, chcę móc anulować zaplanowaną sesję, znając konsekwencje tej akcji.
- Kryteria akceptacji:
  1.  Mogę anulować potwierdzoną rezerwację z poziomu mojego dashboardu.
  2.  Jeśli anuluję sesję na 12 godzin lub więcej przed jej rozpoczęciem, nie ponoszę konsekwencji.
  3.  Jeśli anuluję sesję na mniej niż 12 godzin przed jej rozpoczęciem, system informuje mnie o nałożeniu 7-dniowej blokady na rezerwacje u tego trenera.
  4.  Po potwierdzeniu anulowania, blokada jest aktywowana, a trener otrzymuje powiadomienie.

### 5.4. Funkcjonalności wspólne

- ID: US-012
- Tytuł: Prośba o zmianę terminu
- Opis: Jako trener lub użytkownik, chcę móc zaproponować nowy termin dla już potwierdzonej sesji, aby elastycznie zarządzać grafikiem.
- Kryteria akceptacji:

  1.  Przy potwierdzonej rezerwacji widzę opcję "Zaproponuj inny termin".
  2.  Po kliknięciu mogę wybrać nowy, dostępny termin i wysłać propozycję do drugiej strony.
  3.  Druga strona otrzymuje powiadomienie i może zaakceptować lub odrzucić propozycję.
  4.  Po akceptacji, termin w kalendarzach obu stron jest aktualizowany.

- ID: US-013
- Tytuł: Otrzymywanie przypomnień
- Opis: Jako trener lub użytkownik, chcę otrzymać e-mail z przypomnieniem na 24 godziny przed zaplanowaną sesją, aby o niej nie zapomnieć.
- Kryteria akceptacji:
  1.  System automatycznie wysyła e-mail do obu stron na 24 godziny przed terminem sesji.
  2.  E-mail zawiera szczegóły sesji (data, godzina, usługa, dane drugiej strony).

## 6. Metryki sukcesu

### 6.1. Kryteria sukcesu MVP (faza testowa)

- Aktywacja: Minimum 5 zarejestrowanych i aktywnych trenerów (z uzupełnionym profilem i usługami).
- Aktywacja: Minimum 30 aktywnych użytkowników.
- Transakcje: Minimum 20 pomyślnie zrealizowanych rezerwacji (od wniosku do akceptacji).
- Użyteczność: Co najmniej 80% użytkowników kończy proces rezerwacji bez napotkania błędu krytycznego.
- Satysfakcja: Co najmniej 70% pozytywnych opinii w ankiecie satysfakcji przeprowadzonej po fazie testowej.

### 6.2. Wskaźniki do monitorowania

- Lejek konwersji:
  - SIGNUP -> TRAINER_PROFILE_COMPLETED -> SERVICE_CREATED
  - SIGNUP -> BOOKING_REQUESTED -> BOOKING_ACCEPTED
- Czas przejścia: Mediana czasu od złożenia wniosku o rezerwację do jego akceptacji/odrzucenia przez trenera.
- Retencja: Współczynnik powrotu użytkowników i trenerów po 7 dniach od rejestracji.
- Aktywność: Liczba rezerwacji na aktywnego trenera; liczba rezerwacji na aktywnego użytkownika.
- Zdarzenia do śledzenia: BOOKING_REQUESTED, BOOKING_ACCEPTED, BOOKING_REJECTED, BOOKING_CANCELLED, BOOKING_RESCHEDULED, BOOKING_REMINDER_SENT.
