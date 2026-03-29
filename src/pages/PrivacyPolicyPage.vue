<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, Shield } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-surface-elevated">
    <div class="mx-auto max-w-md px-4 pb-28 pt-6">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-3">
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-surface-muted"
          data-testid="back-btn"
          @click="router.back()"
        >
          <ArrowLeft :size="20" class="text-text-primary" />
        </button>
        <h1 class="text-page-title font-bold text-text-primary">Privacy Policy</h1>
      </div>

      <!-- Content -->
      <div
        class="space-y-6 rounded-2xl bg-surface p-5"
        :style="{ boxShadow: 'var(--shadow-card)' }"
      >
        <!-- Intro -->
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Shield :size="20" class="text-primary" />
          </div>
          <div>
            <h2 class="text-card-title font-semibold text-text-primary">Your data, your control</h2>
            <p class="mt-1 text-body text-text-secondary">
              Last updated: March 2026
            </p>
          </div>
        </div>

        <div class="space-y-5 text-body text-text-secondary">
          <!-- What we collect -->
          <section>
            <h3 class="mb-1.5 text-sub-title font-semibold text-text-primary">What we collect</h3>
            <p>
              We only store the data you explicitly enter: transactions, categories, budgets,
              accounts, goals, and recurring entries. Your email address and display name are
              stored for authentication purposes.
            </p>
          </section>

          <!-- What we don't collect -->
          <section>
            <h3 class="mb-1.5 text-sub-title font-semibold text-text-primary">What we don't collect</h3>
            <ul class="ml-4 list-disc space-y-1">
              <li>No bank credentials or account numbers</li>
              <li>No analytics or tracking cookies</li>
              <li>No advertising data</li>
              <li>No data sold to third parties</li>
              <li>No browsing or usage tracking</li>
            </ul>
          </section>

          <!-- How data is stored -->
          <section>
            <h3 class="mb-1.5 text-sub-title font-semibold text-text-primary">How your data is stored</h3>
            <ul class="ml-4 list-disc space-y-1">
              <li><span class="font-medium text-text-primary">Encrypted at rest</span> &mdash; your data is stored in a database with AES-256 encryption</li>
              <li><span class="font-medium text-text-primary">Encrypted in transit</span> &mdash; all communication uses HTTPS/TLS</li>
              <li><span class="font-medium text-text-primary">Authentication</span> &mdash; handled by Firebase Auth (we never see your password)</li>
            </ul>
          </section>

          <!-- Data access -->
          <section>
            <h3 class="mb-1.5 text-sub-title font-semibold text-text-primary">Who can access your data</h3>
            <p>
              Only you. We do not access, review, or analyse individual user data.
              The database administrator has technical access for maintenance purposes only.
            </p>
          </section>

          <!-- Data deletion -->
          <section>
            <h3 class="mb-1.5 text-sub-title font-semibold text-text-primary">Delete your data</h3>
            <p>
              You can permanently delete your account and all associated data at any time from
              <button
                type="button"
                class="font-medium text-primary hover:underline"
                @click="router.push('/settings')"
              >Settings</button>.
              Deletion is immediate and irreversible &mdash; we do not keep backups of deleted accounts.
            </p>
          </section>

          <!-- Third-party services -->
          <section>
            <h3 class="mb-1.5 text-sub-title font-semibold text-text-primary">Third-party services</h3>
            <ul class="ml-4 list-disc space-y-1">
              <li><span class="font-medium text-text-primary">Firebase Auth</span> &mdash; authentication only (Google)</li>
              <li><span class="font-medium text-text-primary">Neon</span> &mdash; database hosting (encrypted at rest)</li>
              <li><span class="font-medium text-text-primary">Render</span> &mdash; API hosting</li>
              <li><span class="font-medium text-text-primary">Netlify</span> &mdash; frontend hosting</li>
            </ul>
          </section>

          <!-- Contact -->
          <section>
            <h3 class="mb-1.5 text-sub-title font-semibold text-text-primary">Questions?</h3>
            <p>
              If you have questions about this policy or your data, open an issue on our
              <a
                href="https://github.com/Get-Your-Money-Tracked"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-primary hover:underline"
              >GitHub</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
