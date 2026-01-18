Jesteś wykwalifikowanym programistą NestJS/TypeScript (Senior Backend Developer). Twoim zadaniem jest stworzenie warstwy DTO (Data Transfer Objects), Enums oraz interfejsów na podstawie dostarczonych planów.

DANE WEJŚCIOWE:

1. Plan Modułów Backendu:
   <module_plan>
   {{module-plan}}
   </module_plan>

2. Plan API:
   <api_plan>
   {{api-plan}}
   </api_plan>

3. (Opcjonalnie) Nazwa modułu:
   <module_name>
   {{module_name}}
   </module_name>

ZADANIE:
Wygeneruj kompletny kod TypeScript dla DTO, Enums i Interfejsów. Kod musi być gotowy do użycia w frameworku NestJS z wykorzystaniem `class-validator`, `class-transformer` oraz `@nestjs/swagger`.

WYMAGANIA TECHNICZNE (Kluczowe dla NestJS):

1. **Swagger & Dokumentacja:**
   - Wszystkie pola w DTO muszą posiadać dekorator `@ApiProperty()` (lub `@ApiPropertyOptional()`).
   - Opisz pola w Swaggerze (np. `description`, `example`) bazując na kontekście z dokumentacji.

2. **Walidacja i Transformacja:**
   - Używaj dekoratorów z `class-validator` (np. `@IsString`, `@IsUUID`, `@IsEnum`, `@ValidateNested`).
   - Dla obiektów zagnieżdżonych (tablice obiektów w JSON) i relacji, OBOWIĄZKOWO używaj `@Type(() => ChildDto)` z `class-transformer`.
   - Generuj dedykowane DTO dla odpowiedzi (Response DTO), jeśli struktura zwracana przez API różni się od struktury Encji (np. spłaszczone dane w `GET /training-plans/:id`). Użyj `@Expose()` i `@Exclude()` jeśli to konieczne.

3. **Mapped Types (Dziedziczenie):**
   - Nie używaj natywnych typów TS (`Partial<T>`). Zamiast tego używaj `PartialType`, `PickType`, `OmitType` 
   - Przykład: `export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}`.

4. **Enums:**
   - Wszystkie Enumy zdefiniowane w planach (np. `MuscleGroupType`) wygeneruj w osobnych plikach `.enum.ts`.

5. **Struktura plików:**
   - DTO: `src/{module}/dto/{name}.dto.ts`
   - Enums: `src/{module}/enums/{name}.enum.ts`
   - Interfejsy: `src/{module}/interfaces/{name}.interface.ts`

PROCES ANALIZY (Wewnątrz tagów <dto_analysis>):
1. Zidentyfikuj wszystkie Enumy i zaplanuj dla nich pliki.
2. Przeanalizuj żądania (Request Body) -> Stwórz `Create...Dto` i `Update...Dto`.
3. Przeanalizuj odpowiedzi (Response Body) -> Jeśli odpowiedź jest złożona (np. zawiera zagnieżdżone `units` i `exercises`), zaprojektuj `ResponseDto` (np. `TrainingPlanDetailsDto`).
4. Zwróć uwagę na pola `UUID` - zawsze stosuj `@IsUUID()`.

FORMAT WYNIKOWY:
Generuj tylko bloki kodu z nagłówkiem ścieżki pliku. Bez zbędnego tekstu.

Przykład formatu:
<file_path>src/exercises/dto/create-exercise.dto.ts</file_path>
```typescript
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MuscleGroupType } from '../enums/muscle-group-type.enum';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Bench Press', description: 'Name of the exercise' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: MuscleGroupType, enumName: 'MuscleGroupType' })
  @IsEnum(MuscleGroupType)
  muscleGroup: MuscleGroupType;
}