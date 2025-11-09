# Plan implementacji widoku Strony Głównej (Home Page)

## 1. Przegląd

Celem tego widoku jest stworzenie strony głównej (Home Page) dla aplikacji CoachFlow. Strona ta pełni rolę wizytówki aplikacji dla niezalogowanych użytkowników (gości). Jej głównym zadaniem jest przedstawienie propozycji wartości produktu, wyjaśnienie korzyści płynących z jego używania zarówno dla trenerów, jak i klientów, oraz zachęcenie do podjęcia działania poprzez wyraźne przyciski Call-to-Action (CTA). Widok będzie w pełni statyczny i nie będzie wymagał integracji z żadnym endpointem API.

## 2. Routing widoku

Widok strony głównej powinien być dostępny pod głównym adresem URL aplikacji.

- **Ścieżka:** `/`
- **Nazwa routingu:** `home`

## 3. Struktura komponentów

Widok zostanie zbudowany w oparciu o architekturę komponentową. Poniżej przedstawiono hierarchię głównych komponentów, które należy utworzyć.

```
/src/views/HomePage.vue
└── /src/components/views/home/
    ├── HeroSection.vue
    │   └── shadcn-vue/Button
    └── BenefitsSection.vue
        └── (elementy statyczne)
```

- **HomePage.vue:** Główny komponent widoku, który agreguje i układa poszczególne sekcje.
- **HeroSection.vue:** Sekcja "above the fold" zawierająca główne hasło, krótki opis i przyciski CTA.
- **BenefitsSection.vue:** Sekcja prezentująca kluczowe korzyści aplikacji w podziale na role (trener, klient).

## 4. Szczegóły komponentów

### HomePage.vue

- **Opis komponentu:** Jest to kontener dla całej strony głównej. Jego rolą jest zaimportowanie i wyświetlenie w odpowiedniej kolejności wszystkich sekcji składowych (`HeroSection`, `BenefitsSection`).
- **Główne elementy:**
  - `<template>` zawierający komponenty `<HeroSection />` i `<BenefitsSection />`.
  - Blok `<script setup lang="ts">` z importami komponentów.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### HeroSection.vue

- **Opis komponentu:** Najważniejsza sekcja strony, widoczna zaraz po wejściu. Ma za zadanie w ciągu kilku sekund przekazać kluczową wartość aplikacji i skierować użytkownika do dalszych działań.
- **Główne elementy:**
  - `<h1>`: Główne hasło marketingowe (propozycja wartości), np. "Twoje centrum zarządzania treningiem".
  - `<p>`: Krótki tekst uzupełniający, wyjaśniający, czym jest CoachFlow.
  - Dwa komponenty `<Button>` z biblioteki `shadcn-vue`:
    1. Przycisk "Znajdź trenera" (wariant podstawowy).
    2. Przycisk "Zostań trenerem" (wariant `secondary` lub `outline`).
- **Obsługiwane interakcje:**
  - **Kliknięcie "Znajdź trenera":** Nawiguje użytkownika do widoku przeglądania listy trenerów (np. `/trainers`).
  - **Kliknięcie "Zostań trenerem":** Nawiguje użytkownika do strony rejestracji (np. `/register?role=trainer`).
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### BenefitsSection.vue

- **Opis komponentu:** Sekcja ta ma na celu szczegółowe przedstawienie korzyści płynących z używania aplikacji. Powinna być wizualnie podzielona na dwie części, aby jasno komunikować wartość dla obu grup docelowych.
- **Główne elementy:**
  - `<h2>`: Nagłówek sekcji, np. "Dlaczego CoachFlow?".
  - Kontener (np. `div` z `grid grid-cols-1 md:grid-cols-2 gap-8`) dzielący sekcję na dwie kolumny na większych ekranach.
  - **Kolumna dla Trenerów:**
    - `<h3>`: Nagłówek "Dla Trenerów".
    - Lista (`<ul>`) korzyści, np. "Zarządzaj grafikiem w jednym miejscu", "Prezentuj swoją ofertę profesjonalnie".
  - **Kolumna dla Klientów:**
    - `<h3>`: Nagłówek "Dla Klientów".
    - Lista (`<ul>`) korzyści, np. "Rezerwuj sesje w kilka kliknięć", "Miej wgląd w swój kalendarz treningów".
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

## 5. Typy

Dla tego widoku nie są wymagane żadne nowe, złożone typy danych (DTO/ViewModel), ponieważ cała treść ma charakter statyczny i będzie zdefiniowana bezpośrednio w komponentach.

## 6. Zarządzanie stanem

Widok jest w pełni statyczny, dlatego nie wymaga globalnego zarządzania stanem (np. Pinia). Ewentualny stan lokalny (jeśli okaże się potrzebny) będzie zarządzany wewnątrz komponentów przy użyciu `ref` lub `reactive` z Vue 3 Composition API. Nie przewiduje się potrzeby tworzenia customowych hooków. Do obsługi nawigacji zostanie wykorzystany hook `useRouter` z `vue-router`.

## 7. Integracja API

Brak integracji z API. Wszystkie dane wyświetlane na stronie głównej są statyczne.

## 8. Interakcje użytkownika

- **Przewijanie strony:** Użytkownik może swobodnie przewijać zawartość strony.
- **Kliknięcie przycisku "Znajdź trenera":**
  - **Oczekiwany rezultat:** Aplikacja przechodzi na stronę z listą dostępnych trenerów (`/trainers`).
- **Kliknięcie przycisku "Zostań trenerem":**
  - **Oczekiwany rezultat:** Aplikacja przechodzi na stronę rejestracji, idealnie z preselekcją roli trenera (`/register?role=trainer`).

## 9. Warunki i walidacja

Brak warunków i walidacji po stronie frontendu, ponieważ widok nie zawiera żadnych formularzy ani danych wejściowych od użytkownika.

## 10. Obsługa błędów

Ponieważ widok jest statyczny i nie wykonuje żadnych operacji asynchronicznych (np. zapytań do API), ryzyko wystąpienia błędów jest minimalne. Należy jedynie zadbać o to, aby linki nawigacyjne (w przyciskach CTA) prowadziły do poprawnie zdefiniowanych ścieżek w routerze. W przypadku błędnej konfiguracji routera, globalny mechanizm obsługi błędów 404 powinien przechwycić żądanie.

## 11. Kroki implementacji

1.  **Utworzenie struktury plików:**
    -   Stwórz plik widoku: `src/views/HomePage.vue`.
    -   Stwórz folder dla komponentów dedykowanych: `src/components/views/home/`.
    -   Wewnątrz nowego folderu stwórz pliki: `HeroSection.vue` i `BenefitsSection.vue`.
2.  **Konfiguracja routingu:**
    -   W pliku konfiguracyjnym `vue-router` (np. `src/router/index.ts`) dodaj nowy wpis dla strony głównej:
        ```typescript
        {
          path: '/',
          name: 'home',
          component: () => import('@/views/HomePage.vue')
        }
        ```
3.  **Implementacja `HomePage.vue`:**
    -   Zaimportuj `HeroSection` i `BenefitsSection`.
    -   Umieść je w szablonie w odpowiedniej kolejności.
4.  **Implementacja `HeroSection.vue`:**
    -   Dodaj elementy HTML (`h1`, `p`). Wypełnij je treścią marketingową.
    -   Zaimportuj komponent `Button` z `shadcn-vue`.
    -   Dodaj dwa przyciski "Znajdź trenera" i "Zostań trenerem".
    -   Użyj `useRouter` do zaimplementowania nawigacji po kliknięciu w przyciski.
    -   Ostyluj sekcję za pomocą klas Tailwind CSS, dbając o jej responsywność (np. wycentrowanie tekstu, odpowiednie marginesy).
5.  **Implementacja `BenefitsSection.vue`:**
    -   Stwórz strukturę HTML z nagłówkiem `h2` i dwiema kolumnami.
    -   Wypełnij każdą kolumnę treścią opisującą korzyści dla danej roli.
    -   Zastosuj klasy Tailwind CSS, aby uzyskać responsywny układ (np. `grid` na desktopie, `flex-col` na mobile).
6.  **Stylowanie i responsywność:**
    -   Przejrzyj wszystkie komponenty i upewnij się, że wygląd jest spójny i poprawnie skaluje się na różnych szerokościach ekranu (mobile, tablet, desktop) zgodnie z założeniami PRD.
7.  **Przegląd i testowanie:**
    -   Uruchom aplikację i manualnie przetestuj stronę główną: sprawdź, czy wszystkie teksty są widoczne, czy przyciski CTA działają i prowadzą do właściwych podstron, oraz czy layout nie psuje się na różnych urządzeniach.
