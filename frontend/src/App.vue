<script setup lang="ts">
import { ref } from 'vue'

const message = ref<string>('CoachFlow')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center p-8">
      <h1 class="text-5xl font-bold text-green-600 mb-4">{{ message }}</h1>
      <p class="text-xl text-gray-600">Vue 3 + TypeScript + Vite + Tailwind CSS</p>
      <p class="mt-4 text-sm text-gray-500">Frontend is ready! 🚀</p>
    </div>
  </div>
</template>

