<script setup lang="ts">
import { computed } from 'vue'
import type { UpcomingBill } from '@/types'
import UpcomingBillItem from '@/components/dashboard/UpcomingBillItem.vue'

const props = defineProps<{
  bills: UpcomingBill[]
}>()

const hasBills = computed(() => props.bills.length > 0)
</script>

<template>
  <!-- Hidden entirely when no bills -->
  <section v-if="hasBills" class="mt-6" data-testid="upcoming-bills">
    <!-- Section header -->
    <div class="mb-2 px-4">
      <h2 class="text-card-title font-semibold text-text-primary">Upcoming Bills</h2>
    </div>

    <!-- Card -->
    <div class="mx-4 divide-y divide-border rounded-xl bg-surface shadow-card">
      <UpcomingBillItem
        v-for="bill in bills"
        :key="bill.id"
        :bill="bill"
      />
    </div>
  </section>
</template>
