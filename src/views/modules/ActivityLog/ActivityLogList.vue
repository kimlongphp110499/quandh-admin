<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useActivityLogStore } from '@/store/modules/activity-log'
import type { ActivityLog } from '@/api/modules/activity-log'

const store = useActivityLogStore()

// ── filters ──────────────────────────────────────────────────────
const search = ref('')
const fromDate = ref('')
const toDate = ref('')
const methodType = ref('')
const statusCode = ref<string>('')

const methodOptions = [
  { title: 'Tất cả', value: '' },
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
}

function applyFilters() {
  page.value = 1
  load()
}

function resetFilters() {
  search.value = ''
  fromDate.value = ''
  toDate.value = ''
  methodType.value = ''
  statusCode.value = ''
  page.value = 1
  load()
}

function onPageChange(p: number) {
  page.value = p
  load()
}

function onLimitChange() {
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

onMounted(load)
</script>

<template>
  <div>
    <!-- Header stats -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        md="4"
      >
        <VCard
          elevation="0"
          border
        >
          <VCardText class="d-flex align-center gap-4">
            <VAvatar
              color="primary"
              variant="tonal"
              size="48"
              rounded
            >
              <VIcon
                icon="tabler-history"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ store.total }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Tổng số nhật ký
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filter -->
    <VCard
      elevation="0"
      border
      class="mb-4"
    >
      <VCardText>
        <VRow
          dense
          align="center"
        >
          <VCol
            cols="12"
            md="3"
          >
            <AppTextField
              v-model="search"
              label="Tìm kiếm người dùng, IP, mô tả..."
              prepend-inner-icon="tabler-search"
              clearable
              @keyup.enter="applyFilters"
            />
          </VCol>
          <VCol
            cols="6"
            md="2"
          >
            <AppDateTimePicker
              v-model="fromDate"
              label="Từ ngày"
              placeholder="Từ ngày"
              :config="{
                dateFormat: 'Y-m-d',
                maxDate: toDate || undefined,
              }"
              style="inline-size: 10rem;"
              clearable
            />
          </VCol>
          <VCol
            cols="6"
            md="2"
          >
            <AppDateTimePicker
              v-model="toDate"
              label="Đến ngày"
              placeholder="Đến ngày"
              :config="{
                dateFormat: 'Y-m-d',
                minDate: fromDate || undefined,
              }"
              style="inline-size: 10rem;"
              clearable
            />
          </VCol>
          <VCol
            cols="6"
            md="2"
          >
            <AppSelect
              v-model="methodType"
              label="Phương thức HTTP"
              :items="methodOptions"
            />
          </VCol>
          <VCol
            cols="6"
            md="2"
          >
            <AppTextField
              v-model="statusCode"
              label="Mã trạng thái"
              type="number"
              placeholder="200"
            />
          </VCol>
          <VCol
            cols="12"
            md="1"
            class="d-flex gap-2"
          >
            <VBtn
              icon="tabler-search"
              color="primary"
              variant="tonal"
              :loading="store.isLoading"
              @click="applyFilters"
            />
            <VBtn
              icon="tabler-x"
              color="secondary"
              variant="tonal"
              @click="resetFilters"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Toolbar -->
    <VCard
      elevation="0"
      border
      class="mb-4"
    >
      <VCardText class="d-flex flex-wrap align-center gap-3 py-3">
        <div class="text-body-2 text-medium-emphasis">
          Bộ lọc: Tổ chức
          <span class="font-weight-medium text-high-emphasis">
            <VIcon
              icon="tabler-chevron-right"
              size="12"
            />
          </span>
          Người dùng
        </div>

        <VSpacer />

        <VBtn
          v-if="selectedIds.length > 0"
          color="error"
          variant="tonal"
          prepend-icon="tabler-trash"
          @click="handleBulkDelete"
        >
          Xóa ({{ selectedIds.length }})
        </VBtn>

        <VBtn
          color="warning"
          variant="tonal"
          prepend-icon="tabler-calendar-minus"
          @click="deleteByDateDialog = true"
        >
          Xóa theo ngày
        </VBtn>

        <VBtn
          color="error"
          variant="tonal"
          prepend-icon="tabler-trash-x"
          @click="handleClearAll"
        >
          Xóa tất cả
        </VBtn>

        <VBtn
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-download"
          @click="handleExport"
        >
          Xuất dữ liệu
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard
      elevation="0"
      border
    >
      <div
        v-if="store.isLoading"
        class="d-flex justify-center align-center py-12"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <div
        v-else-if="store.logs.length === 0"
        class="text-center py-12"
      >
        <VIcon
          icon="tabler-history-off"
          size="48"
          color="disabled"
          class="mb-3"
        />
        <div class="text-body-1 text-disabled">
          Không có nhật ký nào
        </div>
      </div>

      <VTable
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
            <th style="width: 130px;">
              PHƯƠNG THỨC HTTP
            </th>
            <th style="width: 120px;">
              ĐỊA CHỈ IP
            </th>
            <th style="width: 160px;">
              THỜI GIAN TRUY CẬP
            </th>
            <th style="width: 80px;">
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
                  <span class="text-caption font-weight-bold">
                    {{ (log.user_name ?? 'G').slice(0, 2).toUpperCase() }}
                  </span>
                </VAvatar>
                <div>
                  <div class="text-body-2 font-weight-medium">
                    {{ log.user_name }}
                  </div>
                  <div class="text-caption text-disabled">
                    {{ log.user_type }}
                  </div>
                </div>
              </div>
            </td>
            <td class="text-body-2 text-medium-emphasis">
              {{ log.organization_id ?? '—' }}
            </td>
            <td>
              <div
                class="text-body-2 text-truncate"
                style="max-inline-size: 260px;"
              >
                {{ log.description }}
              </div>
              <div
                class="text-caption text-disabled text-truncate"
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
                class="text-caption font-weight-medium"
                :class="log.ip_address ? 'text-warning' : 'text-disabled'"
              >
                {{ log.ip_address ?? '—' }}
              </span>
            </td>
            <td class="text-body-2 text-medium-emphasis">
              {{ log.created_at }}
            </td>
            <td @click.stop>
              <div class="d-flex align-center gap-1">
                <IconBtn
                  size="small"
                  @click="openDetail(log)"
                >
                  <VIcon
                    icon="tabler-eye"
                    size="18"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Xem chi tiết
                  </VTooltip>
                </IconBtn>
                <IconBtn
                  size="small"
                  color="error"
                  @click="handleDelete(log)"
                >
                  <VIcon
                    icon="tabler-trash"
                    size="18"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Xóa
                  </VTooltip>
                </IconBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>

      <!-- Pagination -->
      <div
        v-if="store.logs.length > 0"
        class="d-flex align-center justify-space-between px-4 py-3 border-t"
      >
        <div class="d-flex align-center gap-3">
          <span class="text-body-2 text-medium-emphasis">Hiển thị:</span>
          <AppSelect
            v-model="limit"
            :items="limitOptions"
            density="compact"
            style="min-inline-size: 80px;"
            hide-details
            @update:model-value="onLimitChange"
          />
          <span class="text-body-2 text-medium-emphasis">
            Tổng: {{ store.total }} nhật ký
          </span>
        </div>

        <VPagination
          v-model="page"
          :length="totalPages"
          :total-visible="6"
          density="compact"
          @update:model-value="onPageChange"
        />
      </div>
    </VCard>

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
              <div class="text-caption text-disabled">
                Người dùng
              </div>
              <div class="text-body-2 font-weight-medium">
                {{ selectedLog.user_name }}
              </div>
            </VCol>
            <VCol cols="4">
              <div class="text-caption text-disabled">
                Loại người dùng
              </div>
              <div class="text-body-2">
                {{ selectedLog.user_type }}
              </div>
            </VCol>
            <VCol cols="4">
              <div class="text-caption text-disabled">
                Tổ chức
              </div>
              <div class="text-body-2">
                {{ selectedLog.organization_id ?? '—' }}
              </div>
            </VCol>

            <VCol cols="12">
              <VDivider class="my-3" />
            </VCol>

            <VCol cols="12">
              <div class="text-caption text-disabled">
                Mô tả
              </div>
              <div class="text-body-2">
                {{ selectedLog.description }}
              </div>
            </VCol>

            <VCol cols="12">
              <div class="text-caption text-disabled">
                Route
              </div>
              <div class="text-body-2 text-break">
                {{ selectedLog.route }}
              </div>
            </VCol>

            <VCol cols="3">
              <div class="text-caption text-disabled">
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
              <div class="text-caption text-disabled">
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
              <div class="text-caption text-disabled">
                Địa chỉ IP
              </div>
              <div class="text-body-2 font-weight-medium text-warning">
                {{ selectedLog.ip_address }}
              </div>
            </VCol>

            <VCol cols="3">
              <div class="text-caption text-disabled">
                Quốc gia
              </div>
              <div class="text-body-2">
                {{ selectedLog.country ?? '—' }}
              </div>
            </VCol>

            <VCol cols="12">
              <VDivider class="my-3" />
            </VCol>

            <VCol cols="12">
              <div class="text-caption text-disabled mb-1">
                User Agent
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ selectedLog.user_agent }}
              </div>
            </VCol>

            <VCol
              v-if="selectedLog.request_data"
              cols="12"
            >
              <div class="text-caption text-disabled mb-1">
                Request Data
              </div>
              <pre
                class="text-caption bg-surface-variant pa-3 rounded"
                style="overflow-x: auto; white-space: pre-wrap;"
              >{{ JSON.stringify(selectedLog.request_data, null, 2) }}</pre>
            </VCol>

            <VCol cols="12">
              <VDivider class="my-3" />
            </VCol>

            <VCol cols="6">
              <div class="text-caption text-disabled">
                Thời gian tạo
              </div>
              <div class="text-body-2">
                {{ selectedLog.created_at }}
              </div>
            </VCol>
            <VCol cols="6">
              <div class="text-caption text-disabled">
                Cập nhật lần cuối
              </div>
              <div class="text-body-2">
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
      max-width="440"
    >
      <VCard>
        <VCardTitle class="pt-6 px-6">
          Xóa nhật ký theo khoảng thời gian
        </VCardTitle>
        <VCardText class="px-6">
          <VRow dense>
            <VCol cols="6">
              <AppTextField
                v-model="deleteFromDate"
                label="Từ ngày"
                type="date"
              />
            </VCol>
            <VCol cols="6">
              <AppTextField
                v-model="deleteToDate"
                label="Đến ngày"
                type="date"
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
    <VDialog
      v-model="confirmDialog.show"
      max-width="440"
    >
      <VCard>
        <VCardTitle class="pt-6 px-6">
          {{ confirmDialog.title }}
        </VCardTitle>
        <VCardText class="px-6">
          {{ confirmDialog.message }}
        </VCardText>
        <VCardActions class="px-6 pb-6">
          <VSpacer />
          <VBtn
            variant="tonal"
            color="secondary"
            @click="confirmDialog.show = false"
          >
            Hủy
          </VBtn>
          <VBtn
            color="error"
            @click="() => { confirmDialog.onConfirm(); confirmDialog.show = false }"
          >
            Xác nhận
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top end"
      :timeout="3000"
    >
      {{ snackbar.message }}
      <template #actions>
        <VBtn
          variant="text"
          @click="snackbar.show = false"
        >
          Đóng
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>
