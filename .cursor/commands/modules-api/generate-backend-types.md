Jesteś wykwalifikowanym programistą TypeScript, którego zadaniem jest stworzenie biblioteki typów DTO (Data Transfer Object) i modeli poleceń (Command Models) dla aplikacji. Twoim zadaniem jest przeanalizowanie planu modułów backendu oraz planu API, a następnie wygenerowanie odpowiednich typów, które dokładnie reprezentują struktury danych, bazując na zdefiniowanych encjach i wymaganiach API.

Najpierw dokładnie przejrzyj następujące dane wejściowe:

1. Plan Modułów Backendu (definicje encji i DTO):
   <module_plan>
   {{module-plan}}
   </module_plan>

2. Plan API (punkty końcowe, struktury żądań/odpowiedzi):
   <api_plan>
   {{api-plan}}
   </api_plan>

3. (Opcjonalnie) Nazwa modułu do wygenerowania:
   <module_name>
   {{module_name}}
   </module_name>

Twoim zadaniem jest utworzenie definicji typów TypeScript dla DTO i modeli poleceń określonych w planach, upewniając się, że pochodzą one z definicji encji w planie modułów. Jeśli podano nazwę modułu (`module_name`), skup się tylko na tym module. W przeciwnym razie wygeneruj typy dla wszystkich modułów.

Wykonaj następujące kroki:

1. Przeanalizuj `module_plan` i `api_plan`.
2. Jeśli podano `module_name`, odfiltruj analizę tylko do tego modułu.
3. Utwórz typy DTO i Command Modele na podstawie DTO zdefiniowanych w `module_plan` i ich użycia w `api_plan`, wykorzystując definicje encji jako podstawę.
4. Zapewnij zgodność typów z wymaganiami API (np. pola w żądaniach/odpowiedziach).
5. Stosuj odpowiednie funkcje języka TypeScript (Pick, Omit, Partial, etc.) w celu tworzenia, zawężania lub rozszerzania typów zgodnie z potrzebami.

Przed utworzeniem ostatecznego wyniku, pracuj wewnątrz tagów <dto_analysis> w swoim bloku myślenia, aby pokazać swój proces myślowy. W swojej analizie:

- Określ, czy generujesz typy dla wszystkich modułów, czy dla jednego konkretnego modułu (na podstawie `module_name`).
- Dla każdego modułu (lub wybranego modułu):
  - Zidentyfikuj encję (lub encje) zdefiniowaną w `module_plan`.
  - Przeanalizuj DTOs zdefiniowane w `module_plan` dla tego modułu.
  - Przeanalizuj odpowiednie punkty końcowe w `api_plan`, aby zrozumieć, jak DTOs są używane w żądaniach i odpowiedziach.
  - Wymień DTOs i modele poleceń do wygenerowania dla tego modułu.
  - Dla każdego DTO/modelu polecenia:
    - Określ jego podstawową encję z `module_plan`.
    - Opisz, jakie pola z encji zostaną użyte, pominięte lub zmodyfikowane.
    - Wskaż, jakich narzędzi TypeScript (np. `Pick`, `Omit`, `Partial`) użyjesz.
    - Utwórz szkic struktury typu.

Po przeprowadzeniu analizy, wygeneruj ostateczne definicje DTO, modeli poleceń oraz **interfejsów**. Zgodnie z architekturą NestJS, każdy DTO lub interfejs powinien znaleźć się w osobnym pliku w odpowiednim katalogu (`dto` lub `interfaces`) swojego modułu.

**Generuj klasy DTO dla struktur danych używanych w API (ciała żądań i odpowiedzi), które wymagają walidacji.**
**Generuj interfejsy dla wewnętrznych struktur danych, modeli encji lub kontraktów, które nie wymagają walidacji w warstwie HTTP.**

Sformatuj swój wynik jako serię bloków, gdzie każdy blok reprezentuje jeden plik. Użyj następujących struktur:

**Dla DTO:**
<file_path>backend/src/{nazwa_modułu}/dto/{nazwa-pliku-dto}.dto.ts</file_path>

```typescript
// Cała zawartość pliku DTO, włącznie z importami i dekoratorami walidacji.
import { IsString, IsNotEmpty } from 'class-validator'

export class NazwaDto {
  @IsString()
  @IsNotEmpty()
  readonly pole: string
}
```

**Dla Interfejsów:**
<file_path>backend/src/{nazwa_modułu}/interfaces/{nazwa-pliku-interfejsu}.interface.ts</file_path>

```typescript
// Cała zawartość pliku interfejsu.
export interface NazwaInterfejsu {
  readonly pole: string
}
```

Pamiętaj:

- **Struktura plików:** Ściśle przestrzegaj ścieżek `.../dto/{file-name}.dto.ts` dla DTOs i `.../interfaces/{file-name}.interface.ts` dla interfejsów.
- **Nazewnictwo:**
  - Pliki: `kebab-case` (np. `create-user.dto.ts`, `user-entity.interface.ts`).
  - Klasy DTO: `PascalCase` (np. `CreateUserDto`).
  - Interfejsy: `PascalCase` (np. `UserInterface`, `IUser`).
- **Kompletność:** Każdy blok kodu powinien zawierać pełną zawartość pliku, w tym wszystkie niezbędne importy.
- **Zakres:** Upewnij się, że uwzględniasz wszystkie DTO i interfejsy wynikające z analizy planów.

Końcowy wynik powinien składać się wyłącznie z serii bloków `<file_path>` i ` ```typescript`, bez dodatkowego tekstu czy wyjaśnień poza blokami kodu.
