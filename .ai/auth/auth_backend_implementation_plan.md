## Plan Implementacji Backendu: Moduł Autentykacji i Autoryzacji

### 1. Założenia i decyzje

*   **Istniejący `UsersModule`**: Plan zakłada istnienie `UsersModule` oraz encji `User` zgodnie z plikami `@module-plan.md` i `@generated-types-summary.md`. `AuthModule` będzie odwoływał się do `UsersModule` w celu zarządzania danymi użytkowników.
*   **Role**: System będzie obsługiwał trzy role: `CLIENT`, `TRAINER`, `ADMIN`. Rola `ADMIN` jest dodana na przyszłość, ale guard zostanie zaimplementowany w sposób, który ją obsłuży.
*   **Rotacja Refresh Tokenów**: Zaimplementowany zostanie mechanizm rotacji refresh tokenów dla zwiększenia bezpieczeństwa.
*   **OAuth**: Logowanie przez zewnętrznych dostawców (np. Google) nie jest w zakresie tego etapu, ale architektura powinna być na tyle elastyczna, aby umożliwić jego dodanie w przyszłości (np. poprzez osobną tabelę `UserConnections`).
*   **Polityka bezpieczeństwa**:
    *   **Hasło**: Wymagana walidacja: min. 8 znaków, wielka litera, cyfra, znak specjalny.
    *   **Access Token TTL**: **30 minut**.
    *   **Refresh Token TTL**: **7 dni** (zgodnie z `@auth-spec.md`).
    *   **Password Reset Token TTL**: **1 godzina**.

### 2. Architektura Modułów

Zostanie wprowadzona następująca struktura modułowa, aby zapewnić separację odpowiedzialności (Separation of Concerns).

**Struktura katalogów:**

```
src/
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   ├── request-password-reset.dto.ts
│   │   └── reset-password.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── dto/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── interfaces/
│   │   └── user-role.enum.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       ├── public.decorator.ts
│       └── roles.decorator.ts
└── tokens/
    ├── entities/
    │   ├── password-reset-token.entity.ts
    │   └── refresh-token.entity.ts
    ├── tokens.module.ts
    └── tokens.service.ts
```

**Opis modułów:**

*   **`AuthModule`**: Centralny moduł do obsługi logiki uwierzytelniania.
    *   **Importuje**: `UsersModule`, `PassportModule`, `JwtModule`, `TokensModule`.
    *   **Eksportuje**: `AuthService` (jeśli potrzebne w innych modułach).
*   **`UsersModule`**: Istniejący moduł do zarządzania operacjami CRUD na użytkownikach.
    *   **Eksportuje**: `UsersService`, aby `AuthModule` mógł tworzyć i weryfikować użytkowników.
*   **`TokensModule`**: Nowy moduł odpowiedzialny za zarządzanie cyklem życia refresh tokenów i tokenów resetowania hasła w bazie danych.
    *   **Importuje**: `TypeOrmModule` dla swoich encji.
    *   **Eksportuje**: `TokensService`.

### 3. Encje i Warstwa Danych

#### 3.1. Modyfikacja encji `User`

Plik: `src/users/entities/user.entity.ts`

Należy zweryfikować, czy istniejąca encja `User` zawiera wszystkie potrzebne pola. Zgodnie z `@module-plan.md`, jej struktura jest odpowiednia. Należy upewnić się, że pole `password` nie jest domyślnie zwracane w zapytaniach.

```typescript
// src/users/entities/user.entity.ts

// ... imports
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../interfaces/user-role.enum.ts';

@Entity()
export class User {
  // ... existing fields: id, name, email, role, etc.

  @Column({ select: false }) // Kluczowe, aby hash hasła nie był zwracany
  password: string;

  // ... relacje
}
```

#### 3.2. Nowe encje

Należy utworzyć dwie nowe encje do przechowywania tokenów.

**`RefreshToken`**

Plik: `src/tokens/entities/refresh-token.entity.ts`

```typescript
// src/tokens/entities/refresh-token.entity.ts
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  token: string; // Hashowany refresh token

  @Column()
  expiresAt: Date;
}
```

**`PasswordResetToken`**

Plik: `src/tokens/entities/password-reset-token.entity.ts`

```typescript
// src/tokens/entities/password-reset-token.entity.ts
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ unique: true })
  token: string; // Hashowany token

  @Column()
  expiresAt: Date;
}
```

#### 3.3. Migracje bazy danych

Należy wygenerować i uruchomić migracje TypeORM w następującej kolejności:

1.  **Migracja 1**: Utworzenie tabel `refresh_tokens` i `password_reset_tokens` z odpowiednimi kluczami obcymi do tabeli `users`.
2.  **Migracja 2**: (Jeśli konieczne) Aktualizacja tabeli `users`, aby dodać `select: false` do kolumny `password`.

### 4. DTO i Walidacja

#### 4.1. `RegisterDto`

Plik: `src/auth/dto/register.dto.ts`

DTO do rejestracji nowego użytkownika.

```typescript
// src/auth/dto/register.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { UserRole } from 'src/users/interfaces/user-role.enum';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must be at least 8 characters long and contain one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
```

#### 4.2. Pozostałe DTO

*   **`LoginDto`**: `email` (`@IsEmail`), `password` (`@IsString`, `@IsNotEmpty`).
*   **`RefreshTokenDto`**: `refreshToken` (`@IsString`, `@IsNotEmpty`).
*   **`RequestPasswordResetDto`**: `email` (`@IsEmail`).
*   **`ResetPasswordDto`**: `token` (`@IsString`, `@IsNotEmpty`), `password` (z walidacją taką jak w `RegisterDto`).

### 5. Kontrolery i Endpointy

Plik: `src/auth/auth.controller.ts`

| Metoda | Endpoint | Body | Odpowiedź (Sukces) | Odpowiedź (Błąd) | Guard / Dekorator |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `register` | `POST /register` | `RegisterDto` | `201 Created` - `{ user, accessToken, refreshToken }` | `400` (Validation), `409` (Conflict) | `@Public()` |
| `login` | `POST /login` | `LoginDto` | `200 OK` - `{ user, accessToken, refreshToken }` | `400` (Validation), `401` (Unauthorized) | `@Public()` |
| `logout` | `POST /logout` | - | `204 No Content` | `401` (Unauthorized) | `@UseGuards(JwtAuthGuard)` |
| `refresh` | `POST /refresh` | `RefreshTokenDto` | `200 OK` - `{ accessToken, refreshToken }` | `401` (Unauthorized) | `@Public()` |
| `getProfile` | `GET /profile` | - | `200 OK` - `{ user }` | `401` (Unauthorized) | `@UseGuards(JwtAuthGuard)` |
| `reqReset`| `POST /password/request-reset` | `RequestPasswordResetDto` | `204 No Content` | `404` (Not Found) | `@Public()` |
| `resetPass`| `POST /password/reset` | `ResetPasswordDto` | `204 No Content` | `400` (Bad Token), `401` (Expired) | `@Public()` |

### 6. Serwisy i Logika Domenowa

#### 6.1. `AuthService` (`src/auth/auth.service.ts`)

*   **`register(dto)`**:
    1.  Sprawdza, czy e-mail istnieje, używając `usersService.findByEmail()`. Jeśli tak, rzuca `ConflictException`.
    2.  Haszuje hasło za pomocą `bcrypt`.
    3.  Tworzy użytkownika przez `usersService.create()`.
    4.  Generuje parę tokenów (`accessToken`, `refreshToken`).
    5.  Zapisuje haszowany `refreshToken` w bazie danych przez `tokensService`.
    6.  Zwraca `user`, `accessToken` i `refreshToken` (w postaci jawnej).
*   **`login(dto)`**:
    1.  Znajduje użytkownika przez `usersService.findByEmailWithPassword()`.
    2.  Porównuje hasła za pomocą `bcrypt.compare()`. Jeśli nie pasują, rzuca `UnauthorizedException`.
    3.  Generuje i zwraca nową parę tokenów, analogicznie jak w `register`.
*   **`logout(userId)`**:
    1.  Usuwa wszystkie refresh tokeny dla danego `userId` z bazy danych za pomocą `tokensService`.
*   **`refreshTokens(userId, refreshToken)`**:
    1.  Pobiera zapisany `refreshToken` z `tokensService` dla `userId`.
    2.  Porównuje hash otrzymanego tokena z hashem w bazie. Jeśli się nie zgadza lub token wygasł, rzuca `UnauthorizedException`.
    3.  **Rotacja**: Usuwa stary `refreshToken`.
    4.  Generuje nową parę tokenów i zapisuje nowy `refreshToken` w bazie.
    5.  Zwraca nową parę tokenów.

#### 6.2. `TokensService` (`src/tokens/tokens.service.ts`)

Będzie to prosty serwis CRUD do zarządzania encjami `RefreshToken` i `PasswordResetToken` w bazie danych, w tym ich haszowanie przed zapisem.

### 7. Tokeny, Bezpieczeństwo i Konfiguracja

#### 7.1. Konfiguracja (`ConfigModule`)

Wszystkie wrażliwe dane i zmienne konfiguracyjne powinny być przechowywane w zmiennych środowiskowych (`.env`) i ładowane przez `@nestjs/config`.

```
# .env
JWT_ACCESS_SECRET=super_secret_access_key
JWT_REFRESH_SECRET=super_secret_refresh_key
JWT_ACCESS_EXPIRATION_TIME=30m
JWT_REFRESH_EXPIRATION_TIME=7d
BCRYPT_SALT_ROUNDS=12
```

#### 7.2. Implementacja `JwtStrategy`

Plik: `src/auth/strategies/jwt.strategy.ts`

Strategia będzie odpowiedzialna za walidację `accessToken` i dołączanie zdeserializowanych danych użytkownika do obiektu `request`.

```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: UserRole }) {
    // Payload pochodzi ze zdeserializowanego tokena JWT
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### 8. Guardy, Dekoratory i Autoryzacja Ról

#### 8.1. `JwtAuthGuard` i dekorator `@Public`

`JwtAuthGuard` będzie globalnym guardem, co oznacza, że wszystkie endpointy będą domyślnie chronione. Endpointy publiczne (logowanie, rejestracja) będą oznaczane niestandardowym dekoratorem `@Public()`.

#### 8.2. `RolesGuard` i dekorator `@Roles`

Plik: `src/common/guards/roles.guard.ts`

Guard będzie sprawdzał, czy rola użytkownika (`request.user.role`) pasuje do ról zdefiniowanych w dekoratorze `@Roles()`.

```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/interfaces/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

Użycie w kontrolerze:

```typescript
// Przykład w users.controller.ts
@Get()
@Roles(UserRole.ADMIN) // Dostęp tylko dla admina
@UseGuards(JwtAuthGuard, RolesGuard)
findAll() {
  return this.usersService.findAll();
}
```

### 9. Obsługa Błędów i Edge-Case’y

*   **`BadRequestException`**: Błędy walidacji DTO (obsługiwane automatycznie przez `ValidationPipe`).
*   **`UnauthorizedException`**: Błędne dane logowania, nieważny lub wygasły token, próba dostępu do chronionego zasobu bez tokena.
*   **`ConflictException`**: Próba rejestracji na istniejący e-mail.
*   **`NotFoundException`**: Próba resetu hasła dla nieistniejącego użytkownika.
*   **`ForbiddenException`**: Użytkownik jest uwierzytelniony, ale nie ma wymaganej roli do wykonania operacji.

### 10. Plan Wdrożenia (Krok po Kroku)

1.  **Struktura i Konfiguracja**:
    *   Utwórz strukturę katalogów dla `auth`, `tokens`, `common/guards`, `common/decorators`.
    *   Skonfiguruj `ConfigModule` i dodaj zmienne środowiskowe do `.env`.
2.  **Encje i Migracje**:
    *   Utwórz encje `RefreshToken` i `PasswordResetToken`.
    *   Wygeneruj i uruchom migracje bazy danych.
3.  **Moduły Podstawowe**:
    *   Utwórz `TokensModule` i `TokensService`.
    *   Upewnij się, że `UsersModule` eksportuje `UsersService`.
4.  **Implementacja `AuthModule`**:
    *   Utwórz wszystkie wymagane DTOs.
    *   Zaimplementuj `JwtStrategy`.
    *   Skonfiguruj `JwtModule` i `PassportModule` w `AuthModule`.
    *   Zaimplementuj logikę `AuthService`, współpracując z `UsersService` i `TokensService`.
    *   Zaimplementuj `AuthController` ze wszystkimi endpointami.
5.  **Guardy i Autoryzacja**:
    *   Stwórz dekoratory `@Public` i `@Roles`.
    *   Implementuj `JwtAuthGuard` i `RolesGuard`.
    *   Ustaw `JwtAuthGuard` jako guard globalny i oznacz publiczne endpointy.
6.  **Integracja i Testowanie**:
    *   Dodaj `RolesGuard` do endpointów wymagających specyficznych ról (np. w `UsersController`).
    *   Przeprowadź testy manualne (np. przez Postman) lub automatyczne dla każdego endpointu i scenariusza (rejestracja, logowanie, odświeżanie, błędy, ochrona tras).
