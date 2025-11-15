sequenceDiagram
autonumber

    participant Użytkownik
    participant "Frontend (Vue.js)" as Frontend
    participant "Backend (NestJS API)" as Backend
    participant "Baza Danych (PostgreSQL)" as DB

    %% Rejestracja Użytkownika
    Użytkownik->>Frontend: Wypełnia formularz rejestracji
    activate Frontend
    Frontend->>Frontend: Walidacja danych (VeeValidate)
    Frontend->>Backend: POST /api/auth/register (z RegisterDto)
    activate Backend

    Backend->>DB: Sprawdź czy email istnieje
    activate DB
    DB-->>Backend: Email nie istnieje
    deactivate DB

    Backend->>Backend: Haszuj hasło (bcrypt)
    Backend->>DB: Zapisz nowego użytkownika
    activate DB
    DB-->>Backend: Użytkownik zapisany
    deactivate DB

    Backend->>Backend: Generuj Access Token (JWT, 15 min)
    Backend->>Backend: Generuj Refresh Token (JWT, 7 dni)
    Backend->>DB: Zapisz zhaszowany Refresh Token
    activate DB
    DB-->>Backend: Token zapisany
    deactivate DB

    Backend-->>Frontend: 201 Created (user, accessToken, refreshToken)
    deactivate Backend

    Frontend->>Frontend: Zapisz Access Token w Pinia store
    Frontend->>Frontend: Zapisz Refresh Token w HttpOnly cookie
    Frontend-->>Użytkownik: Przekierowanie do panelu (Dashboard)
    deactivate Frontend

    %% Logowanie Użytkownika
    Użytkownik->>Frontend: Wypełnia formularz logowania
    activate Frontend
    Frontend->>Backend: POST /api/auth/login (z LoginDto)
    activate Backend

    Backend->>DB: Znajdź użytkownika po emailu
    activate DB
    DB-->>Backend: Zwróć użytkownika (z hashem hasła)
    deactivate DB

    Backend->>Backend: Porównaj hasła (bcrypt.compare)

    alt Dane poprawne
        Backend->>Backend: Generuj nowy Access Token i Refresh Token
        Backend->>DB: Zaktualizuj Refresh Token w bazie
        activate DB
        DB-->>Backend: Token zaktualizowany
        deactivate DB
        Backend-->>Frontend: 200 OK (user, accessToken, refreshToken)

        Frontend->>Frontend: Zapisz tokeny (Pinia, cookie)
        Frontend-->>Użytkownik: Przekierowanie do panelu
    else Dane niepoprawne
        Backend-->>Frontend: 401 Unauthorized
        Frontend-->>Użytkownik: Pokaż błąd logowania
    end
    deactivate Backend
    deactivate Frontend

    %% Odświeżanie tokenu
    Użytkownik->>Frontend: Żądanie chronionego zasobu
    activate Frontend
    Frontend->>Backend: GET /api/protected-resource (z wygasłym tokenem)
    activate Backend
    Backend-->>Frontend: 401 Unauthorized (Token expired)
    deactivate Backend

    Note right of Frontend: Wykryto wygaśnięcie tokenu, inicjalizacja odświeżenia
    Frontend->>Backend: POST /api/auth/refresh (z Refresh Token z cookie)
    activate Backend

    Backend->>DB: Weryfikuj Refresh Token
    activate DB
    DB-->>Backend: Token poprawny
    deactivate DB

    Backend->>Backend: Generuj nowy Access Token
    Backend-->>Frontend: 200 OK (nowy accessToken)
    deactivate Backend

    Frontend->>Frontend: Zapisz nowy Access Token w Pinia
    Frontend->>Backend: Ponów GET /api/protected-resource (z nowym tokenem)
    activate Backend
    Backend-->>Frontend: 200 OK (dane zasobu)
    deactivate Backend
    Frontend-->>Użytkownik: Wyświetl dane
    deactivate Frontend

    %% Wylogowanie
    Użytkownik->>Frontend: Klika "Wyloguj"
    activate Frontend
    Frontend->>Backend: POST /api/auth/logout
    activate Backend

    Backend->>DB: Unieważnij Refresh Token
    activate DB
    DB-->>Backend: Token unieważniony
    deactivate DB
    Backend-->>Frontend: 200 OK
    deactivate Backend

    Frontend->>Frontend: Wyczyść Access Token z Pinia
    Frontend->>Frontend: Usuń cookie z Refresh Tokenem
    Frontend-->>Użytkownik: Przekierowanie na stronę główną
    deactivate Frontend
