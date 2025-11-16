# Mermaid Diagram - User Journey

Jesteś specjalistą UX, którego zadaniem jest utworzenie diagramu Mermaid w celu wizualizacji podróży użytkownika dla modułu logowania i rejestracji. Diagram powinien zostać utworzony w następującym pliku: DESTINATION

Będziesz musiał odnieść się do następujących plików w celu poznania istniejących wymagań:

<destination>
.ai/diagrams/journey.md
</destination>

Twoim zadaniem jest analiza specyfikacji modułu logowania i rejestracji oraz utworzenie kompleksowego diagramu Mermaid, który dokładnie przedstawia podróż użytkownika. Diagram powinien być w języku polskim.

Przed utworzeniem diagramu, przeanalizuj wymagania i zaplanuj swoje podejście. Umieść swoją analizę wewnątrz tagów <user_journey_analysis>. W tej analizie:

1. Wypisz wszystkie ścieżki użytkownika wymienione w plikach referencyjnych.
2. Zidentyfikuj główne podróże i ich odpowiadające stany.
3. Określ punkty decyzyjne i alternatywne ścieżki.
4. Dostarcz krótki opis celu każdego stanu.

Kiedy będziesz gotowy do utworzenia diagramu, postępuj zgodnie z poniższymi wytycznymi:

1. Rozpocznij diagram od następującej składni:

   ```mermaid
   stateDiagram-v2
   ```

2. Uwzględnij następujące elementy w swoim diagramie:

   - Ścieżki użytkownika oparte na istniejących wymaganiach
   - Korzystanie z aplikacji jako niezalogowany użytkownik
   - Dostęp do głównej funkcjonalności aplikacji
   - Logowanie się
   - Tworzenie konta
   - Odzyskiwanie hasła
   - Podróż użytkownika na wysokim poziomie zgodna z wymaganiami projektu i HISTORIAMI UŻYTKOWNIKA
   - Punkty decyzyjne i alternatywne ścieżki
   - Przepływ po weryfikacji e-mail
   - Skupienie się na ścieżkach biznesowych, a nie aspektach technicznych

3. Przestrzegaj tych zasad składni Mermaid:

   - Stany początkowe i końcowe muszą być poprawnie zdefiniowane:
     ```
     [*] --> StronaGlowna
     StronaGlowna --> [*]
     ```
   - Używaj stanów złożonych do grupowania powiązanych stanów:
     ```
     state "Proces Rejestracji" as Rejestracja {
       [*] --> FormularzRejestracji
       FormularzRejestracji --> WalidacjaDanych
       WalidacjaDanych --> WyslanieMaila
     }
     ```
   - Dla rozgałęzień decyzyjnych, używaj poprawnej składni:
     ```
     state if_weryfikacja <<choice>>
     WeryfikacjaTokena --> if_weryfikacja
     if_weryfikacja --> TokenPoprawny: Token OK
     if_weryfikacja --> TokenNiepoprawny: Token błędny
     ```
   - Używaj notatek dla dodatkowych informacji:
     ```
     FormularzLogowania: Użytkownik może się zalogować
     note right of FormularzLogowania
       Formularz zawiera pola email i hasło
       oraz link do odzyskiwania hasła
     end note
     ```
   - Dla stanów równoległych, używaj poprawnej składni:

     ```
     state fork_state <<fork>>
     state join_state <<join>>

     Rejestracja --> fork_state
     fork_state --> WyslanieMaila
     fork_state --> AktualizacjaBazy
     WyslanieMaila --> join_state
     AktualizacjaBazy --> join_state
     join_state --> StanKoncowy
     ```

   - Używaj przestrzeni nazw do organizowania złożonych diagramów:
     ```
     state "Autentykacja" as Autentykacja {
       state "Logowanie" as Logowanie {
         // stany dla procesu logowania
       }
       state "Rejestracja" as Rejestracja {
     ```
