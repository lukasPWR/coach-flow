<script setup lang="ts">
// Simple layout for authentication pages (login, register, password recovery)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
    <div class="w-full max-w-md">
      <!-- Logo and branding -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary mb-2">CoachFlow</h1>
        <p class="text-muted-foreground">Platforma dla trenerów i ich klientów</p>
      </div>

      <!-- Content slot for forms -->
      <div class="bg-card rounded-xl shadow-lg border border-border p-8">
        <slot />
      </div>

      <!-- Footer -->
      <div class="text-center mt-6 text-sm text-muted-foreground">
        <p>&copy; 2025 CoachFlow. Wszelkie prawa zastrzeżone.</p>
      </div>
    </div>
  </div>
</template>

