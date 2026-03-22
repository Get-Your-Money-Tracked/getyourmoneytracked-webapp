import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TOAST_DURATION_MS } from '@/utils/constants'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  message: string
  variant: ToastVariant
}

let nextId = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([])

  function show(message: string, variant: ToastVariant = 'success', duration = TOAST_DURATION_MS) {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message, variant }]
    setTimeout(() => {
      dismiss(id)
    }, duration)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    show,
    dismiss,
  }
})
