<script setup lang="ts">
/**
 * StaggerList — wraps a list in <TransitionGroup> with per-item stagger delay.
 *
 * Usage:
 *   <StaggerList>
 *     <div v-for="(item, i) in items" :key="item.id" :style="{ transitionDelay: `${i * 30}ms` }">
 *       ...
 *     </div>
 *   </StaggerList>
 *
 * Or pass a flat list of items and let StaggerList handle the delay via CSS variables.
 */

defineProps<{
  /** HTML tag for the TransitionGroup wrapper (default: "div") */
  tag?: string
}>()
</script>

<template>
  <TransitionGroup
    :tag="tag ?? 'div'"
    name="stagger-list"
  >
    <slot />
  </TransitionGroup>
</template>

<style scoped>
.stagger-list-enter-active {
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}
.stagger-list-leave-active {
  transition: opacity 200ms ease-in, transform 200ms ease-in;
}
.stagger-list-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.stagger-list-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.stagger-list-move {
  transition: transform 200ms ease;
}
</style>
