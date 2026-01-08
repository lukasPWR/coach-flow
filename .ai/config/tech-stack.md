- Framework - Vue.js 3: Nowoczesny i wydajny framework do budowy interaktywnych interfejsów użytkownika. Idealnie pasuje do aplikacji typu dashboard, jak CoachFlow.

- Język - TypeScript 5: Zapewnia statyczne typowanie w całym kodzie frontendu, co zwiększa jego niezawodność i ułatwia pracę w zespole.

- Styling - Tailwind CSS 4: Umożliwia szybkie i spójne stylowanie aplikacji bezpośrednio w kodzie HTML/komponentach.

- Biblioteka komponentów - shadcn-vue: To port popularnej biblioteki shadcn/ui do Vue. Zapewnia zestaw pięknych, dostępnych i konfigurowalnych komponentów (jak shadcn/ui), co pozwala zachować oryginalną filozofię UI i przyspieszyć development. Alternatywą może być PrimeVue.

- Build Tool - Vite: Nowoczesne i niezwykle szybkie narzędzie do budowy, które zapewnia błyskawiczny start serwera deweloperskiego i optymalizację kodu produkcyjnego.

#### Backend

- **Framework - NestJS**: Progresywny framework Node.js oparty na TypeScript, przeznaczony do budowy wydajnych, niezawodnych i skalowalnych aplikacji serwerowych. Jego architektura ułatwia tworzenie i utrzymanie złożonych systemów.

- **Baza danych - PostgreSQL**: Potężny, open-source'owy, obiektowo-relacyjny system baz danych, ceniony za swoją stabilność, wydajność i bogaty zestaw funkcji.

- **ORM - TypeORM**: Dojrzały i wszechstronny ORM (Object-Relational Mapper) dla TypeScript i JavaScript, który wspiera zarówno Active Record jak i Data Mapper. Umożliwia pracę z bazą danych przy użyciu dekoratorów i klas.

#### Testing

- **Framework testów jednostkowych - Jest**: Nowoczesny framework do testowania, zapewniający szybkie i niezawodne testy jednostkowe i integracyjne dla kodu TypeScript/JavaScript. Idealny dla NestJS dzięki wbudowanej obsłudze Dependency Injection.

- **HTTP API Testing - Supertest**: Biblioteka do testowania endpointów HTTP w kombinacji z Jestem. Umożliwia testowanie kontrolerów NestJS bez uruchamiania serwera.

- **E2E Testing - Cypress/Playwright**: Narzędzia do testowania całych scenariuszy użytkownika z perspektywy frontendu. Cypress dla szybszych iteracji deweloperskich, Playwright dla bardziej zaawansowanych scenariuszy.

- **Code Quality - ESLint & Prettier**: Narzędzia do statycznej analizy kodu i formatowania. Zapewniają spójność i jakość kodu testowego oraz całego projektu.

- **Manual Testing Tools - Postman & Swagger UI**: Narzędzia do eksploracyjnego testowania API i weryfikacji kontraktów (Contract Testing).

#### AI - Openrouter.ai (bez zmian)

- Bramka do modeli AI: Dostęp do wielu modeli językowych (OpenAI, Anthropic, Google) przez jedno API, co pozwala na optymalizację kosztów i jakości.

- Zarządzanie kluczami: Możliwość ustawiania limitów finansowych na klucze API.

#### CI/CD i Hosting (bez zmian)

- CI/CD: Github Actions do automatyzacji procesów budowania, testowania i wdrażania aplikacji.

- Hosting: DigitalOcean do hostowania aplikacji w kontenerze Docker.
