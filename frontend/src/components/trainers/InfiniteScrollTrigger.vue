<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  enabled?: boolean
}

interface Emits {
  (e: 'loadMore'): void
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
})

const emit = defineEmits<Emits>()

const triggerRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// Setup intersection observer
function setupObserver() {
  if (!triggerRef.value) return

  // Clean up existing observer
  if (observer) {
    observer.disconnect()
  }

  // Create new observer
  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries

      // If element is visible and enabled, emit loadMore
      if (entry.isIntersecting && props.enabled) {
        emit('loadMore')
      }
    },
    {
      // Trigger when element is 100px from viewport
      rootMargin: '100px',
      threshold: 0,
    },
  )

  observer.observe(triggerRef.value)
}

// Cleanup observer
function cleanupObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// Watch enabled prop to reconnect observer
watch(
  () => props.enabled,
  (newEnabled) => {
    if (newEnabled && triggerRef.value) {
      setupObserver()
    } else {
      cleanupObserver()
    }
  },
)

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  cleanupObserver()
})
</script>

<template>
  <div ref="triggerRef" class="h-4 w-full" aria-hidden="true" />
</template>
