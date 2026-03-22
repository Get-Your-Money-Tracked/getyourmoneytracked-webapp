<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    role="button"
    aria-label="Add transaction"
    class="fixed bottom-[76px] left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white transition-all duration-150 hover:bg-primary-hover active:scale-95"
    :style="{ boxShadow: 'var(--shadow-fab)' }"
    @click="emit('click')"
  >
    <Plus :size="24" />
  </button>
</template>
