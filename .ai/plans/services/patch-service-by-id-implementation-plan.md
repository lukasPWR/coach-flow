# Plan implementacji punktu końcowego API: PATCH /services/:id

## 1. Przegląd punktu końcowego

Punkt końcowy `PATCH /services/:id` umożliwia zalogowanemu użytkownikowi z rolą trenera aktualizację szczegółów jednej ze swoich usług. Aktualizacja dotyczy tylko wybranych pól, zgodnie z semantyką metody `PATCH`. Punkt końcowy zapewnia, że trener może modyfikować wyłącznie własne zasoby.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/services/:id`
- **Parametry**:
    - **Wymagane**:
        - `id` (w URL): Identyfikator UUID usługi, która ma zostać zaktualizowana.
- **Nagłówki**:
    - `Authorization`: `Bearer <token JWT>`
- **Ciało żądania**: Obiekt JSON zawierający pola do zaktualizowania. Wszystkie pola są opcjonalne.
  ```json
  {
    "name": "Nowa nazwa usługi",
    "description": "Zaktualizowany opis usługi.",
    "price": 150.00,
    "currency": "PLN",
    "duration": 60,
    "serviceTypeId": "e8e7e6e5-e4e3-e2e1-e0f9-f8f7f6f5f4f3"
  }
  ```

## 3. Wykorzystywane typy

- **`UpdateServiceDto`**: Nowy DTO (Data Transfer Object) do walidacji danych przychodzących w ciele żądania. Zostanie utworzony przy użyciu `PartialType` z `CreateServiceDto`, aby zapewnić, że wszystkie pola są opcjonalne.
- **`ServiceResponseDto`**: Istniejący DTO używany do formatowania obiektu usługi w odpowiedzi.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**:
    - Zwraca pełny, zaktualizowany obiekt usługi w formacie `ServiceResponseDto`.
    ```json
    {
      "id": "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
      "name": "Nowa nazwa usługi",
      "description": "Zaktualizowany opis usługi.",
      "price": 150.00,
      "currency": "PLN",
      "duration": 60,
      "serviceTypeId": "e8e7e6e5-e4e3-e2e1-e0f9-f8f7f6f5f4f3",
      "trainerId": "f1e2d3c4-b5a6-f7e8-d9c0-b1a2f3e4d5c6",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T12:30:00.000Z",
      "deletedAt": null,
      "serviceType": {
        "id": "e8e7e6e5-e4e3-e2e1-e0f9-f8f7f6f5f4f3",
        "name": "Trening personalny"
      }
    }
    ```
- **Odpowiedzi błędów**:
    - `400 Bad Request`: Gdy dane w ciele żądania są nieprawidłowe lub parametr `id` nie jest w formacie UUID.
    - `401 Unauthorized`: Gdy token JWT jest nieprawidłowy lub go brakuje.
    - `404 Not Found`: Gdy usługa o podanym `id` nie istnieje lub nie należy do zalogowanego trenera.

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do `ServicesController`.
2.  `JwtAuthGuard` weryfikuje token JWT i dołącza obiekt `user` do żądania.
3.  Metoda kontrolera odbiera `id` z parametrów URL oraz `updateServiceDto` z ciała żądania.
4.  `ParseUUIDPipe` waliduje format `id`.
5.  `ValidationPipe` waliduje obiekt `updateServiceDto`.
6.  Kontroler wywołuje metodę `servicesService.update(id, user.id, updateServiceDto)`.
7.  Metoda `update` w `ServicesService` najpierw wyszukuje usługę po `id` i `userId`, aby potwierdzić jej istnienie i własność. Jeśli usługa nie zostanie znaleziona, rzucany jest `NotFoundException`.
8.  Jeśli usługa istnieje, serwis dokonuje aktualizacji danych w bazie danych za pomocą `PrismaService`.
9.  Serwis zwraca zaktualizowany obiekt usługi do kontrolera.
10. Kontroler serializuje odpowiedź przy użyciu `ServiceResponseDto` i wysyła ją do klienta ze statusem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego jest chroniony przez `JwtAuthGuard`.
- **Autoryzacja**: Logika w `ServicesService` musi bezwzględnie weryfikować, czy `trainerId` modyfikowanej usługi jest zgodny z `id` zalogowanego użytkownika. Zapobiega to modyfikacji zasobów innych użytkowników.
- **Walidacja danych**: Wszystkie dane wejściowe muszą być walidowane za pomocą `class-validator` w `UpdateServiceDto`, aby zapobiec niepoprawnym danym i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności

- Operacja aktualizacji pojedynczego rekordu w bazie danych jest zazwyczaj bardzo wydajna.
- Wyszukiwanie usługi przed aktualizacją (`findOne`) powinno być wykonane na zindeksowanych kolumnach (`id` i `trainerId`), aby zapewnić szybkość operacji.
- Nie przewiduje się znaczących wąskich gardeł wydajnościowych dla tego punktu końcowego.

## 8. Etapy wdrożenia

1.  **Utworzenie DTO**:
    -   W pliku `backend/src/services/dto/update-service.dto.ts` utwórz klasę `UpdateServiceDto` używając `PartialType(CreateServiceDto)`.
2.  **Aktualizacja serwisu (`ServicesService`)**:
    -   W pliku `backend/src/services/services.service.ts` dodaj nową metodę asynchroniczną `update(id: string, userId: string, updateServiceDto: UpdateServiceDto)`.
    -   Zaimplementuj logikę wyszukiwania usługi po `id` i `userId`. W przypadku braku, rzuć `NotFoundException`.
    -   Zaimplementuj logikę aktualizacji rekordu w bazie danych przy użyciu `prisma.service.update`.
    -   Zwróć zaktualizowany obiekt usługi.
3.  **Aktualizacja kontrolera (`ServicesController`)**:
    -   W pliku `backend/src/services/services.controller.ts` dodaj nową metodę dla `PATCH /:id`.
    -   Użyj dekoratorów `@Patch(':id')`, `@ApiOperation`, `@ApiResponse`.
    -   Zabezpiecz metodę za pomocą `@UseGuards(JwtAuthGuard)`.
    -   Wstrzyknij parametry: `@Param('id', ParseUUIDPipe) id: string`, `@Body() updateServiceDto: UpdateServiceDto`, oraz `@ActiveUser() user: IActiveUser`.
    -   Wywołaj metodę `servicesService.update` z odpowiednimi argumentami.
    -   Zwróć wynik działania serwisu.
