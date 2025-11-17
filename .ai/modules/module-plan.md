# Plan Implementacji Modułów Backendu

Poniższy dokument przedstawia szczegółowy plan implementacji dla początkowej struktury modułów backendowych aplikacji CoachFlow. Został on stworzony w oparciu o dostarczoną dokumentację projektową, w tym schemat bazy danych, wymagania produktu oraz standardy kodowania.

---

### `auth`

Moduł odpowiedzialny za uwierzytelnianie i autoryzację użytkowników.

#### 1. DTOs (Data Transfer Objects)

- **`register.dto.ts`**
  - **Pola:**
    - `name: string` (`@IsString()`, `@IsNotEmpty()`)
    - `email: string` (`@IsEmail()`)
    - `password: string` (`@IsString()`, `@MinLength(8)`)
    - `role: UserRole` (`@IsEnum(UserRole)`)
- **`login.dto.ts`**
  - **Pola:**
    - `email: string` (`@IsEmail()`)
    - `password: string` (`@IsString()`, `@IsNotEmpty()`)

#### 2. Kontroler (`auth.controller.ts`)

- **Ścieżka bazowa:** `/auth`
- **Endpointy:**
  - `POST /register` - Rejestruje nowego użytkownika.
  - `POST /login` - Loguje użytkownika i zwraca token JWT.
  - `GET /profile` - Zwraca dane zalogowanego użytkownika (chronione).

#### 3. Serwis (`auth.service.ts`)

- **Metody:**
  - `register(dto: RegisterDto)`
  - `login(dto: LoginDto)`
  - `validateUser(email: string, pass: string)`
  - `getProfile(userId: string)`

---

### `users`

Moduł do zarządzania użytkownikami systemu.

#### 1. Encja (`user.entity.ts`)

- **Klasa:** `User`
- **Pola:**
  - `id: uuid` (klucz główny)
  - `name: string`
  - `email: string`
  - `password: string` (hash)
  - `role: UserRole`
  - `trainerProfile: TrainerProfile` (relacja 1-do-1)
  - `createdAt: Date`
  - `updatedAt: Date`
  - `deletedAt: Date`

#### 2. DTOs (Data Transfer Objects)

- **`create-user.dto.ts`**
  - **Pola:**
    - `name: string` (`@IsString()`, `@IsNotEmpty()`)
    - `email: string` (`@IsEmail()`)
    - `password: string` (`@IsString()`, `@MinLength(8)`)
    - `role: UserRole` (`@IsEnum(UserRole)`)
- **`update-user.dto.ts`**
  - **Pola:** (Oparte o `PartialType(CreateUserDto)`)
    - `name: string` (`@IsOptional()`, `@IsString()`, `@IsNotEmpty()`)
    - `email: string` (`@IsOptional()`, `@IsEmail()`)
    - `password: string` (`@IsOptional()`, `@IsString()`, `@MinLength(8)`)
    - `role: UserRole` (`@IsOptional()`, `@IsEnum(UserRole)`)

#### 3. Kontroler (`users.controller.ts`)

- **Ścieżka bazowa:** `/users`
- **Endpointy:**
  - `POST /` - Tworzy nowego użytkownika (funkcjonalność głównie dla admina, rejestracja przez `/auth`).
  - `GET /` - Zwraca listę wszystkich użytkowników.
  - `GET /:id` - Zwraca pojedynczego użytkownika.
  - `PATCH /:id` - Aktualizuje użytkownika.
  - `DELETE /:id` - Usuwa użytkownika (soft delete).

#### 4. Serwis (`users.service.ts`)

- **Metody:**
  - `create(dto: CreateUserDto)`
  - `findAll()`
  - `findOne(id: string)`
  - `findByEmail(email: string)`
  - `update(id: string, dto: UpdateUserDto)`
  - `remove(id: string)`

---

### `trainer-profiles`

Moduł do zarządzania profilami trenerów.

#### 1. Encja (`trainer-profile.entity.ts`)

- **Klasa:** `TrainerProfile`
- **Pola:**
  - `id: uuid` (klucz główny)
  - `description: string`
  - `city: string`
  - `profilePictureUrl: string`
  - `userId: uuid`
  - `user: User` (relacja)
  - `specializations: Specialization[]` (relacja)
  - `createdAt: Date`
  - `updatedAt: Date`

#### 2. DTOs (Data Transfer Objects)

- **`create-trainer-profile.dto.ts`**
  - **Uwaga:** `userId` jest automatycznie pobierany z JWT tokenu uwierzytelnionego użytkownika, nie jest częścią DTO.
  - **Pola:**
    - `description: string` (`@IsString()`, `@IsOptional()`)
    - `city: string` (`@IsString()`, `@IsOptional()`)
    - `profilePictureUrl: string` (`@IsUrl()`, `@IsOptional()`)
    - `specializationIds: string[]` (`@IsArray()`, `@IsUUID('4', { each: true })`, `@IsOptional()`)
- **`update-trainer-profile.dto.ts`**
  - **Pola:** (Oparte o `PartialType(CreateTrainerProfileDto)`, bez `userId`)
    - `description: string` (`@IsString()`, `@IsOptional()`)
    - `city: string` (`@IsString()`, `@IsOptional()`)
    - `profilePictureUrl: string` (`@IsUrl()`, `@IsOptional()`)
    - `specializationIds: string[]` (`@IsArray()`, `@IsUUID('4', { each: true })`, `@IsOptional()`)

#### 3. Kontroler (`trainer-profiles.controller.ts`)

- **Ścieżka bazowa:** `/trainers`
- **Endpointy:**
  - `GET /` - Zwraca paginowaną listę publicznych profili trenerów (filtrowanie po city, specializationId). **Publiczny endpoint.**
  - `GET /:id` - Zwraca publiczny profil trenera po userId, w tym specjalizacje i usługi. **Publiczny endpoint.**
  - `POST /` - Tworzy nowy profil trenera dla uwierzytelnionego użytkownika. **Wymaga TRAINER role.**
  - `GET /me` - Zwraca pełny profil własny uwierzytelnionego trenera (z danymi użytkownika). **Wymaga TRAINER role.**
  - `PATCH /:id` - Aktualizuje profil trenera po ID profilu. **Wymaga TRAINER/ADMIN role.**
  - `DELETE /:id` - Usuwa profil trenera po ID profilu. **Wymaga TRAINER/ADMIN role.**

#### 4. Serwis (`trainer-profiles.service.ts`)

- **Metody:**
  - `create(dto: CreateTrainerProfileDto, userId: string)` - Tworzy profil dla uwierzytelnionego użytkownika
  - `findAllPublic(query: FindTrainersQueryDto)` - Zwraca paginowaną listę publicznych profili z filtrowaniem
  - `findPublicProfileByUserId(userId: string)` - Zwraca publiczny profil trenera po userId (z usługami)
  - `findMyProfileByUserId(userId: string)` - Zwraca pełny profil własny trenera (z danymi użytkownika)
  - `update(id: string, dto: UpdateTrainerProfileDto, userId: string)` - Aktualizuje profil po ID profilu
  - `remove(id: string, userId: string)` - Usuwa profil po ID profilu

---

### `specializations`

Moduł słownikowy do zarządzania specjalizacjami trenerów.

#### 1. Encja (`specialization.entity.ts`)

- **Klasa:** `Specialization`
- **Pola:**
  - `id: uuid` (klucz główny)
  - `name: string`

#### 2. DTOs (Data Transfer Objects)

- **`create-specialization.dto.ts`**
  - **Pola:**
    - `name: string` (`@IsString()`, `@IsNotEmpty()`)
- **`update-specialization.dto.ts`**
  - **Pola:** (Oparte o `PartialType(CreateSpecializationDto)`)
    - `name: string` (`@IsString()`, `@IsNotEmpty()`, `@IsOptional()`)

#### 3. Kontroler (`specializations.controller.ts`)

- **Ścieżka bazowa:** `/specializations`
- **Endpointy:**
  - `POST /` - Tworzy nową specjalizację.
  - `GET /` - Zwraca listę wszystkich specjalizacji.
  - `GET /:id` - Zwraca pojedynczą specjalizację.
  - `PATCH /:id` - Aktualizuje specjalizację.
  - `DELETE /:id` - Usuwa specjalizację.

#### 4. Serwis (`specializations.service.ts`)

- **Metody:**
  - `create(dto: CreateSpecializationDto)`
  - `findAll()`
  - `findOne(id: string)`
  - `update(id: string, dto: UpdateSpecializationDto)`
  - `remove(id: string)`

---

### `service-types`

Moduł słownikowy do zarządzania typami usług.

#### 1. Encja (`service-type.entity.ts`)

- **Klasa:** `ServiceType`
- **Pola:**
  - `id: uuid` (klucz główny)
  - `name: string`

#### 2. DTOs (Data Transfer Objects)

- **`create-service-type.dto.ts`**
  - **Pola:**
    - `name: string` (`@IsString()`, `@IsNotEmpty()`)
- **`update-service-type.dto.ts`**
  - **Pola:** (Oparte o `PartialType(CreateServiceTypeDto)`)
    - `name: string` (`@IsString()`, `@IsNotEmpty()`, `@IsOptional()`)

#### 3. Kontroler (`service-types.controller.ts`)

- **Ścieżka bazowa:** `/service-types`
- **Endpointy:**
  - `POST /` - Tworzy nowy typ usługi.
  - `GET /` - Zwraca listę wszystkich typów usług.
  - `GET /:id` - Zwraca pojedynczy typ usługi.
  - `PATCH /:id` - Aktualizuje typ usługi.
  - `DELETE /:id` - Usuwa typ usługi.

#### 4. Serwis (`service-types.service.ts`)

- **Metody:**
  - `create(dto: CreateServiceTypeDto)`
  - `findAll()`
  - `findOne(id: string)`
  - `update(id: string, dto: UpdateServiceTypeDto)`
  - `remove(id: string)`

---

### `services`

Moduł do zarządzania usługami oferowanymi przez trenerów.

#### 1. Encja (`service.entity.ts`)

- **Klasa:** `Service`
- **Pola:**
  - `id: uuid` (klucz główny)
  - `price: number`
  - `durationMinutes: number`
  - `trainerId: uuid`
  - `trainer: User` (relacja)
  - `serviceTypeId: uuid`
  - `serviceType: ServiceType` (relacja)
  - `createdAt: Date`
  - `updatedAt: Date`
  - `deletedAt: Date`

#### 2. DTOs (Data Transfer Objects)

- **`create-service.dto.ts`**
  - **Pola:**
    - `trainerId: string` (`@IsUUID()`)
    - `serviceTypeId: string` (`@IsUUID()`)
    - `price: number` (`@IsNumber()`, `@Min(0)`)
    - `durationMinutes: number` (`@IsInt()`, `@Min(1)`)
- **`update-service.dto.ts`**
  - **Pola:** (Oparte o `PartialType(CreateServiceDto)`, bez `trainerId` i `serviceTypeId`)
    - `price: number` (`@IsNumber()`, `@Min(0)`, `@IsOptional()`)
    - `durationMinutes: number` (`@IsInt()`, `@Min(1)`, `@IsOptional()`)

#### 3. Kontroler (`services.controller.ts`)

- **Ścieżka bazowa:** `/services`
- **Endpointy:**
  - `POST /` - Tworzy nową usługę.
  - `GET /` - Zwraca listę wszystkich usług.
  - `GET /:id` - Zwraca pojedynczą usługę.
  - `PATCH /:id` - Aktualizuje usługę.
  - `DELETE /:id` - Usuwa usługę (soft delete).

#### 4. Serwis (`services.service.ts`)

- **Metody:**
  - `create(dto: CreateServiceDto)`
  - `findAll()`
  - `findOne(id: string)`
  - `update(id: string, dto: UpdateServiceDto)`
  - `remove(id: string)`

---

### `bookings`

Moduł do zarządzania rezerwacjami.

#### 1. Encja (`booking.entity.ts`)

- **Klasa:** `Booking`
- **Pola:**
  - `id: uuid` (klucz główny)
  - `startTime: Date`
  - `endTime: Date`
  - `status: BookingStatus`
  - `reminderSentAt: Date`
  - `clientId: uuid`
  - `client: User` (relacja)
  - `trainerId: uuid`
  - `trainer: User` (relacja)
  - `serviceId: uuid`
  - `service: Service` (relacja)
  - `createdAt: Date`
  - `updatedAt: Date`

#### 2. DTOs (Data Transfer Objects)

- **`create-booking.dto.ts`**
  - **Pola:**
    - `clientId: string` (`@IsUUID()`)
    - `trainerId: string` (`@IsUUID()`)
    - `serviceId: string` (`@IsUUID()`)
    - `startTime: Date` (`@IsDateString()`)
- **`update-booking.dto.ts`**
  - **Pola:** (Oparte o `PartialType`)
    - `startTime: Date` (`@IsDateString()`, `@IsOptional()`)
    - `status: BookingStatus` (`@IsEnum(BookingStatus)`, `@IsOptional()`)

#### 3. Kontroler (`bookings.controller.ts`)

- **Ścieżka bazowa:** `/bookings`
- **Endpointy:**
  - `POST /` - Tworzy nową rezerwację.
  - `GET /` - Zwraca listę wszystkich rezerwacji.
  - `GET /:id` - Zwraca pojedynczą rezerwację.
  - `PATCH /:id` - Aktualizuje rezerwację (np. zmiana statusu).
  - `DELETE /:id` - Anuluje rezerwację (zmiana statusu na `CANCELLED`).

#### 4. Serwis (`bookings.service.ts`)

- **Metody:**
  - `create(dto: CreateBookingDto)`
  - `findAll()`
  - `findOne(id: string)`
  - `update(id: string, dto: UpdateBookingDto)`
  - `remove(id: string)`

---

### `unavailabilities`

Moduł do zarządzania niedostępnością trenerów.

#### 1. Encja (`unavailability.entity.ts`)

- **Klasa:** `Unavailability`
- **Pola:**
  - `id: uuid` (klucz główny)
  - `startTime: Date`
  - `endTime: Date`
  - `trainerId: uuid`
  - `trainer: User` (relacja)
  - `createdAt: Date`
  - `updatedAt: Date`

#### 2. DTOs (Data Transfer Objects)

- **`create-unavailability.dto.ts`**
  - **Pola:**
    - `trainerId: string` (`@IsUUID()`)
    - `startTime: Date` (`@IsDateString()`)
    - `endTime: Date` (`@IsDateString()`)
- **`update-unavailability.dto.ts`**
  - **Pola:** (Oparte o `PartialType(CreateUnavailabilityDto)`, bez `trainerId`)
    - `startTime: Date` (`@IsDateString()`, `@IsOptional()`)
    - `endTime: Date` (`@IsDateString()`, `@IsOptional()`)

#### 3. Kontroler (`unavailabilities.controller.ts`)

- **Ścieżka bazowa:** `/unavailabilities`
- **Endpointy:**
  - `POST /` - Tworzy nowy blok niedostępności.
  - `GET /` - Zwraca listę wszystkich bloków.
  - `GET /:id` - Zwraca pojedynczy blok.
  - `PATCH /:id` - Aktualizuje blok.
  - `DELETE /:id` - Usuwa blok.

#### 4. Serwis (`unavailabilities.service.ts`)

- **Metody:**
  - `create(dto: CreateUnavailabilityDto)`
  - `findAll()`
  - `findOne(id: string)`
  - `update(id: string, dto: UpdateUnavailabilityDto)`
  - `remove(id: string)`

---

### `booking-bans`

Moduł do zarządzania blokadami rezerwacji.

#### 1. Encja (`booking-ban.entity.ts`)

- **Klasa:** `BookingBan`
- **Pola:**
  - `id: uuid` (klucz główny)
  - `bannedUntil: Date`
  - `clientId: uuid`
  - `client: User` (relacja)
  - `trainerId: uuid`
  - `trainer: User` (relacja)
  - `createdAt: Date`
  - `updatedAt: Date`

#### 2. DTOs (Data Transfer Objects)

- **`create-booking-ban.dto.ts`**
  - **Pola:**
    - `clientId: string` (`@IsUUID()`)
    - `trainerId: string` (`@IsUUID()`)
    - `bannedUntil: Date` (`@IsDateString()`)
- **`update-booking-ban.dto.ts`**
  - **Pola:** (Oparte o `PartialType(CreateBookingBanDto)`, bez `clientId` i `trainerId`)
    - `bannedUntil: Date` (`@IsDateString()`, `@IsOptional()`)

#### 3. Kontroler (`booking-bans.controller.ts`)

- **Ścieżka bazowa:** `/booking-bans`
- **Endpointy:**
  - `POST /` - Tworzy nową blokadę.
  - `GET /` - Zwraca listę wszystkich blokad.
  - `GET /:id` - Zwraca pojedynczą blokadę.
  - `PATCH /:id` - Aktualizuje blokadę.
  - `DELETE /:id` - Usuwa blokadę.

#### 4. Serwis (`booking-bans.service.ts`)

- **Metody:**
  - `create(dto: CreateBookingBanDto)`
  - `findAll()`
  - `findOne(id: string)`
  - `update(id: string, dto: UpdateBookingBanDto)`
  - `remove(id: string)`
