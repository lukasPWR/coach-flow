# CoachFlow - Plan Seedowania Bazy Danych

## 📋 Analiza Struktury Bazy Danych

Na podstawie analizy encji w projekcie, zidentyfikowano następujące tabele wymagające seedowania:

### Tabele Słownikowe (Dane Systemowe)

| Tabela                      | Opis                                             | Priorytet |
| --------------------------- | ------------------------------------------------ | --------- |
| `service_types`             | Typy usług (np. Trening personalny, Konsultacja) | 🔴 Wysoki |
| `specializations`           | Specjalizacje trenerów (np. Fitness, CrossFit)   | 🔴 Wysoki |
| `exercises` (isSystem=true) | Systemowa baza ćwiczeń                           | 🔴 Wysoki |

### Tabele Użytkowników (Dane Demo)

| Tabela                    | Opis                                     | Priorytet |
| ------------------------- | ---------------------------------------- | --------- |
| `users`                   | Użytkownicy demo (admin, trener, klient) | 🔴 Wysoki |
| `trainer_profiles`        | Profile trenerów                         | 🟡 Średni |
| `trainer_specializations` | Powiązanie trener-specjalizacja          | 🟡 Średni |
| `services`                | Usługi oferowane przez trenera           | 🟡 Średni |

---

## 🎯 Proponowane Dane Seedowe

### 1. Service Types (Typy Usług)

```
- Trening personalny
- Trening przygotowania motorycznego
- Konsultacja dietetyczna
- Trening grupowy
- Trening online
- Plan treningowy
- Analiza składu ciała
```

### 2. Specializations (Specjalizacje)

```
- Fitness & Kulturystyka
- CrossFit
- Trening funkcjonalny
- Trening siłowy
- Przygotowanie motoryczne
- Rehabilitacja ruchowa
- Trening seniorów
- Trening dla kobiet
- Trening sportowców
- Odchudzanie
- Budowa masy mięśniowej
- Trening mobilności
```

### 3. Users (Użytkownicy Demo)

| Rola    | Email               | Hasło      | Nazwa         |
| ------- | ------------------- | ---------- | ------------- |
| ADMIN   | admin@coachflow.pl  | Admin123!  | Administrator |
| TRAINER | trener@coachflow.pl | Trener123! | Jan Kowalski  |
| CLIENT  | klient@coachflow.pl | Klient123! | Anna Nowak    |

### 4. Exercises (Ćwiczenia Systemowe)

Ćwiczenia podzielone według grup mięśniowych (`MuscleGroupType`):

#### CHEST (Klatka piersiowa)

- Wyciskanie sztangi na ławce płaskiej
- Wyciskanie hantli na ławce skośnej
- Rozpiętki z hantlami
- Pompki klasyczne
- Wyciskanie na maszynie

#### BACK (Plecy)

- Martwy ciąg klasyczny
- Podciąganie na drążku
- Wiosłowanie sztangą w opadzie
- Ściąganie drążka wyciągu górnego
- Wiosłowanie jednorącz hantlem

#### SHOULDERS (Barki)

- Wyciskanie sztangi nad głowę
- Wyciskanie hantli siedząc
- Unoszenie hantli bokiem
- Unoszenie hantli w opadzie
- Face pull

#### BICEPS

- Uginanie ramion ze sztangą stojąc
- Uginanie hantli z rotacją (supinacja)
- Uginanie na modlitewniku
- Uginanie hantli "młotkowe"
- Uginanie na wyciągu dolnym

#### TRICEPS

- Wyciskanie francuskie
- Prostowanie ramion na wyciągu
- Pompki w podporze tyłem (dips)
- Wyciskanie wąskim chwytem
- Kickback z hantlem

#### QUADRICEPS (Czworogłowe uda)

- Przysiad ze sztangą
- Przysiad bułgarski
- Wykroki z hantlami
- Prostowanie nóg na maszynie
- Goblet squat

#### HAMSTRINGS (Dwugłowe uda)

- Martwy ciąg rumuński
- Uginanie nóg leżąc na maszynie
- Hip thrust
- Good morning
- Nordic curl

#### GLUTES (Pośladki)

- Hip thrust ze sztangą
- Odwodzenie nogi na wyciągu
- Wykroki boczne
- Przysiad sumo
- Glute bridge

#### CALVES (Łydki)

- Wspięcia na palce stojąc
- Wspięcia na palce siedząc
- Wspięcia na maszynie

#### ABS (Brzuch)

- Plank
- Brzuszki (crunches)
- Unoszenie nóg w zwisie
- Russian twist
- Dead bug
- Mountain climbers

#### CARDIO

- Bieg na bieżni
- Rower stacjonarny
- Wioślarz
- Skakanka
- Burpees

#### FULL_BODY (Całe ciało)

- Martwy ciąg klasyczny
- Przysiad ze sztangą
- Wyciskanie sztangi nad głowę
- Kettlebell swing
- Clean and jerk

### 5. Trainer Profile (Profil Trenera Demo)

```
Trener: Jan Kowalski
Miasto: Warszawa
Opis: Certyfikowany trener personalny z 5-letnim doświadczeniem.
      Specjalizuję się w treningu siłowym i przygotowaniu motorycznym.
Specjalizacje: [Trening siłowy, Przygotowanie motoryczne, Budowa masy mięśniowej]
```

### 6. Services (Usługi Trenera Demo)

| Typ usługi              | Cena    | Czas trwania |
| ----------------------- | ------- | ------------ |
| Trening personalny      | 150 PLN | 60 min       |
| Konsultacja dietetyczna | 100 PLN | 45 min       |
| Plan treningowy         | 200 PLN | 90 min       |

---

## 🔧 Implementacja - Kroki do Wykonania

### Krok 1: Przygotowanie Struktury Plików

```
backend/src/database/seed/
├── data/
│   ├── service-types.seed.ts    # Dane typów usług
│   ├── specializations.seed.ts  # Dane specjalizacji
│   ├── exercises.seed.ts        # Dane ćwiczeń systemowych
│   └── users.seed.ts            # Dane użytkowników demo
├── seeders/
│   ├── service-types.seeder.ts
│   ├── specializations.seeder.ts
│   ├── exercises.seeder.ts
│   ├── users.seeder.ts
│   ├── trainer-profiles.seeder.ts
│   └── services.seeder.ts
├── seed.ts                      # Główny skrypt seedowania
└── seed.module.ts               # Moduł NestJS dla seed
```

### Krok 2: Utworzenie Plików z Danymi

1. **service-types.seed.ts** - eksportuje tablicę typów usług
2. **specializations.seed.ts** - eksportuje tablicę specjalizacji
3. **exercises.seed.ts** - eksportuje tablicę ~50 ćwiczeń z `isSystem: true`
4. **users.seed.ts** - eksportuje dane 3 użytkowników (zahashowane hasła)

### Krok 3: Utworzenie Seederów

Każdy seeder powinien:

- Sprawdzić czy dane już istnieją (unikać duplikatów)
- Używać transakcji dla bezpieczeństwa
- Logować postęp seedowania

### Krok 4: Główny Skrypt Seed

Utworzenie `seed.ts` który:

1. Inicjalizuje połączenie z bazą danych
2. Uruchamia seedery w odpowiedniej kolejności (zależności!)
3. Obsługuje błędy i rollback

### Krok 5: Konfiguracja NPM Scripts

Dodanie do `package.json`:

```json
{
  "scripts": {
    "seed": "ts-node src/database/seed/seed.ts",
    "seed:prod": "node dist/database/seed/seed.js"
  }
}
```

### Krok 6: Integracja z Docker Compose

Modyfikacja `docker-compose.yml` aby uruchamiał seed po migracji:

```yaml
command: >
  sh -c "npx typeorm migration:run && npm run seed:prod && npm run start:prod"
```

Alternatywnie: dodanie flagi `--seed` do komendy startowej.

### Krok 7: Dokumentacja

Aktualizacja README z informacją o:

- Dostępnych użytkownikach demo
- Hasłach testowych
- Jak uruchomić seed manualnie

---

## ⚠️ Kolejność Seedowania (Zależności)

```
1. service_types        (brak zależności)
2. specializations      (brak zależności)
3. exercises            (brak zależności - system exercises mają trainerId = null)
4. users                (brak zależności)
5. trainer_profiles     (zależy od: users)
6. trainer_specializations (zależy od: trainer_profiles, specializations)
7. services             (zależy od: users, service_types)
8. [opcjonalnie] bookings (zależy od: users, services)
9. [opcjonalnie] training_plans, training_units, plan_exercises
```

---

## 📝 Uwagi Implementacyjne

### Hasła Użytkowników

- Używać bcrypt z `BCRYPT_SALT_ROUNDS` z env (domyślnie 12)
- Hasła powinny być hashowane przed insertem

### Idempotencja

- Seed powinien być idempotentny (można uruchomić wielokrotnie)
- Sprawdzać istnienie danych przed insertem
- Używać `INSERT ... ON CONFLICT DO NOTHING` lub sprawdzenia w kodzie

### Środowisko Produkcyjne

- Rozważyć flagę `SEED_ENABLED=true/false`
- Możliwość wyłączenia seeda danych demo w produkcji
- Dane słownikowe (service_types, specializations, exercises) zawsze seedować

### TypeORM vs Raw SQL

- Zalecane: użycie TypeORM repositories dla zachowania spójności
- Alternatywa: migracja TypeORM z danymi seed (mniej elastyczne)

---

## 🚀 Proponowany Plan Działania

| Etap | Opis                                              | Estymacja |
| ---- | ------------------------------------------------- | --------- |
| 1    | Utworzenie struktury folderów i plików z danymi   | 30 min    |
| 2    | Implementacja seederów dla danych słownikowych    | 1h        |
| 3    | Implementacja seederów dla użytkowników i profili | 1h        |
| 4    | Główny skrypt seed.ts z obsługą błędów            | 30 min    |
| 5    | Konfiguracja npm scripts i integracja z Docker    | 30 min    |
| 6    | Testy i dokumentacja                              | 30 min    |

**Łączny czas: ~4h**

---

## ✅ Checklist Przed Wdrożeniem

- [ ] Wszystkie hasła demo są bezpieczne (nie używane w produkcji)
- [ ] Seed jest idempotentny
- [ ] Kolejność seederów respektuje zależności FK
- [ ] Testy manualne przeszły pomyślnie
- [ ] Dokumentacja README zaktualizowana
- [ ] Docker compose testowany end-to-end
