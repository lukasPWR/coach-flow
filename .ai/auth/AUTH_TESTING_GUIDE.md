# Authentication System Testing Guide

## Overview

System autentykacji został pomyślnie zaimplementowany. Ten dokument zawiera instrukcje testowania wszystkich endpointów.

## Przygotowanie

### 1. Uruchom bazę danych

```bash
docker-compose up -d
```

### 2. Uruchom migracje

```bash
cd backend
npm run migration:run
```

### 3. Uruchom aplikację

```bash
npm run start:dev
```

Aplikacja powinna być dostępna pod adresem: `http://localhost:3000`

### 4. Swagger Documentation

Dokumentacja API dostępna jest pod: `http://localhost:3000/api`

## Testowanie Endpointów

### 1. Rejestracja użytkownika

**Endpoint:** `POST /auth/register`  
**Publiczny:** Tak

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "CLIENT"
  }'
```

**Odpowiedź:**

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CLIENT",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Logowanie

**Endpoint:** `POST /auth/login`  
**Publiczny:** Tak

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Odpowiedź:** Taka sama jak przy rejestracji

### 3. Pobranie profilu użytkownika

**Endpoint:** `GET /auth/profile`  
**Wymaga:** Bearer Token

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Odpowiedź:**

```json
{
  "user": {
    "userId": "uuid",
    "email": "john@example.com",
    "role": "CLIENT"
  }
}
```

### 4. Odświeżenie tokena

**Endpoint:** `POST /auth/refresh`  
**Publiczny:** Tak

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Odpowiedź:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. Wylogowanie

**Endpoint:** `POST /auth/logout`  
**Wymaga:** Bearer Token

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Odpowiedź:** `204 No Content`

### 6. Request Password Reset

**Endpoint:** `POST /auth/password/request-reset`  
**Publiczny:** Tak

```bash
curl -X POST http://localhost:3000/auth/password/request-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Odpowiedź:** `204 No Content`  
**Uwaga:** Token resetowania hasła zostanie wyświetlony w konsoli serwera (w produkcji zostanie wysłany emailem)

### 7. Reset Password

**Endpoint:** `POST /auth/password/reset`  
**Publiczny:** Tak

```bash
curl -X POST http://localhost:3000/auth/password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_CONSOLE",
    "password": "NewSecurePass123!"
  }'
```

**Odpowiedź:** `204 No Content`

## Testowanie Autoryzacji Ról

### 1. Pobranie wszystkich użytkowników (tylko ADMIN)

**Endpoint:** `GET /users`  
**Wymaga:** Bearer Token + Rola ADMIN

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Jeśli nie jesteś adminem:**

```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: ADMIN"
}
```

### 2. Utworzenie użytkownika przez admina

**Endpoint:** `POST /users`  
**Wymaga:** Bearer Token + Rola ADMIN

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "role": "TRAINER"
  }'
```

## Scenariusze Testowe

### Scenariusz 1: Pełny flow użytkownika

1. Zarejestruj się jako CLIENT
2. Zaloguj się
3. Pobierz swój profil
4. Spróbuj pobrać listę użytkowników (powinno zwrócić 403)
5. Wyloguj się

### Scenariusz 2: Refresh token flow

1. Zaloguj się
2. Zapisz `accessToken` i `refreshToken`
3. Poczekaj 30 minut (lub zmień `JWT_ACCESS_EXPIRATION_TIME` na `10s` w testach)
4. Spróbuj użyć wygasłego `accessToken` (powinno zwrócić 401)
5. Użyj `refreshToken` do uzyskania nowego `accessToken`
6. Użyj nowego `accessToken` (powinno działać)

### Scenariusz 3: Password reset flow

1. Zarejestruj się
2. Wyloguj się
3. Zażądaj resetu hasła
4. Skopiuj token z konsoli serwera
5. Zresetuj hasło używając tokena
6. Zaloguj się nowym hasłem

### Scenariusz 4: Testowanie ról

1. Utwórz użytkownika ADMIN ręcznie w bazie danych:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'john@example.com';
```

2. Zaloguj się jako admin
3. Pobierz listę użytkowników (powinno działać)
4. Utwórz nowego użytkownika (powinno działać)

## Kody błędów

| Kod | Znaczenie    | Przykład                                       |
| --- | ------------ | ---------------------------------------------- |
| 400 | Bad Request  | Błąd walidacji danych                          |
| 401 | Unauthorized | Nieprawidłowe dane logowania lub wygasły token |
| 403 | Forbidden    | Brak wymaganych uprawnień (roli)               |
| 404 | Not Found    | Użytkownik nie znaleziony                      |
| 409 | Conflict     | Użytkownik z tym emailem już istnieje          |

## Testowanie z Postman

1. Zaimportuj kolekcję z Swagger: `http://localhost:3000/api-json`
2. Utwórz zmienną środowiskową `accessToken`
3. W zakładce Authorization wybierz "Bearer Token" i użyj `{{accessToken}}`
4. Po zalogowaniu zapisz token do zmiennej:

```javascript
// W Tests tab w Postman
pm.environment.set("accessToken", pm.response.json().accessToken);
```

## Bezpieczeństwo

### Sprawdź, czy:

- ✅ Hasła są hashowane (nie widoczne w bazie danych)
- ✅ Pole `password` nie jest zwracane w odpowiedziach API
- ✅ Tokeny JWT są podpisane i weryfikowane
- ✅ Refresh tokeny są hashowane w bazie danych
- ✅ Stare refresh tokeny są usuwane przy rotacji
- ✅ Wszystkie endpointy (poza publicznymi) wymagają autentykacji
- ✅ Endpointy z `@Roles()` sprawdzają uprawnienia

## Troubleshooting

### Problem: "JWT_ACCESS_SECRET is not defined"

**Rozwiązanie:** Upewnij się, że plik `.env` istnieje i zawiera wszystkie wymagane zmienne (zobacz `ENV_SETUP.md`)

### Problem: "ECONNREFUSED ::1:5432"

**Rozwiązanie:** Baza danych nie jest uruchomiona. Uruchom `docker-compose up -d`

### Problem: 401 Unauthorized na chronionych endpointach

**Rozwiązanie:**

- Sprawdź, czy token nie wygasł
- Sprawdź, czy header `Authorization: Bearer TOKEN` jest poprawny
- Sprawdź, czy token jest prawidłowy (nie został zmodyfikowany)

### Problem: 403 Forbidden

**Rozwiązanie:** Twoja rola nie ma uprawnień do tego endpointu. Sprawdź wymaganą rolę w dokumentacji.

## Następne kroki

Po pomyślnym przetestowaniu backendu:

1. Zintegruj frontend z API autentykacji
2. Zaimplementuj przechowywanie tokenów w localStorage/sessionStorage
3. Dodaj interceptory do automatycznego dodawania tokenów do requestów
4. Zaimplementuj automatyczne odświeżanie tokenów
5. Dodaj obsługę błędów 401/403 w UI
