# Frontend Authentication Integration - Complete Guide

## ✅ Co zostało zaimplementowane

### 1. API Client (`src/lib/api/`)

#### `types.ts`
- Definicje wszystkich typów TypeScript dla API
- `User`, `AuthResponse`, `TokenResponse`
- Request DTOs: `LoginRequest`, `RegisterRequest`, etc.
- `ApiError` dla obsługi błędów

#### `client.ts`
- Singleton `ApiClient` z axios
- **Automatyczne dodawanie Bearer token** do requestów
- **Automatyczne odświeżanie tokenów** przy 401
- Queue system dla requestów podczas refresh
- Zarządzanie tokenami w localStorage

#### `auth.ts`
- API endpoints dla autentykacji:
  - `register()` - Rejestracja
  - `login()` - Logowanie
  - `logout()` - Wylogowanie
  - `getProfile()` - Pobranie profilu
  - `requestPasswordReset()` - Żądanie resetu hasła
  - `resetPassword()` - Reset hasła
  - `isAuthenticated()` - Sprawdzenie czy zalogowany

### 2. Auth Store (`src/stores/auth.ts`)

Pinia store z pełną logiką autentykacji:

**State:**
- `user` - Dane zalogowanego użytkownika
- `isLoading` - Status ładowania
- `error` - Komunikaty błędów

**Getters:**
- `isAuthenticated` - Czy użytkownik jest zalogowany
- `userRole` - Rola użytkownika
- `isClient`, `isTrainer`, `isAdmin` - Pomocnicze gettery

**Actions:**
- `login()` - Logowanie użytkownika
- `register()` - Rejestracja użytkownika
- `logout()` - Wylogowanie
- `fetchProfile()` - Pobranie profilu
- `requestPasswordReset()` - Reset hasła
- `resetPassword()` - Zmiana hasła
- `initialize()` - Inicjalizacja przy starcie aplikacji

### 3. Komponenty Auth

#### `LoginForm.vue`
- ✅ Zintegrowany z `useAuthStore()`
- ✅ Walidacja formularza
- ✅ Obsługa błędów API
- ✅ Przekierowanie po zalogowaniu (dashboard/trainer-dashboard)
- ✅ Loading state

#### `RegisterForm.vue`
- ✅ Zintegrowany z `useAuthStore()`
- ✅ Walidacja hasła zgodna z backendem (8 znaków, wielka/mała litera, cyfra, znak specjalny)
- ✅ Wybór roli (CLIENT/TRAINER)
- ✅ Obsługa błędów API
- ✅ Przekierowanie po rejestracji

### 4. Router Guards (`src/router/index.ts`)

**Meta fields:**
- `requiresAuth` - Wymaga zalogowania
- `requiresGuest` - Tylko dla niezalogowanych
- `requiresRole` - Wymaga konkretnej roli

**Guards:**
- Przekierowanie do `/login` jeśli niezalogowany
- Przekierowanie do dashboard jeśli zalogowany próbuje wejść na `/login`
- Sprawdzanie ról użytkownika

**Nowe routes:**
- `/dashboard` - Dashboard klienta (wymaga auth)
- `/trainer/dashboard` - Dashboard trenera (wymaga auth + rola TRAINER)
- `/profile` - Profil użytkownika (wymaga auth)

### 5. Widoki

#### `DashboardPage.vue`
- Dashboard dla klientów
- Wyświetlanie informacji o użytkowniku
- Przycisk wylogowania

#### `TrainerDashboardPage.vue`
- Dashboard dla trenerów
- Dedykowane funkcje dla trenerów

#### `ProfilePage.vue`
- Widok profilu użytkownika
- Wyświetlanie danych konta

### 6. Automatyczne Odświeżanie Tokenów

**Implementacja w `client.ts`:**
1. Interceptor wykrywa 401 Unauthorized
2. Sprawdza czy refresh nie jest już w toku
3. Jeśli nie - wywołuje `/auth/refresh` z refresh tokenem
4. Zapisuje nowe tokeny
5. Retry wszystkich zakolejkowanych requestów
6. Jeśli refresh fail - wylogowanie i redirect do `/login`

## 🔧 Konfiguracja

### 1. Zmienne środowiskowe

Utwórz plik `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 2. Instalacja zależności

Wszystkie wymagane pakiety są już zainstalowane:
- ✅ axios
- ✅ pinia
- ✅ vue-router

## 🚀 Użycie

### Logowanie użytkownika

```typescript
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

try {
  await authStore.login({
    email: "user@example.com",
    password: "SecurePass123!",
  });
  
  // Użytkownik zalogowany, automatyczne przekierowanie
} catch (error) {
  // Obsługa błędu
  console.error(authStore.error);
}
```

### Rejestracja użytkownika

```typescript
await authStore.register({
  name: "Jan Kowalski",
  email: "jan@example.com",
  password: "SecurePass123!",
  role: "CLIENT", // lub "TRAINER"
});
```

### Wylogowanie

```typescript
await authStore.logout();
router.push("/login");
```

### Sprawdzanie autentykacji w komponencie

```vue
<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
</script>

<template>
  <div v-if="authStore.isAuthenticated">
    <p>Witaj, {{ authStore.user?.name }}!</p>
    <p>Rola: {{ authStore.userRole }}</p>
  </div>
</template>
```

### Warunkowe renderowanie na podstawie roli

```vue
<template>
  <div v-if="authStore.isTrainer">
    <!-- Tylko dla trenerów -->
  </div>
  
  <div v-if="authStore.isClient">
    <!-- Tylko dla klientów -->
  </div>
  
  <div v-if="authStore.isAdmin">
    <!-- Tylko dla adminów -->
  </div>
</template>
```

### Chronione route

```typescript
{
  path: "/admin",
  name: "admin",
  component: () => import("@/views/AdminPage.vue"),
  meta: { 
    requiresAuth: true,
    requiresRole: "ADMIN" 
  },
}
```

## 🔐 Bezpieczeństwo

### Przechowywanie tokenów

- ✅ Access token w localStorage (`coachflow_access_token`)
- ✅ Refresh token w localStorage (`coachflow_refresh_token`)
- ✅ Automatyczne czyszczenie przy wylogowaniu
- ✅ Automatyczne czyszczenie przy błędzie refresh

### CORS

Backend musi mieć skonfigurowane CORS dla frontendu:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: "http://localhost:5173", // Vite dev server
  credentials: true,
});
```

## 📊 Flow Autentykacji

### 1. Rejestracja/Logowanie
```
User → LoginForm → authStore.login() → authApi.login() → API
                                                           ↓
User ← Dashboard ← Router ← Store (save user) ← Response (tokens)
```

### 2. Chroniony Request
```
Component → API call → Interceptor (add Bearer token) → Backend
                                                          ↓
Component ← Response ← Interceptor ← Backend
```

### 3. Token Refresh (gdy access token wygasł)
```
Component → API call → Interceptor → 401 Unauthorized
                           ↓
                    Check if refreshing
                           ↓
                    Call /auth/refresh
                           ↓
                    Save new tokens
                           ↓
                    Retry original request
                           ↓
Component ← Response
```

### 4. Wylogowanie
```
User → Logout button → authStore.logout() → API /auth/logout
                                              ↓
User → Login page ← Clear tokens ← Response
```

## 🧪 Testowanie

### 1. Uruchom backend
```bash
cd backend
npm run start:dev
```

### 2. Uruchom frontend
```bash
cd frontend
npm run dev
```

### 3. Testuj flow:

**Rejestracja:**
1. Przejdź do `http://localhost:5173/register`
2. Wypełnij formularz (hasło: min 8 znaków, wielka litera, cyfra, znak specjalny)
3. Wybierz rolę (CLIENT/TRAINER)
4. Kliknij "Zarejestruj się"
5. Sprawdź przekierowanie do odpowiedniego dashboard

**Logowanie:**
1. Przejdź do `http://localhost:5173/login`
2. Wpisz email i hasło
3. Kliknij "Zaloguj się"
4. Sprawdź przekierowanie

**Chronione route:**
1. Wyloguj się
2. Spróbuj wejść na `/dashboard`
3. Powinieneś zostać przekierowany do `/login`

**Token refresh:**
1. Zaloguj się
2. W backend zmień `JWT_ACCESS_EXPIRATION_TIME` na `10s`
3. Poczekaj 10 sekund
4. Wykonaj jakąś akcję wymagającą API
5. Token powinien zostać automatycznie odświeżony

## 🐛 Troubleshooting

### Problem: "Network Error" lub CORS error
**Rozwiązanie:**
- Sprawdź czy backend działa na `http://localhost:3000`
- Sprawdź konfigurację CORS w backend
- Sprawdź `VITE_API_URL` w `.env`

### Problem: "401 Unauthorized" po zalogowaniu
**Rozwiązanie:**
- Sprawdź czy tokeny są zapisane w localStorage
- Sprawdź w DevTools → Network czy header `Authorization` jest dodawany
- Sprawdź czy backend JWT_ACCESS_SECRET jest poprawny

### Problem: Nieskończona pętla refreshowania
**Rozwiązanie:**
- Sprawdź czy refresh token jest ważny
- Sprawdź logi backendu
- Wyczyść localStorage i zaloguj się ponownie

### Problem: Przekierowanie nie działa
**Rozwiązanie:**
- Sprawdź czy `authStore.initialize()` jest wywoływane w `main.ts`
- Sprawdź czy router guards są poprawnie skonfigurowane
- Sprawdź console w DevTools

## 📝 Następne kroki

1. [ ] Dodać komponent ForgotPasswordForm
2. [ ] Dodać komponent ResetPasswordForm
3. [ ] Dodać toast notifications dla sukcesu/błędów
4. [ ] Dodać loading overlay podczas inicjalizacji
5. [ ] Dodać testy jednostkowe dla store
6. [ ] Dodać E2E testy dla flow autentykacji
7. [ ] Rozważyć przeniesienie tokenów do httpOnly cookies (bezpieczniejsze)

## 🎯 Kluczowe funkcje

✅ **Automatyczne odświeżanie tokenów** - Użytkownik nie musi się ponownie logować  
✅ **Route guards** - Ochrona chronionych stron  
✅ **Role-based access** - Różne uprawnienia dla różnych ról  
✅ **Error handling** - Przyjazne komunikaty błędów  
✅ **Loading states** - Feedback dla użytkownika  
✅ **Type safety** - Pełne typowanie TypeScript  
✅ **Reactive state** - Automatyczne aktualizacje UI  

---

**Status:** ✅ Kompletna integracja gotowa do użycia!

