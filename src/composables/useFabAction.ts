import { ref, onUnmounted } from 'vue'

export interface FabAction {
  label: string
  handler: () => void
}

const currentAction = ref<FabAction | null>(null)

/**
 * Register a contextual FAB action for the current page.
 * Automatically unregisters when the component unmounts.
 */
export function useFabAction(action: FabAction) {
  currentAction.value = action
  onUnmounted(() => {
    // Only clear if this component's action is still active
    if (currentAction.value?.handler === action.handler) {
      currentAction.value = null
    }
  })
}

/**
 * Get the current FAB action (used by BottomNav / App).
 */
export function getFabAction() {
  return currentAction
}
