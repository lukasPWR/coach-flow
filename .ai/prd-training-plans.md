Dokument wymagań produktu (PRD) - CoachFlow
1. Przegląd produktu
CoachFlow to aplikacja wspierająca pracę trenerów personalnych. Obecny moduł MVP (Minimum Viable Product) koncentruje się na cyfryzacji i dystrybucji planów treningowych. Celem jest rozszerzenie funkcjonalności systemu z samej logistyki (kalendarz/rezerwacje) na dostarczanie merytorycznej treści treningowej. Moduł pozwala trenerom na tworzenie planów w oparciu o bazę ćwiczeń (systemową i własną) oraz udostępnianie ich klientom w formie interaktywnej listy zadań na urządzenia mobilne, eliminując konieczność korzystania z zewnętrznych arkuszy kalkulacyjnych czy plików PDF.

2. Problem użytkownika
Obecnie trenerzy używają CoachFlow do zarządzania czasem (kiedy odbywa się trening), ale do przekazania treści (co robić) wykorzystują zewnętrzne, niepołączone narzędzia takie jak Excel, Google Sheets czy pliki PDF wysyłane mailem. Prowadzi to do następujących problemów:

Fragmentacja komunikacji: Klient musi sprawdzać grafik w aplikacji, a plan treningowy w mailu lub innym pliku.

Niska użyteczność na mobile: Arkusze kalkulacyjne i pliki PDF są nieczytelne na ekranach smartfonów (konieczność ciągłego przybliżania i przesuwania ekranu).

Brak standaryzacji: Trener traci czas na każdorazowe kopiowanie nazw ćwiczeń i formatowanie tabel dla każdego klienta z osobna.

Trudność w zarządzaniu bazą wiedzy: Własne ćwiczenia trenera są rozproszone w różnych plikach klientów, zamiast stanowić jedną, łatwo dostępną bibliotekę.

3. Wymagania funkcjonalne
3.1 Zarządzanie Bazą Ćwiczeń
System musi posiadać centralne repozytorium ćwiczeń podzielone na dwie sekcje:

Baza Systemowa (Seed Data): Około 50 predefiniowanych ćwiczeń, wgranych przez plik konfiguracyjny, edytowalnych tylko przez deweloperów/administratorów systemu (brak panelu admina w MVP).

Baza Trenera: Ćwiczenia dodawane przez trenera, widoczne tylko dla niego.

Kategoryzacja: Każde ćwiczenie musi być przypisane do jednej z 15 zdefiniowanych partii mięśniowych (np. Klatka piersiowa, Plecy, Nogi).

Zarządzanie (CRUD): Trener może dodawać, edytować i usuwać (Soft Delete) własne ćwiczenia. Usunięcie ćwiczenia ukrywa je na liście wyboru, ale nie usuwa go z historycznych planów.

3.2 Kreator Planów Treningowych
Narzędzie desktopowe dla trenera umożliwiające:

Tworzenie nagłówka planu (Nazwa, Daty, Przypisanie do klienta).

Obsługę jednostek treningowych (Dodawanie, Duplikowanie, Usuwanie dni treningowych).

Dodawanie ćwiczeń do jednostek z bazy (wyszukiwanie, wybór).

Parametryzację ćwiczeń przy użyciu pól tekstowych dla zachowania elastyczności (Serie, Powtórzenia, Ciężar/RPE, Tempo, Przerwa, Notatki).

Sortowanie kolejności ćwiczeń wewnątrz jednostki.

Edycję w trybie Live Updates (zmiany natychmiast widoczne u klienta).

3.3 Interfejs Klienta (Mobile Web)
Responsywny widok dla podopiecznego umożliwiający:

Dostęp do listy planów (Aktywne i Zarchiwizowane) w oddzielnej zakładce.

Odczyt planu w widoku pionowym (Mobile-first) z wykorzystaniem mechanizmu akordeonu (rozwiń/zwiń szczegóły ćwiczenia).

Oznaczanie wykonania ćwiczeń (Checkboxy).

Otrzymywanie prostych powiadomień o nowym planie (Widget na Dashboardzie).

4. Granice produktu
Poniższe elementy zostały świadomie wyłączone z zakresu MVP:

Historia Progresji i Analityka: System nie analizuje postępów siłowych, nie generuje wykresów objętości ani rekordów (PR).

Multimedia: Baza ćwiczeń nie zawiera zdjęć ani filmów instruktażowych.

Logika Superserii: Brak wizualnego łączenia ćwiczeń w bloki (superserie, gigaserie).

Szablony Globalne: Brak możliwości zapisywania całych planów jako szablonów do użycia u innego klienta.

Kalendarz: Jednostki treningowe nie są mapowane na konkretne daty w kalendarzu rezerwacji.

5. Historyjki użytkowników
Sekcja A: Dostęp i Uprawnienia
ID: US-001 Tytuł: Dostęp do modułu planów zgodnie z rolą Opis: Jako użytkownik systemu, chcę mieć dostęp do odpowiednich widoków modułu treningowego w zależności od mojej roli (Trener - edycja, Klient - podgląd), aby bezpiecznie korzystać z aplikacji. Kryteria akceptacji:

Użytkownik zalogowany jako Trener widzi panel "Baza Ćwiczeń" oraz "Kreator Planów" z możliwością edycji.

Użytkownik zalogowany jako Klient widzi tylko zakładkę "Moje Plany" w trybie tylko do odczytu (z możliwością zaznaczania checkboxów).

Próba dostępu do API edycji planu z konta Klienta kończy się błędem 403 Forbidden.

Sekcja B: Zarządzanie Bazą Ćwiczeń (Trener)
ID: US-002 Tytuł: Przeglądanie bazy ćwiczeń Opis: Jako Trener, chcę przeglądać listę dostępnych ćwiczeń systemowych oraz własnych, aby wiedzieć, jakie zasoby mam do dyspozycji. Kryteria akceptacji:

Lista wyświetla ćwiczenia systemowe (oznaczone jako domyślne) i ćwiczenia dodane przez trenera.

Lista pozwala na filtrowanie po partii mięśniowej.

Lista pozwala na wyszukiwanie po nazwie ćwiczenia.

ID: US-003 Tytuł: Dodawanie własnego ćwiczenia Opis: Jako Trener, chcę dodać nowe, niestandardowe ćwiczenie do swojej biblioteki, aby móc je wykorzystywać w planach moich podopiecznych. Kryteria akceptacji:

Trener może wprowadzić nazwę ćwiczenia.

Trener musi wybrać partię mięśniową z predefiniowanej listy (dropdown).

Po zapisaniu, ćwiczenie jest natychmiast dostępne na liście wyboru w kreatorze planu.

Ćwiczenie jest widoczne tylko dla trenera, który je stworzył.

ID: US-004 Tytuł: Usuwanie własnego ćwiczenia (Soft Delete) Opis: Jako Trener, chcę usunąć błędnie dodane lub nieużywane ćwiczenie ze swojej bazy, aby zachować porządek. Kryteria akceptacji:

Opcja usuwania jest dostępna tylko dla ćwiczeń własnych trenera (nie systemowych).

Po usunięciu ćwiczenie znika z listy wyboru przy tworzeniu nowych planów.

Ćwiczenie usunięte pozostaje widoczne w planach treningowych utworzonych przed momentem usunięcia (nie znika z historii).

Sekcja C: Tworzenie i Edycja Planu (Trener)
ID: US-005 Tytuł: Utworzenie nagłówka nowego planu Opis: Jako Trener, chcę utworzyć nowy plan treningowy przypisany do konkretnego klienta, aby rozpocząć proces planowania. Kryteria akceptacji:

Trener może nadać nazwę planu.

Trener wybiera klienta z listy swoich aktywnych podopiecznych.

Trener może przypisać plan do samego siebie (konto testowe).

Utworzony plan ma status "Aktywny".

ID: US-006 Tytuł: Zarządzanie jednostkami treningowymi Opis: Jako Trener, chcę dodawać i duplikować jednostki treningowe (np. Dzień A), aby szybko zbudować strukturę tygodnia. Kryteria akceptacji:

Możliwość dodania nowej, pustej jednostki treningowej z nazwą.

Możliwość zduplikowania istniejącej jednostki wraz ze wszystkimi ćwiczeniami i parametrami.

Możliwość usunięcia jednostki treningowej.

ID: US-007 Tytuł: Dodawanie i konfiguracja ćwiczeń w planie Opis: Jako Trener, chcę dodać ćwiczenia do jednostki i określić ich parametry, aby klient wiedział dokładnie co ma robić. Kryteria akceptacji:

Wyszukiwarka pozwala wybrać ćwiczenie z bazy.

Trener uzupełnia pola: Serie, Powtórzenia, Ciężar/RPE, Tempo, Przerwa (wszystkie jako pola tekstowe).

Możliwość dodania opcjonalnej notatki tekstowej do ćwiczenia.

Możliwość zmiany kolejności ćwiczeń w ramach jednostki (góra/dół).

ID: US-008 Tytuł: Archiwizacja planu Opis: Jako Trener, chcę zmienić status planu na archiwalny, aby klient wiedział, który plan jest obecnie obowiązujący. Kryteria akceptacji:

Możliwość ręcznej zmiany statusu planu z Aktywny na Zarchiwizowany.

Zarchiwizowane plany są przenoszone do osobnej sekcji/widoku u klienta.

ID: US-012 Tytuł: Przeglądanie listy planów (Trener) Opis: Jako Trener, chcę widzieć zbiorczą listę wszystkich utworzonych planów, aby łatwo zarządzać nimi i nawigować do edycji. Kryteria akceptacji:

Widok listy planów wyświetla kafelki lub wiersze z nazwą planu, przypisanym klientem i datą ostatniej modyfikacji.

Dostępne są zakładki lub filtry pozwalające przełączać się między planami "Aktywnymi" a "Zarchiwizowanymi".

Kliknięcie w plan przenosi do widoku edycji (Kreatora).

Widok zawiera przycisk "Utwórz plan" inicjujący proces tworzenia nowego planu.

Sekcja D: Odbiór Planu (Klient)
ID: US-009 Tytuł: Powiadomienie o nowym planie Opis: Jako Klient, chcę widzieć powiadomienie na pulpicie aplikacji, gdy trener przydzieli mi nowy plan, aby nie przegapić aktualizacji. Kryteria akceptacji:

Na Dashboardzie klienta pojawia się widget z listą ostatnich powiadomień.

Kliknięcie w powiadomienie przenosi do widoku szczegółów nowego planu.

Powiadomienie znika lub zmienia status na "przeczytane" po kliknięciu.

ID: US-010 Tytuł: Przeglądanie listy planów Opis: Jako Klient, chcę widzieć listę moich planów z podziałem na pakiety (foldery), aby łatwo odnaleźć właściwy trening. Kryteria akceptacji:

Widok "Mój Plan" wyświetla kafelki z nazwami planów.

Aktywne plany są wyróżnione i widoczne na górze listy.

Dostęp do archiwum planów jest możliwy, ale oddzielony wizualnie.

ID: US-011 Tytuł: Realizacja treningu (Widok Mobile) Opis: Jako Klient, chcę wygodnie odczytywać parametry ćwiczeń na telefonie bez przewijania na boki i odznaczać wykonane zadania. Kryteria akceptacji:

Parametry ćwiczenia (Serie, Reps, Tempo, etc.) są ułożone wertykalnie (jedno pod drugim lub w blokach) wewnątrz kafelka ćwiczenia.

Lista ćwiczeń działa jak akordeon - kliknięcie rozwija/zwija szczegóły.

Przy każdym ćwiczeniu znajduje się checkbox.

Stan checkboxa (zaznaczony/odznaczony) zapisuje się w bazie danych i jest pamiętany po odświeżeniu strony.

6. Metryki sukcesu
Wdrożenie modułu zostanie uznane za sukces, jeśli po 3 miesiącach od uruchomienia MVP zostaną osiągnięte następujące wskaźniki:

Adopcja Bazy Systemowej: 80% wszystkich ćwiczeń dodawanych do planów pochodzi z bazy systemowej (Seed Data), a tylko 20% to własne ćwiczenia trenerów. Oznaczać to będzie wysoką jakość przygotowanej bazy startowej.

Time-to-Value: Średni czas tworzenia kompletnego planu treningowego (np. 3 jednostki po 6 ćwiczeń) przez trenera wynosi poniżej 10 minut, dzięki wykorzystaniu funkcji duplikacji i szybkiego wyszukiwania.

Engagement (Zaangażowanie klienta): 60% aktywnych klientów, którzy otrzymali plan, regularnie korzysta z funkcji checkboxów (odznacza minimum 1 trening w tygodniu).

Jakość UX Mobile: Brak zgłoszeń do supportu dotyczących problemów z wyświetlaniem tabeli treningowej na ekranach o szerokości poniżej 375px (iPhone SE/mini).
