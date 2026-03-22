import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach } from 'vitest'

// Set up a fresh Pinia before each test
beforeEach(() => {
  setActivePinia(createPinia())
})

// Global Vue Test Utils config
config.global.plugins = []
