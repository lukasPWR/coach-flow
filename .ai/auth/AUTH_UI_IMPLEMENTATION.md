# Implementacja UI Autentykacji - CoachFlow

## Przegląd

Zaimplementowano kompletny interfejs użytkownika dla procesu autentykacji zgodnie ze specyfikacją w `.ai/auth/auth-spec.md`. Implementacja obejmuje wszystkie strony i formularze potrzebne do logowania, rejestracji i odzyskiwania hasła.

## Zaimplementowane komponenty

### 1. Layouty

#### `src/components/layouts/AuthLayout.vue`

- Prosty, centralnie umieszczony layout dla stron autentykacji
- Zawiera logo CoachFlow i branding
- Gradient tła z wykorzystaniem kolorów z `style.css`
- Responsywny design z maksymalną szerokością 28rem (448px)
- Stopka z informacjami o prawach autorskich

### 2. Komponenty UI

#### `src/components/ui/radio-group/`

Utworzono brakujący komponent RadioGroup zgodny z shadcn-vue:

- `RadioGroup.vue` - główny kontener
- `RadioGroupItem.vue` - pojedynczy element wyboru
- `index.ts` - eksport komponentów

### 3. Formularze autentykacji

#### `src/components/auth/RegisterForm.vue`

**Pola formularza:**

- Imię (walidacja: wymagane, min. 2 znaki)
- E-mail (walidacja: wymagane, format e-mail)
- Hasło (walidacja: wymagane, min. 8 znaków)
- Potwierdź hasło (walidacja: wymagane, zgodność z hasłem)
- Wybór roli (RadioGroup: USER/TRAINER)
- Akceptacja regulaminu (Checkbox: wymagane)

**Funkcjonalności:**

- Walidacja po stronie klienta
- Wyświetlanie błędów walidacji pod polami
- Stan ładowania podczas wysyłania
- Obsługa błędów API (np. e-mail zajęty)
- Link do strony logowania

#### `src/components/auth/LoginForm.vue`

**Pola formularza:**

- E-mail (walidacja: wymagane, format e-mail)
- Hasło (walidacja: wymagane)

**Funkcjonalności:**

- Walidacja po stronie klienta
- Link do odzyskiwania hasła
- Stan ładowania podczas wysyłania
- Obsługa błędów API (nieprawidłowe dane)
- Link do strony rejestracji

#### `src/components/auth/ForgotPasswordForm.vue`

**Pola formularza:**

- E-mail (walidacja: wymagane, format e-mail)

**Funkcjonalności:**

- Walidacja po stronie klienta
- Komunikat sukcesu po wysłaniu e-maila
- Stan ładowania podczas wysyłania
- Link powrotu do logowania
- Ikona strzałki dla lepszej UX

#### `src/components/auth/ResetPasswordForm.vue`

**Pola formularza:**

- Nowe hasło (walidacja: wymagane, min. 8 znaków)
- Potwierdź nowe hasło (walidacja: wymagane, zgodność)

**Funkcjonalności:**

- Ekstrakcja tokenu z URL (query parameter)
- Walidacja tokenu przy montowaniu komponentu
- Walidacja po stronie klienta
- Komunikat sukcesu po zmianie hasła
- Obsługa błędów (nieprawidłowy/wygasły token)
- Link do logowania po sukcesie

### 4. Strony (Views)

Wszystkie strony wykorzystują `AuthLayout` i odpowiednie formularze:

- `src/views/RegisterPage.vue` - strona rejestracji
- `src/views/LoginPage.vue` - strona logowania
- `src/views/ForgotPasswordPage.vue` - strona odzyskiwania hasła
- `src/views/ResetPasswordPage.vue` - strona resetowania hasła

### 5. Routing

Zaktualizowano `src/router/index.ts` o nowe trasy:

- `/register` - rejestracja
- `/login` - logowanie
- `/forgot-password` - odzyskiwanie hasła
- `/reset-password` - resetowanie hasła (z tokenem w query)

## Stylistyka

Wszystkie komponenty wykorzystują:

- Tailwind CSS zgodnie z konfiguracją w `style.css`
- Kolory z systemu designu (primary, destructive, muted, etc.)
- Komponenty shadcn-vue dla spójnego wyglądu
- Ikony z `lucide-vue-next`
- Responsywny design (mobile-first)
- Animacje ładowania (spinner)
- Gradient tła dla stron autentykacji

## Walidacja

Każdy formularz zawiera:

- Walidację po stronie klienta (przed wysłaniem)
- Wyświetlanie błędów pod polami
- Czyszczenie błędów podczas edycji pola
- Komunikaty błędów w języku polskim
- Wyróżnienie pól z błędami (czerwona ramka)

### Komunikaty błędów

Zgodnie ze specyfikacją:

- "Pole jest wymagane."
- "Proszę podać poprawny adres e-mail."
- "Hasło musi mieć co najmniej 8 znaków."
- "Hasła nie są identyczne."
- "Musisz zaakceptować regulamin."
- "Adres e-mail jest już zajęty." (z API)
- "Nieprawidłowy e-mail lub hasło." (z API)

## Integracja z backendem

Wszystkie formularze zawierają zakomentowane miejsca na integrację z API:

- `// TODO: Call authStore.register()` w RegisterForm
- `// TODO: Call authStore.login()` w LoginForm
- `// TODO: Call API endpoint` w ForgotPasswordForm i ResetPasswordForm

Obecnie formularze symulują wywołania API z opóźnieniem 1.5s dla celów demonstracyjnych.

## Stany formularzy

Każdy formularz obsługuje:

- **Loading state** - wyświetlanie spinnera i dezaktywacja przycisku
- **Error state** - wyświetlanie alertów z błędami
- **Success state** - komunikaty sukcesu (ForgotPassword, ResetPassword)

## Dostępność (a11y)

Komponenty zapewniają:

- Prawidłowe etykiety dla pól (`<Label>`)
- Powiązanie etykiet z polami (atrybut `for`)
- Komunikaty błędów powiązane z polami
- Fokus management
- Komponenty shadcn-vue z wbudowaną obsługą ARIA

## Następne kroki

Aby dokończyć implementację autentykacji:

1. **Pinia Store** - utworzyć `src/stores/auth.ts` z akcjami:

   - `register(credentials)`
   - `login(credentials)`
   - `logout()`
   - `fetchUser()`
   - `refreshToken()`

2. **API Client** - utworzyć `src/lib/api.ts` lub composable `useApi()`

3. **Navigation Guards** - dodać w `router/index.ts`:

   - Sprawdzanie `meta: { requiresAuth: true }`
   - Przekierowanie niezalogowanych użytkowników

4. **Token Management** - implementacja:

   - Przechowywanie access token w Pinia
   - Przechowywanie refresh token w HttpOnly cookie
   - Automatyczne odświeżanie tokenów

5. **DefaultLayout** - rozszerzenie Header.vue o:
   - Warunkowe wyświetlanie dla gości/zalogowanych
   - Avatar i menu użytkownika
   - Opcję wylogowania

## Testowanie

Aby przetestować UI:

```bash
cd frontend
npm run dev
```

Następnie odwiedź:

- http://localhost:5173/register - rejestracja
- http://localhost:5173/login - logowanie
- http://localhost:5173/forgot-password - odzyskiwanie hasła
- http://localhost:5173/reset-password?token=test123 - resetowanie hasła

## Struktura plików

```
frontend/src/
├── components/
│   ├── layouts/
│   │   └── AuthLayout.vue
│   ├── auth/
│   │   ├── RegisterForm.vue
│   │   ├── LoginForm.vue
│   │   ├── ForgotPasswordForm.vue
│   │   └── ResetPasswordForm.vue
│   └── ui/
│       └── radio-group/
│           ├── RadioGroup.vue
│           ├── RadioGroupItem.vue
│           └── index.ts
├── views/
│   ├── RegisterPage.vue
│   ├── LoginPage.vue
│   ├── ForgotPasswordPage.vue
│   └── ResetPasswordPage.vue
└── router/
    └── index.ts (zaktualizowany)
```
