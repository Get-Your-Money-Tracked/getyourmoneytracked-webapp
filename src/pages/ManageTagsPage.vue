<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { callTagUsageCounts, callRenameTag, callDeleteTag } from '@/graphql/queries/tags'
import type { TagUsage } from '@/graphql/queries/tags'
import { useToastStore } from '@/stores/toast'
import RenameTagDialog from '@/components/tags/RenameTagDialog.vue'

const toastStore = useToastStore()

// ── State ─────────────────────────────────────────────────────
const tags = ref<TagUsage[]>([])
const isLoading = ref(false)
const loadError = ref<string | null>(null)

// ── Rename dialog ─────────────────────────────────────────────
const renameDialogOpen = ref(false)
const renamingTag = ref<TagUsage | null>(null)
const isRenaming = ref(false)

// ── Delete confirmation ───────────────────────────────────────
const deletingTagName = ref<string | null>(null)
const isDeleting = ref(false)

// ── Load ──────────────────────────────────────────────────────
async function loadTags() {
  isLoading.value = true
  loadError.value = null
  try {
    tags.value = await callTagUsageCounts()
  } catch (e: unknown) {
    loadError.value = (e as Error).message ?? 'Failed to load tags.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadTags)

// ── Rename ────────────────────────────────────────────────────
function openRenameDialog(tag: TagUsage) {
  renamingTag.value = tag
  renameDialogOpen.value = true
}

async function handleRename(newName: string) {
  if (!renamingTag.value) return
  isRenaming.value = true
  try {
    await callRenameTag(renamingTag.value.name, newName)
    toastStore.show(`Tag renamed to "${newName}"`, 'success')
    renameDialogOpen.value = false
    renamingTag.value = null
    await loadTags()
  } catch (e: unknown) {
    toastStore.show((e as Error).message ?? 'Failed to rename tag.', 'error')
  } finally {
    isRenaming.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────
async function handleDelete(name: string) {
  deletingTagName.value = name
  isDeleting.value = true
  try {
    await callDeleteTag(name)
    toastStore.show(`Tag "${name}" deleted`, 'success')
    deletingTagName.value = null
    await loadTags()
  } catch (e: unknown) {
    toastStore.show((e as Error).message ?? 'Failed to delete tag.', 'error')
  } finally {
    isDeleting.value = false
    deletingTagName.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface-elevated">
    <div class="mx-auto max-w-md px-4 pb-28 pt-6">
      <!-- Page title -->
      <h1 class="text-page-title mb-6 font-bold text-text-primary" data-testid="manage-tags-heading">
        Manage Tags
      </h1>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-12 text-text-secondary" data-testid="tags-loading">
        Loading...
      </div>

      <!-- Error -->
      <div
        v-else-if="loadError"
        class="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-body text-danger"
        data-testid="tags-error"
      >
        {{ loadError }}
      </div>

      <!-- Empty state -->
      <div
        v-else-if="tags.length === 0"
        class="text-center py-12"
        data-testid="tags-empty-state"
      >
        <p class="text-body text-text-secondary">No tags yet.</p>
        <p class="text-caption text-text-muted mt-1">Start by adding tags to your transactions.</p>
      </div>

      <!-- Tag list -->
      <div
        v-else
        class="overflow-hidden rounded-xl bg-surface"
        :style="{ boxShadow: 'var(--shadow-card)' }"
        data-testid="tag-list"
      >
        <div
          v-for="(tag, idx) in tags"
          :key="tag.name"
          :data-testid="`tag-row-${tag.name}`"
        >
          <div class="flex items-center justify-between px-4 py-3">
            <div class="min-w-0 flex-1">
              <p class="text-body font-medium text-text-primary" :data-testid="`tag-name-${tag.name}`">
                {{ tag.name }}
              </p>
              <p class="text-caption text-text-secondary" :data-testid="`tag-count-${tag.name}`">
                {{ tag.count }} {{ tag.count === 1 ? 'transaction' : 'transactions' }}
              </p>
            </div>
            <div class="flex gap-3 ml-3">
              <button
                type="button"
                class="text-text-secondary hover:text-primary transition-colors duration-150"
                :data-testid="`rename-tag-btn-${tag.name}`"
                @click="openRenameDialog(tag)"
              >
                <Pencil :size="16" />
              </button>
              <button
                type="button"
                class="text-text-secondary hover:text-danger transition-colors duration-150"
                :disabled="deletingTagName === tag.name && isDeleting"
                :data-testid="`delete-tag-btn-${tag.name}`"
                @click="handleDelete(tag.name)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
          <div v-if="idx < tags.length - 1" class="border-t border-border" />
        </div>
      </div>
    </div>
  </div>

  <!-- Rename dialog -->
  <RenameTagDialog
    :open="renameDialogOpen"
    :tag-name="renamingTag?.name ?? ''"
    :tag-count="renamingTag?.count ?? 0"
    data-testid="rename-tag-dialog-component"
    @close="renameDialogOpen = false; renamingTag = null"
    @rename="handleRename"
  />
</template>
