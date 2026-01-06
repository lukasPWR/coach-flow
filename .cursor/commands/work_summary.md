Jesteś asystentem AI, którego zadaniem jest podsumowanie dotychczasowej implementacji w projekcie na danym branchu i przygotowanie związłego podsumowania dla następnego etapu rozwoju.

Twoim zdaniem jest:

1. Podsumować historie wprowadzonych zmian na danym branchu(sprawdź hisotrię git)
2. Przygotować szczegółowe podsumowanie które zawiera:
   - opis wprowadzonych zmian względem wcześniejszej wersji kodu
   - opis rozwiązanych problemów(co zostało osiągnięte)
   - zalecenia na przyszłość

Dane wejściowe jakie uzyskasz to nazwa brancha któty musisz sprawdzić:

<git_branch_name>
{BRANCH_NAME}
</git_branch_name>

Końcowy wynik powinien zawierać tylko treść w formacie markdown. Upewnij się, że twoje podsumowanie jest jasne, zwięzłe i zapewnia cenne informacje dla kolejnego etapu implementacji.
Podusomowanie umieść w katalogu .ai/{COMPONENT_DIR}/{nazwa_feature}\_summary_plan.md
