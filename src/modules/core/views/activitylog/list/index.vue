<!-- eslint-disable import/no-unresolved -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppFilterBar from '@/components/AppFilterBar.vue'
import AppUserDateInfo from '@/components/AppUserDateInfo.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useActivityLogStore } from '@/store/modules/activity-log'
import type { ActivityLog } from '@/api/modules/activity-log'
// eslint-disable-next-line import/extensions
import { useOrganizationStore } from '../../../stores/useOrganizationStore'

const store = useActivityLogStore()

const orgStore = useOrganizationStore()

// ── filters ──────────────────────────────────────────────────────
const search = ref('')
const fromDate = ref('')
const toDate = ref('')
const dateRange = ref('')

watch(dateRange, val => {
  if (val && val.includes(' - ')) {
    const [from, to] = val.split(' - ')

    fromDate.value = from.trim()
    toDate.value = to.trim()
  }
  else {
    fromDate.value = val || ''
    toDate.value = ''
  }

  applyFilters()
})

const methodType = ref<string | null>(null)
const statusCode = ref<string | null>(null)

const methodOptions = [
  { title: 'GET', value: 'GET' },
  { title: 'POST', value: 'POST' },
  { title: 'PUT', value: 'PUT' },
  { title: 'PATCH', value: 'PATCH' },
  { title: 'DELETE', value: 'DELETE' },
]

// ── table ─────────────────────────────────────────────────────────
const selectedIds = ref<number[]>([])
const page = ref(1)
const limit = ref(10)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const limitOptions = [10, 20, 50, 100]

// ── detail dialog ─────────────────────────────────────────────────
const detailDialog = ref(false)
const selectedLog = ref<ActivityLog | null>(null)

// ── confirm dialogs ───────────────────────────────────────────────
const confirmDialog = ref<{ show: boolean; title: string; message: string; onConfirm: () => void }>({
  show: false, title: '', message: '', onConfirm: () => {},
})

const deleteByDateDialog = ref(false)
const deleteFromDate = ref('')
const deleteToDate = ref('')

const hasActiveFilters = computed(() =>
  !!search.value || !!fromDate.value || !!toDate.value || !!methodType.value || !!statusCode.value,
)

// ── snackbar ──────────────────────────────────────────────────────
const snackbar = ref({ show: false, message: '', color: 'success' as 'success' | 'error' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

// ── computed ──────────────────────────────────────────────────────
const totalPages = computed(() => Math.ceil(store.total / limit.value) || 1)

const isAllSelected = computed(() =>
  store.logs.length > 0 && selectedIds.value.length === store.logs.length,
)

const isIndeterminate = computed(() =>
  selectedIds.value.length > 0 && selectedIds.value.length < store.logs.length,
)

const methodColor = (method: string) => {
  const map: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    PATCH: 'info',
    DELETE: 'error',
  }

  return map[method] ?? 'secondary'
}

const statusColor = (code: number) => {
  if (code >= 500)
    return 'error'
  if (code >= 400)
    return 'warning'
  if (code >= 300)
    return 'info'

  return 'success'
}

// ── actions ───────────────────────────────────────────────────────
async function load() {
  await store.fetchLogs({
    page: page.value,
    limit: limit.value,
    search: search.value || undefined,
    from_date: fromDate.value || undefined,
    to_date: toDate.value || undefined,
    method_type: methodType.value || undefined,
    status_code: statusCode.value ? Number(statusCode.value) : undefined,
  })
  selectedIds.value = []
  await orgStore.fetchOrganizations()
}

function applyFilters() {
  page.value = 1
  load()
}

let searchDebounceTimer: ReturnType<typeof setTimeout>
function onSearchInput() {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(applyFilters, 400)
}

function resetFilters() {
  search.value = ''
  fromDate.value = ''
  toDate.value = ''
  methodType.value = ''
  statusCode.value = null
  page.value = 1
  load()
}

function onPageChange(p: number) {
  page.value = p
  load()
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  page.value = 1
  load()
}

function toggleSelectAll(val: boolean | null) {
  selectedIds.value = val
    ? store.logs.map(l => l.id)
    : []
}

function openDetail(log: ActivityLog) {
  selectedLog.value = log
  detailDialog.value = true
}

function handleDelete(log: ActivityLog) {
  showConfirm(
    'Xác nhận xóa',
    `Bạn có chắc muốn xóa nhật ký #${log.id}?`,
    async () => {
      try {
        await store.deleteLog(log.id)
        showToast('Xóa thành công!', 'success')
      }
      catch {
        showToast('Xóa thất bại!', 'error')
      }
    },
  )
}

function handleBulkDelete() {
  if (!selectedIds.value.length)
    return

  showConfirm(
    'Xóa hàng loạt',
    `Bạn có chắc muốn xóa ${selectedIds.value.length} nhật ký đã chọn?`,
    async () => {
      try {
        await store.bulkDelete([...selectedIds.value])
        selectedIds.value = []
        showToast('Xóa hàng loạt thành công!', 'success')
      }
      catch {
        showToast('Xóa hàng loạt thất bại!', 'error')
      }
    },
  )
}

function handleClearAll() {
  showConfirm(
    'Xóa toàn bộ nhật ký',
    'Thao tác này sẽ xóa toàn bộ nhật ký. Không thể hoàn tác!',
    async () => {
      try {
        const msg = await store.clearAll()

        showToast(msg ?? 'Đã xóa toàn bộ nhật ký!', 'success')
      }
      catch {
        showToast('Xóa thất bại!', 'error')
      }
    },
  )
}

async function handleDeleteByDate() {
  if (!deleteFromDate.value || !deleteToDate.value)
    return

  try {
    const msg = await store.deleteByDate(deleteFromDate.value, deleteToDate.value)

    showToast(msg ?? 'Xóa theo thời gian thành công!', 'success')
    deleteByDateDialog.value = false
    deleteFromDate.value = ''
    deleteToDate.value = ''
    load()
  }
  catch {
    showToast('Xóa theo thời gian thất bại!', 'error')
  }
}

async function handleExport() {
  try {
    await store.exportLogs({
      search: search.value || undefined,
      from_date: fromDate.value || undefined,
      to_date: toDate.value || undefined,
      method_type: methodType.value || undefined,
      status_code: statusCode.value ? Number(statusCode.value) : undefined,
    })
    showToast('Xuất dữ liệu thành công!', 'success')
  }
  catch {
    showToast('Xuất dữ liệu thất bại!', 'error')
  }
}

const organizationMap = computed(() => {
  return new Map(
    (orgStore.organizations ?? []).map((org: any) => [
      org.id ?? org.organization_id,
      org.name ?? org.organization_name,
    ]),
  )
})

function getOrganizationName(organizationId: number | null) {
  if (!organizationId)
    return '—'

  return organizationMap.value.get(organizationId) ?? `#${organizationId}`
}
onMounted(load)
</script>

<template>
  <div>
    <!-- System Page Header -->
    <AppSystemPageHeader
      title="Nhật ký hoạt động"
      :total="store.total"
      total-label="Tổng nhật ký"
      total-icon="tabler-history"
      @settings="() => {}"
    />

    <!-- Filter & Actions Bar -->
    <AppFilterBar :has-active-filters="hasActiveFilters">
      <template #filters>
        <!-- Search -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppTextField
            v-model="search"
            placeholder="Nhập từ khóa..."
            prepend-inner-icon="tabler-search"
            clearable
            hide-details
            @input="onSearchInput"
            @click:clear="applyFilters"
          />
        </VCol>

        <!-- Date Range -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppDateTimePicker
            v-model="dateRange"
            :config="{
              mode: 'range',
              dateFormat: 'd/m/Y',
            }"
            clearable
            hide-details
            placeholder="Từ ngày - Đến ngày"
          />
        </VCol>

        <!-- HTTP Method -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppSelect
            v-model="methodType"
            placeholder="Chọn phương thức"
            :items="methodOptions"
            hide-details
            clearable
            @update:model-value="applyFilters"
          />
        </VCol>

        <!-- Status Code -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppTextField
            v-model="statusCode"
            placeholder="Mã Trạng thái VD: 200"
            type="number"
            hide-details
            clearable
            @update:model-value="applyFilters"
          />
        </VCol>
      </template>

      <template #actions>
        <!-- Bulk delete -->
        <VBtn
          v-if="selectedIds.length > 0"
          color="error"
          variant="tonal"
          prepend-icon="tabler-trash"
          @click="handleBulkDelete"
        >
          <span class="d-none d-sm-inline">Xóa</span>
          ({{ selectedIds.length }})
        </VBtn>

        <VBtn
          color="warning"
          variant="tonal"
          @click="deleteByDateDialog = true"
        >
          <VIcon icon="tabler-calendar-minus" />
          <span class="d-none d-sm-inline ms-1">Xóa theo ngày</span>
        </VBtn>

        <VBtn
          color="error"
          variant="tonal"
          @click="handleClearAll"
        >
          <VIcon icon="tabler-trash-x" />
          <span class="d-none d-sm-inline ms-1">Xóa tất cả</span>
        </VBtn>

        <VBtn
          color="secondary"
          variant="tonal"
          @click="handleExport"
        >
          <VIcon icon="tabler-download" />
          <span class="d-none d-sm-inline ms-1">Xuất</span>
        </VBtn>
      </template>

      <!-- Table (default slot) -->
      <div
        v-if="store.logs.length === 0"
        class="text-center py-12"
      >
        <VIcon
          icon="tabler-history-off"
          size="48"
          color="disabled"
          class="mb-3"
        />
        <div class="text-sm text-disabled">
          Không có nhật ký nào
        </div>
      </div>

      <VDataTableServer
        v-else
        fixed-header
        hover
      >
        <thead>
          <tr>
            <th style="width: 40px;">
              <VCheckbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                hide-details
                density="compact"
                @update:model-value="toggleSelectAll"
              />
            </th>
            <th>TÊN NGƯỜI DÙNG</th>
            <th>TỔ CHỨC</th>
            <th>MÔ TẢ</th>
            <th style="width: 130px; min-width: 130px;">
              PHƯƠNG THỨC HTTP
            </th>
            <th style="width: 120px; min-width: 120px;">
              ĐỊA CHỈ IP
            </th>
            <th style="width: 160px; min-width: 160px;">
              THỜI GIAN TRUY CẬP
            </th>
            <th style="width: 130px; min-width: 130px; text-align: left;">
              HÀNH ĐỘNG
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in store.logs"
            :key="log.id"
            style="cursor: pointer;"
            @click="openDetail(log)"
          >
            <td @click.stop>
              <VCheckbox
                v-model="selectedIds"
                :value="log.id"
                hide-details
                density="compact"
              />
            </td>
            <td>
              <div class="d-flex align-center gap-2 py-1">
                <VAvatar
                  size="32"
                  color="primary"
                  variant="tonal"
                >
                  <span class="text-xs font-weight-bold">
                    {{ (log.user_name ?? 'G').slice(0, 2).toUpperCase() }}
                  </span>
                </VAvatar>
                <div>
                  <div class="text-base font-weight-medium text-high-emphasis">
                    {{ log.user_name }}
                  </div>
                  <div class="text-xs text-disabled">
                    {{ log.user_type }}
                  </div>
                </div>
              </div>
            </td>
            <td class="text-sm text-medium-emphasis">
              {{ log.organization_id ? getOrganizationName(log.organization_id) : '—' }}
            </td>
            <td>
              <div
                class="text-sm text-truncate"
                style="max-inline-size: 260px;"
              >
                {{ log.description }}
              </div>
              <div
                class="text-xs text-disabled text-truncate"
                style="max-inline-size: 260px;"
              >
                {{ log.route }}
              </div>
            </td>
            <td>
              <VChip
                :color="methodColor(log.method_type)"
                size="small"
                label
                class="font-weight-bold"
              >
                {{ log.method_type }}
              </VChip>
              <VChip
                :color="statusColor(log.status_code)"
                size="x-small"
                variant="tonal"
                class="ms-1"
              >
                {{ log.status_code }}
              </VChip>
            </td>
            <td>
              <span
                class="text-xs font-weight-medium"
                :class="log.ip_address ? 'text-warning' : 'text-disabled'"
              >
                {{ log.ip_address ?? '—' }}
              </span>
            </td>
            <td>
              <div style="max-width: 160px; overflow: hidden;">
                <AppUserDateInfo :date="log.created_at" />
              </div>
            </td>
            <td class="text-no-wrap" @click.stop>
              <IconBtn @click="openDetail(log)">
                <VIcon icon="tabler-eye" />
              </IconBtn>

              <IconBtn
                color="error"
                @click="handleDelete(log)"
              >
                <VIcon icon="tabler-trash" />
              </IconBtn>

              <VBtn
                icon
                variant="text"
                color="medium-emphasis"
              >
                <VIcon icon="tabler-dots-vertical" />
                <VMenu activator="parent">
                  <VList>
                    <VListItem @click="openDetail(log)">
                      <template #prepend>
                        <VIcon icon="tabler-eye" />
                      </template>
                      <VListItemTitle>Xem chi tiết</VListItemTitle>
                    </VListItem>

                    <VListItem @click="handleDelete(log)">
                      <template #prepend>
                        <VIcon icon="tabler-trash" />
                      </template>
                      <VListItemTitle>Xóa</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </VBtn>
            </td>
          </tr>
        </tbody>

        <!-- Pagination -->
        <template #bottom>
          <AppPagination
            :page="page"
            :limit="limit"
            :total="store.total"
            :loading="store.isLoading"
            :limit-options="[10, 15, 20, 50, 100]"
            @update:page="onPageChange"
            @update:limit="onLimitChange"
          />
        </template>
      </VDataTableServer>
    </AppFilterBar>

    <!-- Detail Dialog -->
    <VDialog
      v-model="detailDialog"
      max-width="700"
      scrollable
    >
      <VCard v-if="selectedLog">
        <VCardTitle class="pt-6 px-6 d-flex align-center gap-3">
          <VIcon icon="tabler-history" />
          Chi tiết nhật ký #{{ selectedLog.id }}
          <VSpacer />
          <IconBtn @click="detailDialog = false">
            <VIcon icon="tabler-x" />
          </IconBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="px-6 py-4">
          <VRow dense>
            <VCol cols="4">
              <div class="text-xs text-disabled">
                Người dùng
              </div>
              <div class="text-sm font-weight-medium">
                {{ selectedLog.user_name }}
              </div>
            </VCol>
            <VCol cols="4">
              <div class="text-xs text-disabled">
                Loại người dùng
              </div>
              <div class="text-sm">
                {{ selectedLog.user_type }}
              </div>
            </VCol>
            <VCol cols="4">
              <div class="text-xs text-disabled">
                Tổ chức
              </div>
              <div class="text-sm">
                {{ selectedLog.organization_id ? `${getOrganizationName(selectedLog.organization_id)}` : '' }}
              </div>
            </VCol>

            <VCol cols="12">
              <VDivider class="my-3" />
            </VCol>

            <VCol cols="12">
              <div class="text-xs text-disabled">
                Mô tả
              </div>
              <div class="text-sm">
                {{ selectedLog.description }}
              </div>
            </VCol>

            <VCol cols="12">
              <div class="text-xs text-disabled">
                Route
              </div>
              <div class="text-sm text-break">
                {{ selectedLog.route }}
              </div>
            </VCol>

            <VCol cols="3">
              <div class="text-xs text-disabled">
                Phương thức
              </div>
              <VChip
                :color="methodColor(selectedLog.method_type)"
                size="small"
                label
                class="font-weight-bold mt-1"
              >
                {{ selectedLog.method_type }}
              </VChip>
            </VCol>

            <VCol cols="3">
              <div class="text-xs text-disabled">
                Mã trạng thái
              </div>
              <VChip
                :color="statusColor(selectedLog.status_code)"
                size="small"
                variant="tonal"
                class="mt-1"
              >
                {{ selectedLog.status_code }}
              </VChip>
            </VCol>

            <VCol cols="3">
              <div class="text-xs text-disabled">
                Địa chỉ IP
              </div>
              <div class="text-sm font-weight-medium text-warning">
                {{ selectedLog.ip_address }}
              </div>
            </VCol>

            <VCol cols="3">
              <div class="text-xs text-disabled">
                Quốc gia
              </div>
              <div class="text-sm">
                {{ selectedLog.country ?? '—' }}
              </div>
            </VCol>

            <VCol cols="12">
              <VDivider class="my-3" />
            </VCol>

            <VCol cols="12">
              <div class="text-xs text-disabled mb-1">
                User Agent
              </div>
              <div class="text-xs text-medium-emphasis">
                {{ selectedLog.user_agent }}
              </div>
            </VCol>

            <VCol
              v-if="selectedLog.request_data"
              cols="12"
            >
              <div class="text-xs text-disabled mb-1">
                Request Data
              </div>
              <pre
                class="text-xs bg-surface-variant pa-3 rounded"
                style="overflow-x: auto; white-space: pre-wrap;"
              >{{ JSON.stringify(selectedLog.request_data, null, 2) }}</pre>
            </VCol>

            <VCol cols="12">
              <VDivider class="my-3" />
            </VCol>

            <VCol cols="6">
              <div class="text-xs text-disabled">
                Thời gian tạo
              </div>
              <div class="text-sm">
                {{ selectedLog.created_at }}
              </div>
            </VCol>
            <VCol cols="6">
              <div class="text-xs text-disabled">
                Cập nhật lần cuối
              </div>
              <div class="text-sm">
                {{ selectedLog.updated_at }}
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Delete by date dialog -->
    <VDialog
      v-model="deleteByDateDialog"
      max-width="400"
      persistent
    >
      <VCard rounded="lg">
        <VCardTitle class="pt-6 px-6">
          Xóa nhật ký theo khoảng thời gian
        </VCardTitle>
        <VCardText class="px-6">
          <VRow dense>
            <VCol cols="6">
              <AppDateTimePicker
                v-model="deleteFromDate"
                label="Từ ngày"
                :config="{
                  dateFormat: 'd/m/Y',
                  maxDate: toDate || undefined,
                }"
                clearable
                hide-details
              />
            </VCol>
            <VCol cols="6">
              <AppDateTimePicker
                v-model="deleteToDate"
                label="Đến ngày"
                :config="{
                  dateFormat: 'd/m/Y',
                  maxDate: toDate || undefined,
                }"
                clearable
                hide-details
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="px-6 pb-6">
          <VSpacer />
          <VBtn
            variant="tonal"
            color="secondary"
            @click="deleteByDateDialog = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="error"
            :disabled="!deleteFromDate || !deleteToDate"
            @click="handleDeleteByDate"
          >
            Xóa
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Confirm dialog -->
    <AppConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      @confirm="() => { confirmDialog.onConfirm(); confirmDialog.show = false }"
    />

    <!-- Snackbar -->
    <AppSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </div>
</template>

<style scoped>
:deep(tbody tr) {
  height: 64px;
}
</style>
