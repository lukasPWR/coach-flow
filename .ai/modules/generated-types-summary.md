# Podsumowanie Wygenerowanych Typów Backend

Data wygenerowania: 2025-11-04

## Przegląd

Dokument ten zawiera podsumowanie wszystkich wygenerowanych DTOs (Data Transfer Objects), interfejsów i enumów dla modułów backendowych aplikacji CoachFlow. Typy zostały wygenerowane na podstawie planów modułów i API zawartych w dokumentach:

- `.ai/modules/module-plan.md`
- `.ai/api-plan.md`

**Uwaga:** Moduł `auth` został pominięty zgodnie z wymaganiami.

---

## 1. Users Module

### Lokalizacja

`backend/src/users/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-user.dto.ts`

**Przeznaczenie:** Tworzenie nowego użytkownika w systemie

**Pola:**

- `name: string` - Nazwa użytkownika (wymagane, niepuste)
- `email: string` - Adres email (walidacja email)
- `password: string` - Hasło (minimum 8 znaków)
- `role: UserRole` - Rola użytkownika (enum: CLIENT/TRAINER)

**Dekoratory walidacji:**

- `@IsString()`, `@IsNotEmpty()` dla `name`
- `@IsEmail()` dla `email`
- `@IsString()`, `@MinLength(8)` dla `password`
- `@IsEnum(UserRole)` dla `role`

##### `update-user.dto.ts`

**Przeznaczenie:** Aktualizacja danych użytkownika

**Pola:** (wszystkie opcjonalne)

- `name?: string`
- `email?: string`
- `password?: string`
- `role?: UserRole`

**Dekoratory walidacji:** Takie same jak w `CreateUserDto` + `@IsOptional()` dla każdego pola

#### Interfaces (`interfaces/`)

##### `user-role.enum.ts`

**Typ:** Enum

**Wartości:**

- `CLIENT = 'CLIENT'`
- `TRAINER = 'TRAINER'`

##### `user.interface.ts`

**Przeznaczenie:** Reprezentacja encji użytkownika

**Pola:**

- `id: string` - UUID użytkownika
- `name: string`
- `email: string`
- `password: string` - Hash hasła
- `role: UserRole`
- `createdAt: Date`
- `updatedAt: Date`
- `deletedAt?: Date` - Dla soft delete

---

## 2. Trainer Profiles Module

### Lokalizacja

`backend/src/trainer-profiles/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-trainer-profile.dto.ts`

**Przeznaczenie:** Tworzenie profilu trenera

**Pola:**

- `userId: string` - UUID powiązanego użytkownika (wymagane)
- `description?: string` - Opis profilu (opcjonalne)
- `city?: string` - Miasto (opcjonalne)
- `profilePictureUrl?: string` - URL zdjęcia profilowego (opcjonalne, walidacja URL)
- `specializationIds?: string[]` - Tablica UUID specjalizacji (opcjonalne)

**Dekoratory walidacji:**

- `@IsUUID()` dla `userId`
- `@IsOptional()`, `@IsString()` dla `description` i `city`
- `@IsOptional()`, `@IsUrl()` dla `profilePictureUrl`
- `@IsOptional()`, `@IsArray()`, `@IsUUID('4', { each: true })` dla `specializationIds`

##### `update-trainer-profile.dto.ts`

**Przeznaczenie:** Aktualizacja profilu trenera

**Pola:** (wszystkie opcjonalne, bez `userId`)

- `description?: string`
- `city?: string`
- `profilePictureUrl?: string`
- `specializationIds?: string[]`

#### Interfaces (`interfaces/`)

##### `trainer-profile.interface.ts`

**Przeznaczenie:** Reprezentacja encji profilu trenera

**Pola:**

- `id: string`
- `description?: string`
- `city?: string`
- `profilePictureUrl?: string`
- `userId: string`
- `createdAt: Date`
- `updatedAt: Date`

---

## 3. Specializations Module

### Lokalizacja

`backend/src/specializations/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-specialization.dto.ts`

**Przeznaczenie:** Tworzenie nowej specjalizacji (moduł słownikowy)

**Pola:**

- `name: string` - Nazwa specjalizacji (wymagane, niepuste)

**Dekoratory walidacji:**

- `@IsString()`, `@IsNotEmpty()`

##### `update-specialization.dto.ts`

**Przeznaczenie:** Aktualizacja specjalizacji

**Pola:**

- `name?: string` (opcjonalne)

**Dekoratory walidacji:**

- `@IsOptional()`, `@IsString()`, `@IsNotEmpty()`

#### Interfaces (`interfaces/`)

##### `specialization.interface.ts`

**Przeznaczenie:** Reprezentacja encji specjalizacji

**Pola:**

- `id: string`
- `name: string`

---

## 4. Service Types Module

### Lokalizacja

`backend/src/service-types/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-service-type.dto.ts`

**Przeznaczenie:** Tworzenie nowego typu usługi (moduł słownikowy)

**Pola:**

- `name: string` - Nazwa typu usługi (wymagane, niepuste)

**Dekoratory walidacji:**

- `@IsString()`, `@IsNotEmpty()`

##### `update-service-type.dto.ts`

**Przeznaczenie:** Aktualizacja typu usługi

**Pola:**

- `name?: string` (opcjonalne)

**Dekoratory walidacji:**

- `@IsOptional()`, `@IsString()`, `@IsNotEmpty()`

#### Interfaces (`interfaces/`)

##### `service-type.interface.ts`

**Przeznaczenie:** Reprezentacja encji typu usługi

**Pola:**

- `id: string`
- `name: string`

---

## 5. Services Module

### Lokalizacja

`backend/src/services/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-service.dto.ts`

**Przeznaczenie:** Tworzenie nowej usługi przez trenera

**Pola:**

- `trainerId: string` - UUID trenera (wymagane)
- `serviceTypeId: string` - UUID typu usługi (wymagane)
- `price: number` - Cena usługi (minimum 0)
- `durationMinutes: number` - Czas trwania w minutach (minimum 1, integer)

**Dekoratory walidacji:**

- `@IsUUID()` dla `trainerId` i `serviceTypeId`
- `@IsNumber()`, `@Min(0)` dla `price`
- `@IsInt()`, `@Min(1)` dla `durationMinutes`

##### `update-service.dto.ts`

**Przeznaczenie:** Aktualizacja usługi

**Pola:** (opcjonalne, bez `trainerId` i `serviceTypeId`)

- `price?: number`
- `durationMinutes?: number`

**Dekoratory walidacji:**

- `@IsOptional()`, `@IsNumber()`, `@Min(0)` dla `price`
- `@IsOptional()`, `@IsInt()`, `@Min(1)` dla `durationMinutes`

#### Interfaces (`interfaces/`)

##### `service.interface.ts`

**Przeznaczenie:** Reprezentacja encji usługi

**Pola:**

- `id: string`
- `price: number`
- `durationMinutes: number`
- `trainerId: string`
- `serviceTypeId: string`
- `createdAt: Date`
- `updatedAt: Date`
- `deletedAt?: Date` - Dla soft delete

---

## 6. Bookings Module

### Lokalizacja

`backend/src/bookings/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-booking.dto.ts`

**Przeznaczenie:** Tworzenie nowej rezerwacji przez klienta

**Pola:**

- `clientId: string` - UUID klienta (wymagane)
- `trainerId: string` - UUID trenera (wymagane)
- `serviceId: string` - UUID usługi (wymagane)
- `startTime: Date` - Czas rozpoczęcia (format ISO Date String)

**Dekoratory walidacji:**

- `@IsUUID()` dla `clientId`, `trainerId`, `serviceId`
- `@IsDateString()` dla `startTime`

##### `update-booking.dto.ts`

**Przeznaczenie:** Aktualizacja rezerwacji

**Pola:** (wszystkie opcjonalne)

- `startTime?: Date`
- `status?: BookingStatus`

**Dekoratory walidacji:**

- `@IsOptional()`, `@IsDateString()` dla `startTime`
- `@IsOptional()`, `@IsEnum(BookingStatus)` dla `status`

#### Interfaces (`interfaces/`)

##### `booking-status.enum.ts`

**Typ:** Enum

**Wartości:**

- `PENDING = 'PENDING'` - Oczekująca na zatwierdzenie
- `ACCEPTED = 'ACCEPTED'` - Zaakceptowana przez trenera
- `REJECTED = 'REJECTED'` - Odrzucona przez trenera
- `CANCELLED = 'CANCELLED'` - Anulowana

##### `booking.interface.ts`

**Przeznaczenie:** Reprezentacja encji rezerwacji

**Pola:**

- `id: string`
- `startTime: Date`
- `endTime: Date`
- `status: BookingStatus`
- `reminderSentAt?: Date`
- `clientId: string`
- `trainerId: string`
- `serviceId: string`
- `createdAt: Date`
- `updatedAt: Date`

---

## 7. Unavailabilities Module

### Lokalizacja

`backend/src/unavailabilities/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-unavailability.dto.ts`

**Przeznaczenie:** Tworzenie bloku niedostępności trenera

**Pola:**

- `trainerId: string` - UUID trenera (wymagane)
- `startTime: Date` - Początek niedostępności (format ISO Date String)
- `endTime: Date` - Koniec niedostępności (format ISO Date String)

**Dekoratory walidacji:**

- `@IsUUID()` dla `trainerId`
- `@IsDateString()` dla `startTime` i `endTime`

##### `update-unavailability.dto.ts`

**Przeznaczenie:** Aktualizacja bloku niedostępności

**Pola:** (wszystkie opcjonalne, bez `trainerId`)

- `startTime?: Date`
- `endTime?: Date`

**Dekoratory walidacji:**

- `@IsOptional()`, `@IsDateString()` dla obu pól

#### Interfaces (`interfaces/`)

##### `unavailability.interface.ts`

**Przeznaczenie:** Reprezentacja encji niedostępności

**Pola:**

- `id: string`
- `startTime: Date`
- `endTime: Date`
- `trainerId: string`
- `createdAt: Date`
- `updatedAt: Date`

---

## 8. Booking Bans Module

### Lokalizacja

`backend/src/booking-bans/`

### Wygenerowane Pliki

#### DTOs (`dto/`)

##### `create-booking-ban.dto.ts`

**Przeznaczenie:** Tworzenie blokady rezerwacji (kara za late cancellation)

**Pola:**

- `clientId: string` - UUID klienta (wymagane)
- `trainerId: string` - UUID trenera (wymagane)
- `bannedUntil: Date` - Data wygaśnięcia blokady (format ISO Date String)

**Dekoratory walidacji:**

- `@IsUUID()` dla `clientId` i `trainerId`
- `@IsDateString()` dla `bannedUntil`

##### `update-booking-ban.dto.ts`

**Przeznaczenie:** Aktualizacja blokady rezerwacji

**Pola:** (opcjonalne, bez `clientId` i `trainerId`)

- `bannedUntil?: Date`

**Dekoratory walidacji:**

- `@IsOptional()`, `@IsDateString()`

#### Interfaces (`interfaces/`)

##### `booking-ban.interface.ts`

**Przeznaczenie:** Reprezentacja encji blokady rezerwacji

**Pola:**

- `id: string`
- `bannedUntil: Date`
- `clientId: string`
- `trainerId: string`
- `createdAt: Date`
- `updatedAt: Date`

---

## Statystyki

### Podsumowanie wygenerowanych plików

| Moduł            | DTOs   | Interfaces | Enums | Razem  |
| ---------------- | ------ | ---------- | ----- | ------ |
| users            | 2      | 1          | 1     | 4      |
| trainer-profiles | 2      | 1          | 0     | 3      |
| specializations  | 2      | 1          | 0     | 3      |
| service-types    | 2      | 1          | 0     | 3      |
| services         | 2      | 1          | 0     | 3      |
| bookings         | 2      | 1          | 1     | 4      |
| unavailabilities | 2      | 1          | 0     | 3      |
| booking-bans     | 2      | 1          | 0     | 3      |
| **RAZEM**        | **16** | **8**      | **2** | **26** |

### Zastosowane wzorce

1. **Nazewnictwo plików:** kebab-case (np. `create-user.dto.ts`)
2. **Nazewnictwo klas/interfejsów:** PascalCase (np. `CreateUserDto`)
3. **Struktura folderów:**
   - `dto/` dla Data Transfer Objects
   - `interfaces/` dla interfejsów i enumów
4. **Właściwości:** Wszystkie pola oznaczone jako `readonly`
5. **Walidacja:** Użycie dekoratorów z `class-validator`
6. **Opcjonalność:** Konsekwentne użycie `@IsOptional()` i `?` w TypeScript

---

## Zgodność z Architekturą

### NestJS Best Practices

✅ Każdy DTO w osobnym pliku  
✅ Separacja DTOs od interfejsów  
✅ Użycie class-validator dla walidacji  
✅ Readonly properties dla immutability  
✅ Proper typing z TypeScript strict mode

### Zgodność z Planami

✅ Wszystkie DTOs z `module-plan.md` zaimplementowane  
✅ Zgodność z endpointami z `api-plan.md`  
✅ Proper field validation zgodnie z requirements  
✅ Relacje między modułami uwzględnione (UUID references)

### Code Style

✅ Używane double quotes (`"`) zgodnie z projektem  
✅ Linia nie przekracza 100 znaków  
✅ Explicit typing dla wszystkich pól  
✅ Proper imports organization

---

## Następne Kroki

Po wygenerowaniu typów, kolejne kroki implementacji powinny obejmować:

1. **Entities (Prisma Models)** - Definicje schematów bazy danych
2. **Services** - Logika biznesowa dla każdego modułu
3. **Controllers** - Endpointy API zgodnie z `api-plan.md`
4. **Guards & Decorators** - Autoryzacja i uwierzytelnianie
5. **Pipes** - Transformacja i walidacja danych
6. **Interceptors** - Response transformation
7. **Tests** - Unit i integration tests

---

## Uwagi Implementacyjne

### Walidacja Dat

DTOs używające `@IsDateString()` akceptują daty w formacie ISO 8601. W serwisach należy zapewnić konwersję do obiektów `Date`.

### UUID Validation

Wszystkie relacje używają UUID v4. Dekorator `@IsUUID()` lub `@IsUUID('4')` zapewnia poprawną walidację.

### Soft Deletes

Moduły `users` i `services` implementują soft delete poprzez pole `deletedAt`. Należy uwzględnić to w query logic.

### Partial Updates

Update DTOs używają partial pattern - wszystkie pola opcjonalne. Implementacja powinna używać logiki merge, nie replace.

### Array Validation

Dla pól tablicowych (np. `specializationIds`) użyto `{ each: true }` w walidatorze UUID, co zapewnia walidację każdego elementu osobno.

---

_Dokument wygenerowany automatycznie na podstawie planów modułów i API._
