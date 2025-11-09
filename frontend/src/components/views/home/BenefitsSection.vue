<script setup lang="ts"></script>

<template>
  <section class="px-6 py-20 md:py-32 lg:py-40">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16 md:mb-20">
        <h2 class="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
          Dlaczego CoachFlow?
        </h2>
        <p class="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto">
          Wszystko czego potrzebujesz do zarządzania treningami w jednym miejscu
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <!-- Karta dla Trenerów -->
        <div class="bg-card rounded-3xl p-8 md:p-10 shadow-sm border border-border/50 hover:shadow-md transition-shadow duration-300">
          <div class="mb-8">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 class="text-2xl md:text-3xl font-semibold mb-2">Dla Trenerów</h3>
            <p class="text-muted-foreground font-light">
              Profesjonalne narzędzia do zarządzania Twoją praktyką treningową
            </p>
          </div>
          
          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5"></div>
              <div>
                <h4 class="font-medium text-foreground/90 mb-1">Zarządzaj grafikiem</h4>
                <p class="text-sm text-muted-foreground font-light leading-relaxed">
                  Wszystkie rezerwacje i blokady dostępności w przejrzystym kalendarzu
                </p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5"></div>
              <div>
                <h4 class="font-medium text-foreground/90 mb-1">Profesjonalny profil</h4>
                <p class="text-sm text-muted-foreground font-light leading-relaxed">
                  Twórz atrakcyjny profil z opisem specjalizacji i usług
                </p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5"></div>
              <div>
                <h4 class="font-medium text-foreground/90 mb-1">Kontroluj swój czas</h4>
                <p class="text-sm text-muted-foreground font-light leading-relaxed">
                  Akceptuj lub odrzucaj rezerwacje oraz blokuj niedostępne terminy
                </p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5"></div>
              <div>
                <h4 class="font-medium text-foreground/90 mb-1">Rozwijaj bazę klientów</h4>
                <p class="text-sm text-muted-foreground font-light leading-relaxed">
                  Bądź widoczny dla osób szukających trenera w Twojej specjalizacji
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Karta dla Klientów -->
        <div class="bg-card rounded-3xl p-8 md:p-10 shadow-sm border border-border/50 hover:shadow-md transition-shadow duration-300">
          <div class="mb-8">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-2xl md:text-3xl font-semibold mb-2">Dla Klientów</h3>
            <p class="text-muted-foreground font-light">
              Prosty sposób na organizację Twojego planu treningowego
            </p>
          </div>
          
          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5"></div>
              <div>
                <h4 class="font-medium text-foreground/90 mb-1">Szybka rezerwacja</h4>
                <p class="text-sm text-muted-foreground font-light leading-relaxed">
                  Rezerwuj sesje w kilka kliknięć bez zbędnych formalności
                </p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5"></div>
              <div>
                <h4 class="font-medium text-foreground/90 mb-1">Twój kalendarz treningów</h4>
                <p class="text-sm text-muted-foreground font-light leading-relaxed">
                  Wszystkie nadchodzące sesje w jednym miejscu
                </p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5"></div>
              <div>
                <h4 class="font-medium text-foreground/90 mb-1">Znajdź idealnego trenera</h4>
                <p class="text-sm text-muted-foreground font-light leading-relaxed">
                  Przeglądaj profile, specjalizacje i oferty różnych trenerów
                </p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5"></div>
              <div>
                <h4 class="font-medium text-foreground/90 mb-1">Automatyczne przypomnienia</h4>
                <p class="text-sm text-muted-foreground font-light leading-relaxed">
                  Otrzymuj powiadomienia o nadchodzących treningach
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

