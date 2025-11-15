<architecture_analysis>
1.  **Komponenty:**
    *   **Frontend (Vue.js 3):**
        *   Layouty: `AuthLayout.vue`, `DefaultLayout.vue`
        *   Strony (Widoki): `RegisterPage.vue`, `LoginPage.vue`, `ForgotPasswordPage.vue`, `ResetPasswordPage.vue`
        *   Komponenty formularzy: `RegisterForm.vue`, `LoginForm.vue`
        *   Komponenty UI: `Header.vue`
        *   Zarządzanie stanem (Pinia): `authStore`
        *   Routing: `Vue Router` z `Navigation Guard`
        *   Walidacja: `VeeValidate` + `zod`/`yup`
    *   **Backend (NestJS):**
        *   Moduły: `AuthModule`, `UsersModule`
        *   Kontroler: `AuthController`
        *   Serwisy: `AuthService`, `UsersService`
        *   DTOs: `RegisterDto`, `LoginDto`
        *   Encja: `User.entity.ts`
        *   Strategia: `Passport.js` + `JWT`
        *   Guards: `JwtAuthGuard`

2.  **Główne strony i komponenty:**
    *   Strony publiczne (`/login`, `/register`) używają `AuthLayout.vue`.
    *   `RegisterPage.vue` zawiera `RegisterForm.vue`.
    *   `LoginPage.vue` zawiera `LoginForm.vue`.
    *   Strony chronione (`/dashboard`) używają `DefaultLayout.vue`.
    *   `DefaultLayout.vue` zawiera `Header.vue` z logiką warunkową.

3.  **Przepływ danych:**
    *   Użytkownik wypełnia formularz (`RegisterForm`/`LoginForm`).
    *   Komponent formularza wywołuje akcję w `authStore` (`register`/`login`).
    *   `authStore` wysyła żądanie do API (`/api/auth/register` lub `/api/auth/login`).
    *   `AuthController` obsługuje żądanie, waliduje DTO i wywołuje `AuthService`.
    *   `AuthService` realizuje logikę biznesową (weryfikacja, tworzenie użytkownika, generowanie tokenów).
    *   API zwraca `accessToken`, `refreshToken` i dane użytkownika.
    *   `authStore` zapisuje tokeny i dane, aktualizując stan `isAuthenticated`.
    *   `Navigation Guard` w Vue Router reaguje na zmianę stanu, zezwalając lub blokując dostęp do tras.
    *   Komponenty (np. `Header.vue`) subskrybują zmiany w `authStore` i aktualizują swój widok.

4.  **Opis funkcjonalności komponentów:**
    *   **`AuthLayout.vue`**: Minimalistyczny layout dla widoków autentykacji.
    *   **`DefaultLayout.vue`**: Główny layout aplikacji z nawigacją dla zalogowanych użytkowników.
    *   **`RegisterForm.vue` / `LoginForm.vue`**: Zarządzają stanem formularza, walidacją i interakcją z `authStore`.
    *   **`authStore` (Pinia)**: Centralne miejsce zarządzania stanem autentykacji (użytkownik, tokeny, status zalogowania).
    *   **`Navigation Guard` (Vue Router)**: Chroni trasy wymagające zalogowania.
    *   **`AuthController`**: Odbiera żądania HTTP i deleguje je do serwisu.
    *   **`AuthService`**: Implementuje logikę uwierzytelniania, haszowanie haseł i generowanie tokenów JWT.
    *   **`JwtAuthGuard`**: Zabezpiecza endpointy API, weryfikując `accessToken`.
</architecture_analysis>
<mermaid_diagram>
```mermaid
flowchart TD
    subgraph "Frontend (Vue.js 3)"
        direction LR
        subgraph "Strony (Widoki)"
            LoginPage["LoginPage.vue"]
            RegisterPage["RegisterPage.vue"]
        end

        subgraph "Layouty"
            AuthLayout["AuthLayout.vue"]
            DefaultLayout["DefaultLayout.vue"]
        end

        subgraph "Komponenty UI"
            LoginForm["LoginForm.vue"]
            RegisterForm["RegisterForm.vue"]
            Header["Header.vue (zaktualizowany)"]
        end

        subgraph "Zarządzanie Stanem i Routing"
            AuthStore["authStore (Pinia)"]
            Router["Vue Router + Navigation Guard"]
        end

        User(Użytkownik) -->|Interakcja| LoginPage
        User -->|Interakcja| RegisterPage

        LoginPage -- Zawiera --> LoginForm
        RegisterPage -- Zawiera --> RegisterForm
        LoginPage -- Używa --> AuthLayout
        RegisterPage -- Używa --> AuthLayout

        LoginForm -- "Wywołuje akcję login()" --> AuthStore
        RegisterForm -- "Wywołuje akcję register()" --> AuthStore
        
        AuthStore -- "Aktualizuje stan (isAuthenticated)" --> Router
        Router -- "Chroni trasy" --> DashboardPage
        
        DashboardPage["Strony Chronione (np. Dashboard)"] -- Używa --> DefaultLayout
        DefaultLayout -- Zawiera --> Header
        Header -- "Odczytuje stan" --> AuthStore

    end

    subgraph "Backend (NestJS API)"
        direction LR
        
        subgraph "Moduły API"
            AuthController["AuthController"]
            AuthService["AuthService"]
            UsersService["UsersService"]
        end

        subgraph "Ochrona i Dane"
            JwtGuard["JwtAuthGuard"]
            UserEntity["User (Encja)"]
            RegisterDTO["RegisterDTO"]
            LoginDTO["LoginDTO"]
        end

        AuthController -- Waliduje --> RegisterDTO
        AuthController -- Waliduje --> LoginDTO
        AuthController -- Używa --> AuthService
        AuthService -- Używa --> UsersService
        UsersService -- Operacje CRUD --> Database[(Baza Danych)]
        
        ProtectedEndpoints["Chronione Endpointy API"] -- "Używa @UseGuards()" --> JwtGuard
    end

    AuthStore -- "POST /api/auth/login\nPOST /api/auth/register" --> AuthController
    AuthController -- "Zwraca User, accessToken, refreshToken" --> AuthStore
    
    subgraph "Cykl Życia Tokenów"
        direction TB
        AuthService -- "Generuje" --> AccessToken["Access Token (15 min)"]
        AuthService -- "Generuje" --> RefreshToken["Refresh Token (7 dni)"]
        
        AuthStore -- "Przechowuje w pamięci" --> AccessToken
        Browser["Przeglądarka"] -- "Przechowuje w HttpOnly Cookie" --> RefreshToken
        
        AuthStore -- "Wysyła w nagłówku 'Authorization'" --> ProtectedEndpoints
        ProtectedEndpoints -- "Weryfikuje" --> AccessToken
    end

    classDef vueComponent fill:#42b883,stroke:#35495e,stroke-width:2px,color:#fff;
    classDef nestComponent fill:#e0234e,stroke:#2b2b2b,stroke-width:2px,color:#fff;
    classDef store fill:#f7df1e,stroke:#000,stroke-width:2px,color:#000;
    classDef other fill:#f0f0f0,stroke:#333,stroke-width:2px;

    class LoginPage,RegisterPage,LoginForm,RegisterForm,Header,AuthLayout,DefaultLayout,DashboardPage vueComponent;
    class AuthController,AuthService,UsersService,JwtGuard,UserEntity,RegisterDTO,LoginDTO nestComponent;
    class AuthStore store;
    class User,Browser,Database,ProtectedEndpoints,AccessToken,RefreshToken other;
```
</mermaid_diagram>
