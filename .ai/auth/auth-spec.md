# Specyfikacja Architektury Modułu Autentykacji - CoachFlow

## 1. Architektura Interfejsu Użytkownika (Frontend - Vue.js 3)

### 1.1. Zmiany w strukturze aplikacji

#### 1.1.1. Layouty

Wprowadzone zostaną dwa główne layouty, aby zarządzać widokami dla użytkowników zalogowanych i niezalogowanych:

- **`AuthLayout.vue`**: Prosty layout dla stron logowania, rejestracji i odzyskiwania hasła. Będzie zawierał centralnie umieszczony kontener na formularz oraz minimalne elementy brandingu (logo).
- **`DefaultLayout.vue`**: Główny layout aplikacji dla zalogowanych użytkowników. Będzie zawierał nawigację (header, sidebar), stopkę oraz centralny obszar (`<router-view>`) na dynamiczne treści (dashboard, profil, kalendarz).

#### 1.1.2. Strony (Widoki)

Utworzone zostaną następujące strony w katalogu `src/views/`:

- **`RegisterPage.vue`**: Strona rejestracji, korzystająca z `AuthLayout`. Będzie zawierać komponent `RegisterForm`.
- **`LoginPage.vue`**: Strona logowania, korzystająca z `AuthLayout`. Będzie zawierać komponent `LoginForm` oraz linki do rejestracji i odzyskiwania hasła.
- **`ForgotPasswordPage.vue`**: Strona do zainicjowania procesu odzyskiwania hasła.
- **`ResetPasswordPage.vue`**: Strona do ustawienia nowego hasła na podstawie tokenu z e-maila.

#### 1.1.3. Rozszerzenie istniejących elementów

- **`Header.vue`**: Komponent nagłówka w `DefaultLayout` zostanie rozszerzony o logikę warunkowego wyświetlania:
  - Dla gości: przyciski "Zaloguj się" i "Zarejestruj się".
  - Dla zalogowanych użytkowników: nazwa użytkownika, awatar oraz menu rozwijane z opcjami "Profil" i "Wyloguj".

### 1.2. Odpowiedzialność komponentów

#### 1.2.1. Komponenty formularzy

- **`RegisterForm.vue`**:
  - **Odpowiedzialność**: Zarządzanie stanem formularza rejestracji, walidacja pól i komunikacja z `authStore`.
  - **Pola**: Imię (`<Input>`), E-mail (`<Input>`), Hasło (`<Input type="password">`), Wybór roli (`<RadioGroup>`: Trener/Użytkownik), Zgoda na regulamin (`<Checkbox>`).
  - **Logika**: Po pomyślnej walidacji wywołuje akcję `register` z `authStore`, przekazując dane. Obsługuje stany ładowania i błędu.
- **`LoginForm.vue`**:
  - **Odpowiedzialność**: Zarządzanie stanem formularza logowania.
  - **Pola**: E-mail (`<Input>`), Hasło (`<Input type="password">`).
  - **Logika**: Wywołuje akcję `login` z `authStore`. Obsługuje komunikaty o błędnych danych logowania.

### 1.3. Zarządzanie stanem (Pinia)

Utworzony zostanie moduł `authStore` (`src/stores/auth.ts`) do globalnego zarządzania stanem autentykacji.

- **`state`**:
  - `user: User | null` - dane zalogowanego użytkownika.
  - `accessToken: string | null` - token dostępowy.
  - `isAuthenticated: boolean` - flaga informująca o stanie zalogowania.
- **`actions`**:
  - `register(credentials: RegisterDto)`: Wysyła żądanie do API, po sukcesie zapisuje tokeny i dane użytkownika, aktualizuje stan.
  - `login(credentials: LoginDto)`: Analogicznie do rejestracji.
  - `logout()`: Wysyła żądanie wylogowania do API, czyści tokeny i stan w `authStore`, przekierowuje na stronę główną.
  - `fetchUser()`: Pobiera dane użytkownika na podstawie tokena (np. po odświeżeniu strony).
  - `refreshToken()`: Odświeża token dostępowy przy użyciu refresh tokena.

### 1.4. Routing (Vue Router)

Konfiguracja `src/router/index.ts` zostanie rozbudowana o logikę ochrony tras.

- **Meta-pola**: Trasy wymagające autentykacji otrzymają meta-pole, np. `meta: { requiresAuth: true }`.
- **Navigation Guard**: Globalny guard (`router.beforeEach`) będzie sprawdzał:
  1.  Czy trasa wymaga autentykacji (`to.meta.requiresAuth`).
  2.  Czy użytkownik jest zalogowany (na podstawie `authStore.isAuthenticated`).
  3.  Jeśli trasa jest chroniona, a użytkownik nie jest zalogowany, nastąpi przekierowanie na `/login`.

### 1.5. Walidacja i obsługa błędów

- **Walidacja kliencka**: Użycie biblioteki `VeeValidate` z `yup` lub `zod` do definicji schematów walidacji dla formularzy.
- **Komunikaty**:
  - "Pole jest wymagane."
  - "Proszę podać poprawny adres e-mail."
  - "Hasło musi mieć co najmniej 8 znaków."
  - "Adres e-mail jest już zajęty." (błąd z API)
  - "Nieprawidłowy e-mail lub hasło." (błąd z API)

---

## 2. Logika Backendowa (NestJS)

### 2.1. Struktura modułowa

- **`AuthModule`**: Główny moduł odpowiedzialny za logikę autentykacji. Będzie zawierał `AuthController`, `AuthService` oraz konfigurację strategii Passport.js.
- **`UsersModule`**: Moduł do zarządzania użytkownikami. Będzie zawierał `UsersService` i `UsersRepository` (oparty o TypeORM).

### 2.2. Endpointy API

Wszystkie endpointy będą zgrupowane pod prefiksem `/api/auth`.

- `POST /register`
  - **Kontroler**: `AuthController.register`
  - **Body**: `RegisterDto`
  - **Odpowiedź (sukces)**: `201 Created` - `{ user: User, accessToken: string, refreshToken: string }`
  - **Odpowiedź (błąd)**: `409 Conflict` (e-mail zajęty), `400 Bad Request` (błąd walidacji).
- `POST /login`
  - **Kontroler**: `AuthController.login`
  - **Body**: `LoginDto`
  - **Odpowiedź (sukces)**: `200 OK` - `{ user: User, accessToken: string, refreshToken: string }`
  - **Odpowiedź (błąd)**: `401 Unauthorized` (błędne dane), `400 Bad Request`.
- `POST /logout`
  - **Kontroler**: `AuthController.logout`
  - **Zabezpieczenie**: Wymaga `accessToken`.
  - **Odpowiedź**: `200 OK`.
- `POST /refresh`
  - **Kontroler**: `AuthController.refresh`
  - **Body**: `{ refreshToken: string }`
  - **Odpowiedź**: `200 OK` - `{ accessToken: string }`.

### 2.3. Modele danych (DTO i Encje)

#### 2.3.1. DTO (Data Transfer Objects)

Użycie `class-validator` do walidacji.

- **`RegisterDto.ts`**:
  - `name: string` (`@IsString`, `@IsNotEmpty`)
  - `email: string` (`@IsEmail`)
  - `password: string` (`@MinLength(8)`)
  - `role: UserRole` (`@IsEnum(UserRole)`)
  - `termsAccepted: boolean` (`@IsBoolean`, `@Equals(true)`)
- **`LoginDto.ts`**:
  - `email: string` (`@IsEmail`)
  - `password: string` (`@IsNotEmpty`)

#### 2.3.2. Encja (TypeORM)

- **`User.entity.ts`**:
  - `id: number` (Primary Key, auto-increment)
  - `name: string`
  - `email: string` (`@Unique`)
  - `password: string` (`@Column({ select: false })` - aby nie był zwracany domyślnie)
  - `role: UserRole` (enum: `'TRAINER'`, `'USER'`)
  - `createdAt: Date`, `updatedAt: Date`

### 2.4. Obsługa wyjątków

Wykorzystanie wbudowanych w NestJS `Exception Filters`.

- `BadRequestException`: Błędy walidacji DTO.
- `UnauthorizedException`: Błędne dane logowania, nieważny token.
- `ConflictException`: Próba rejestracji na istniejący e-mail.
- `NotFoundException`: Użytkownik nie znaleziony.

---

## 3. System Autentykacji i Autoryzacji

### 3.1. Strategia autentykacji: Passport.js + JWT

**Uzasadnienie wyboru**:
Strategia oparta o JWT (JSON Web Tokens) jest idealna dla architektury SPA + API z kilku powodów:

1.  **Bezstanowość (Statelessness)**: Serwer nie musi przechowywać stanu sesji użytkownika. Każde żądanie zawiera token, który sam w sobie jest dowodem tożsamości. To upraszcza skalowanie aplikacji.
2.  **Elastyczność**: Tokeny JWT mogą być używane do autentykacji w różnych serwisach (mikroserwisy, aplikacje mobilne).
3.  **Wydajność**: Weryfikacja tokena po stronie serwera jest szybka, ponieważ opiera się na sprawdzeniu podpisu cyfrowego, a nie na odpytywaniu bazy danych.

Biblioteki `@nestjs/passport` i `passport-jwt` to standard w ekosystemie NestJS, zapewniając solidną i łatwą w integracji implementację tej strategii.

### 3.2. Mechanizm tokenów JWT

Zaimplementowany zostanie mechanizm oparty na dwóch typach tokenów:

- **Access Token**:
  - **Przeznaczenie**: Dostęp do chronionych zasobów API.
  - **Payload**: `userId`, `role`.
  - **Czas życia**: Krótki (np. 15 minut), aby zminimalizować ryzyko w przypadku przejęcia.
  - **Przechowywanie (Frontend)**: W pamięci aplikacji (np. w `authStore` Pinia).
- **Refresh Token**:
  - **Przeznaczenie**: Uzyskanie nowego `accessToken` bez konieczności ponownego logowania.
  - **Czas życia**: Długi (np. 7 dni).
  - **Przechowywanie (Backend)**: Będzie haszowany i przechowywany w bazie danych, powiązany z użytkownikiem, aby umożliwić jego unieważnienie (np. przy wylogowaniu).
  - **Przechowywanie (Frontend)**: W bezpiecznym ciasteczku `HttpOnly`, co chroni go przed atakami XSS.

### 3.3. Implementacja Guardów

- **`JwtAuthGuard.ts`**:
  - Będzie rozszerzał domyślny `AuthGuard('jwt')`.
  - Używany jako dekorator `@UseGuards(JwtAuthGuard)` nad endpointami, które wymagają zalogowanego użytkownika.
  - Guard automatycznie zweryfikuje `accessToken` z nagłówka `Authorization: Bearer <token>`, a `JwtStrategy` zdekoduje payload i dołączy obiekt `user` do obiektu `request`.
- **`RolesGuard.ts` (Opcjonalnie dla przyszłej rozbudowy)**:
  - Implementacja `CanActivate` do sprawdzania ról.
  - Używany z niestandardowym dekoratorem `@Roles('TRAINER')` do zabezpieczania endpointów dostępnych tylko dla określonych ról.

### 3.4. Bezpieczeństwo haseł

- **Biblioteka**: `bcrypt`.
- **Proces**:
  1.  **Rejestracja / Zmiana hasła**: Hasło podane przez użytkownika jest haszowane za pomocą `bcrypt.hash()` przed zapisaniem do bazy danych.
  2.  **Logowanie**: Hasło podane w formularzu jest porównywane z hashem z bazy danych za pomocą `bcrypt.compare()`.

### 3.5. Cykl życia autentykacji

- **Rejestracja**:
  1.  Użytkownik wysyła dane (`RegisterDto`).
  2.  `AuthController` -> `AuthService`.
  3.  `AuthService` sprawdza, czy e-mail istnieje (przez `UsersService`).
  4.  Jeśli nie, `UsersService` haszuje hasło i tworzy nowego użytkownika w bazie.
  5.  `AuthService` generuje `accessToken` i `refreshToken`.
  6.  Tokeny i dane użytkownika są zwracane do klienta.
- **Logowanie**:
  1.  Użytkownik wysyła dane (`LoginDto`).
  2.  `AuthService.validateUser(email, password)` porównuje hasło.
  3.  Jeśli dane są poprawne, `AuthService` generuje nowe tokeny.
- **Wylogowanie**:
  1.  Frontend wysyła żądanie do `POST /logout`.
  2.  Backend usuwa (lub unieważnia) `refreshToken` z bazy danych.
  3.  Frontend usuwa `accessToken` z pamięci i `refreshToken` (ciasteczko).
- **Odzyskiwanie hasła**:
  1.  Użytkownik podaje e-mail na `ForgotPasswordPage`.
  2.  Backend generuje unikalny, krótkożyciowy token, haszuje go i zapisuje w tabeli `password_resets` powiązanej z `userId`.
  3.  Wysyła e-mail z linkiem zawierającym token.
  4.  Użytkownik klika link, wprowadza nowe hasło.
  5.  Backend weryfikuje token, aktualizuje hasło użytkownika (po uprzednim haszowaniu) i usuwa token odzyskiwania.
