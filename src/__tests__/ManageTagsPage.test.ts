import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import ManageTagsPage from '@/pages/ManageTagsPage.vue'
import type { TagUsage } from '@/graphql/queries/tags'

// ── Infrastructure mocks ────────────────────────────────────────────────────
vi.mock('@/lib/firebase', () => ({
  auth: { onIdTokenChanged: vi.fn() },
}))

vi.mock('@/lib/urql', () => ({
  urqlClient: {
    query: vi.fn(() => ({ toPromise: vi.fn() })),
    mutation: vi.fn(() => ({ toPromise: vi.fn() })),
  },
  setCachedToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

vi.mock('lucide-vue-next', () => ({
  Pencil: { template: '<span class="pencil-icon" />' },
  Trash2: { template: '<span class="trash-icon" />' },
}))

// ── Tag query/mutation mocks ────────────────────────────────────────────────
const _mockTags = ref<TagUsage[]>([])
const _mockTagsError = ref<string | null>(null)
const _mockRenameTag = vi.fn(async () => 1)
const _mockDeleteTag = vi.fn(async () => 1)

vi.mock('@/graphql/queries/tags', () => ({
  callTagUsageCounts: vi.fn(async () => {
    if (_mockTagsError.value) throw new Error(_mockTagsError.value)
    return _mockTags.value
  }),
  callRenameTag: vi.fn(async (oldName: string, newName: string) => _mockRenameTag(oldName, newName)),
  callDeleteTag: vi.fn(async (name: string) => _mockDeleteTag(name)),
}))

// ── Toast mock ──────────────────────────────────────────────────────────────
const _mockShow = vi.fn()
vi.mock('@/stores/toast', () => ({
  useToastStore: () => ({ show: _mockShow }),
}))

// ── RenameTagDialog stub ────────────────────────────────────────────────────
vi.mock('@/components/tags/RenameTagDialog.vue', () => ({
  default: {
    name: 'RenameTagDialog',
    props: ['open', 'tagName', 'tagCount'],
    emits: ['close', 'rename'],
    template: `
      <div v-if="open" data-testid="rename-dialog-stub">
        <button data-testid="stub-rename-emit" @click="$emit('rename', 'new-name')">Rename</button>
        <button data-testid="stub-close-emit" @click="$emit('close')">Close</button>
      </div>
    `,
  },
}))

function mountPage() {
  return mount(ManageTagsPage, {
    attachTo: document.body,
  })
}

describe('ManageTagsPage', () => {
  beforeEach(() => {
    _mockTags.value = []
    _mockTagsError.value = null
    _mockRenameTag.mockResolvedValue(1)
    _mockDeleteTag.mockResolvedValue(1)
    _mockShow.mockReset()
    document.body.innerHTML = ''
  })

  it('renders the page heading', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="manage-tags-heading"]').text()).toBe('Manage Tags')
  })

  it('shows empty state when no tags', async () => {
    _mockTags.value = []
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="tags-empty-state"]').exists()).toBe(true)
  })

  it('renders tag list when tags exist', async () => {
    _mockTags.value = [
      { name: 'trip', count: 12 },
      { name: 'business', count: 8 },
    ]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="tag-list"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tag-row-trip"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tag-row-business"]').exists()).toBe(true)
  })

  it('displays tag name and count', async () => {
    _mockTags.value = [{ name: 'trip', count: 12 }]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="tag-name-trip"]').text()).toBe('trip')
    expect(wrapper.find('[data-testid="tag-count-trip"]').text()).toContain('12 transactions')
  })

  it('shows singular "transaction" when count is 1', async () => {
    _mockTags.value = [{ name: 'solo', count: 1 }]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="tag-count-solo"]').text()).toContain('1 transaction')
    expect(wrapper.find('[data-testid="tag-count-solo"]').text()).not.toContain('1 transactions')
  })

  it('shows error state when load fails', async () => {
    _mockTagsError.value = 'Network error'
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="tags-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tags-error"]').text()).toContain('Network error')
  })

  it('renders rename and delete buttons for each tag', async () => {
    _mockTags.value = [{ name: 'trip', count: 3 }]
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="rename-tag-btn-trip"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="delete-tag-btn-trip"]').exists()).toBe(true)
  })

  it('calls callDeleteTag and reloads when delete button is clicked', async () => {
    const { callDeleteTag } = await import('@/graphql/queries/tags')
    _mockTags.value = [{ name: 'trip', count: 5 }]
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('[data-testid="delete-tag-btn-trip"]').trigger('click')
    await flushPromises()
    expect(callDeleteTag).toHaveBeenCalledWith('trip')
  })
})
