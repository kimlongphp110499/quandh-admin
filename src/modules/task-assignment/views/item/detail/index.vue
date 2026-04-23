<!-- eslint-disable import/no-unresolved -->
<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ItemFormDrawer from '../../../components/item/ItemFormDrawer.vue'
import ItemReportHistoryList from '../../../components/item/ItemReportHistoryList.vue'
import ItemProgressHistoryList from '../../../components/shared/ItemProgressHistoryList.vue'
import ItemAbout from '../../../components/item/About.vue'
import { itemApi } from '../../../services/itemApi'
import type { Item, ItemProgressHistory, ItemReport, ItemStatus } from '../../../services/itemApi'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppSnackbar from '@/components/AppSnackbar.vue'
import { getErrorMessage } from '@/utils/errorMessage'

const route = useRoute()
const router = useRouter()
const itemId = computed(() => Number(route.params.id))

// ── Snackbar ──────────────────────────────────────────────────────
const snackbar = ref({ show: false, message: '', color: 'success' })

const showToast = (message: string, color: 'success' | 'error') => {
  snackbar.value = { show: true, message, color }
}

// ── Confirm dialog ────────────────────────────────────────────────
const confirmDialog = ref<{ show: boolean; title: string; message: string; onConfirm: () => void }>({ show: false, title: '', message: '', onConfirm: () => {} })

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  confirmDialog.value = { show: true, title, message, onConfirm }
}

// ── Tab ───────────────────────────────────────────────────────────
const activeTab = ref(0)

const tabs = [
  { icon: 'tabler-report', title: 'Lịch sử báo cáo' },
  { icon: 'tabler-report', title: 'Lịch sử cập nhật' },
  { icon: 'tabler-history', title: ' Dòng thời gian' },
]

// ── Item data ─────────────────────────────────────────────────────
const currentItem = ref<Item | null>(null)
const isLoading = ref(false)

const fetchItem = async () => {
  isLoading.value = true
  try {
    const res = await itemApi.show(itemId.value)
    if (res.data.success)
      currentItem.value = res.data.data || null
  }
  catch {
    showToast('Không tải được thông tin công việc.', 'error')
  }
  finally { isLoading.value = false }
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr)
    return '—'
  const normalized = dateStr.replace(' ', 'T')
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime()))
    return dateStr

  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Resolvers ─────────────────────────────────────────────────────
const resolveStatusColor = (s: string) =>
  ({ todo: 'default', in_progress: 'info', done: 'success', overdue: 'error', paused: 'warning', cancelled: 'secondary' }[s] || 'default')

const resolveStatusLabel = (s: string) =>
  ({ todo: 'Chưa bắt đầu', in_progress: 'Đang thực hiện', done: 'Hoàn thành', overdue: 'Quá hạn', paused: 'Tạm dừng', cancelled: 'Đã hủy' }[s] || s)

const resolvePriorityColor = (p: string) =>
  ({ low: 'default', medium: 'info', high: 'warning', urgent: 'error' }[p] || 'default')

const resolvePriorityLabel = (p: string) =>
  ({ low: 'Thấp', medium: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' }[p] || p)

// ── Edit drawer ───────────────────────────────────────────────────
const isEditDrawerOpen = ref(false)

const openEditDrawer = () => {
  isEditDrawerOpen.value = true
}

const handleEditSubmit = async () => {
  isEditDrawerOpen.value = false
  await fetchItem()
}

// ── Cập nhật tiến độ ──────────────────────────────────────────────
const isUpdatingProgress = ref(false)
const progressForm = ref({ processing_status: '' as ItemStatus | '', completion_percent: 0, note: '' })

const initProgressForm = () => {
  progressForm.value = {
    processing_status: currentItem.value?.processing_status || 'todo',
    completion_percent: currentItem.value?.completion_percent || 0,
    note: '',
  }
}

const saveProgress = async () => {
  if (!currentItem.value)
    return
  isUpdatingProgress.value = true
  try {
    const res = await itemApi.updateProgress(itemId.value, {
      processing_status: progressForm.value.processing_status as ItemStatus || undefined,
      completion_percent: progressForm.value.completion_percent,
      note: progressForm.value.note || undefined,
    })

    if (res.data.success) {
      currentItem.value = res.data.data || currentItem.value
      initProgressForm()
      showToast('Cập nhật tiến độ thành công!', 'success')
      await fetchProgressHistory()
    }
  }
  catch (err: any) {
    showToast(getErrorMessage(err, 'Cập nhật tiến độ thất bại!'), 'error')
  }
  finally { isUpdatingProgress.value = false }
}

const statusOptions = [
  { title: 'Chưa bắt đầu', value: 'todo' },
  { title: 'Đang thực hiện', value: 'in_progress' },
  { title: 'Hoàn thành', value: 'done' },
  { title: 'Tạm dừng', value: 'paused' },
  { title: 'Đã hủy', value: 'cancelled' },
]

// ── Lịch sử cập nhật tiến độ ─────────────────────────────────────
const progressHistory = ref<ItemProgressHistory[]>([])
const historyLoading = ref(false)

const fetchProgressHistory = async () => {
  historyLoading.value = true
  try {
    const res = await itemApi.getProgressHistory(itemId.value)
    if (res.data.success)
      progressHistory.value = res.data.data || []
  }
  catch { /* silent */ }
  finally { historyLoading.value = false }
}

// ── Báo cáo ───────────────────────────────────────────────────────
const reports = ref<ItemReport[]>([])
const isReportsLoading = ref(false)

const fetchReports = async () => {
  isReportsLoading.value = true
  try {
    const res = await itemApi.getReports(itemId.value)
    if (res.data.success)
      reports.value = res.data.data || []
  }
  catch { /* silent */ }
  finally { isReportsLoading.value = false }
}

// ── Timeline lịch sử ─────────────────────────────────────────────
const timelineItems = computed(() => {
  const item = currentItem.value
  if (!item)
    return []

  const result = []

  if (item.created_by) {
    result.push({
      color: 'primary',
      title: 'Tạo công việc',
      time: formatDate(item.created_at),
      desc: `Công việc được tạo bởi ${item.created_by}`,
    })
  }

  if (item.updated_by && item.updated_at !== item.created_at) {
    result.push({
      color: 'info',
      title: 'Cập nhật công việc',
      time: formatDate(item.updated_at),
      desc: `Cập nhật lần cuối bởi ${item.updated_by}`,
    })
  }

  if (item.processing_status === 'done' && item.completed_at) {
    result.push({
      color: 'success',
      title: 'Hoàn thành',
      time: formatDate(item.completed_at),
      desc: 'Công việc đã được đánh dấu hoàn thành',
    })
  }

  return result
})

onMounted(async () => {
  await fetchItem()
  await fetchReports()
  await fetchProgressHistory()
  initProgressForm()
})
</script>

<template>
  <div>
    <!-- ── Skeleton ────────────────────────────────────────────── -->
    <template v-if="isLoading">
      <VSkeletonLoader
        type="card"
        class="mb-4"
      />
    </template>

    <template v-else-if="currentItem">
      <VRow>
        <!-- ── Cột trái: Panel thông tin ──────────────────────── -->
        <VCol
          cols="12"
          md="4"
        >
          <!-- Thông tin công việc -->
          <ItemAbout
            :item="currentItem"
            class="mb-6"
          />

          <!-- Phòng ban thực hiện -->
          <VCard class="mb-6">
            <VCardText>
              <h5 class="text-h5 mb-4">
                Phòng ban thực hiện
              </h5>
              <VDivider class="mb-2" />
              <VList class="card-list">
                <VListItem
                  v-for="dept in currentItem.departments"
                  :key="dept.id"
                >
                  <VListItemTitle class="text-body-1 font-weight-medium">
                    {{ dept.name }}
                  </VListItemTitle>
                  <VListItemSubtitle>
                    <VChip
                      :color="dept.role === 'main' ? 'primary' : 'secondary'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ dept.role === 'main' ? 'Chủ trì' : 'Phối hợp' }}
                    </VChip>
                  </VListItemSubtitle>
                </VListItem>
                <div
                  v-if="!currentItem.departments?.length"
                  class="text-body-2 text-disabled px-4 py-2"
                >
                  Chưa có phòng ban nào
                </div>
              </VList>
            </VCardText>
          </VCard>

          <!-- Người thực hiện -->
          <VCard class="mb-6">
            <VCardText>
              <h5 class="text-h5 mb-4">
                Người thực hiện
              </h5>
              <VDivider class="mb-2" />
              <VList class="card-list">
                <VListItem
                  v-for="u in currentItem.users"
                  :key="u.id"
                >
                  <template #prepend />
                  <VListItemTitle class="text-body-1 font-weight-medium">
                    {{ u.name }}
                  </VListItemTitle>
                  <VListItemSubtitle>
                    <VChip
                      :color="u.assignment_role === 'main' ? 'primary' : 'secondary'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ u.assignment_role === 'main' ? 'Chủ trì' : 'Phối hợp' }}
                    </VChip>
                  </VListItemSubtitle>
                </VListItem>
                <div
                  v-if="!currentItem.users?.length"
                  class="text-body-2 text-disabled px-4 py-2"
                >
                  Chưa có người thực hiện nào
                </div>
              </VList>
            </VCardText>
          </VCard>

          <!-- Action nhanh -->
          <!--
            <VCard class="mb-6">
            <VCardItem>
            <VCardTitle class="d-flex align-center gap-2">
            <VIcon icon="tabler-bolt" size="20" />
            Hành động
            </VCardTitle>
            </VCardItem>
            <VCardText class="d-flex flex-column gap-2">
            <VBtn
            block
            prepend-icon="tabler-edit"
            @click="openEditDrawer"
            >
            Chỉnh sửa
            </VBtn>
            <VBtn
            block
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-arrow-left"
            @click="router.back()"
            >
            Quay lại
            </VBtn>
            <VBtn
            v-if="currentItem.document"
            block
            variant="tonal"
            color="info"
            prepend-icon="tabler-file-text"
            :to="{ name: 'task-assignment-documents-id', params: { id: currentItem.document.id } }"
            >
            Xem văn bản
            </VBtn>
            </VCardText>
            </VCard>
          -->
        </VCol>

        <!-- ── Cột phải: Tabs ──────────────────────────────────── -->
        <VCol
          cols="12"
          md="8"
        >
          <!-- Tabs -->
          <VTabs
            v-model="activeTab"
            class="v-tabs-pill mb-6"
          >
            <VTab
              v-for="tab in tabs"
              :key="tab.icon"
            >
              <VIcon
                :size="18"
                :icon="tab.icon"
                class="me-1"
              />
              <span>{{ tab.title }}</span>
            </VTab>
          </VTabs>

          <VWindow
            v-model="activeTab"
            class="disable-tab-transition"
            :touch="false"
          >
            <!-- Tab 1: Báo cáo -->
            <VWindowItem>
              <!--
                <VCard class="mb-6">
                <VCardItem>
                <VCardTitle>Tạo báo cáo mới</VCardTitle>
                </VCardItem>
                <VCardText>
                <VRow>
                <VCol
                cols="12"
                md="6"
                >
                <AppTextField
                v-model="reportForm.report_document_number"
                label="Số văn bản báo cáo"
                placeholder="VD: 01/BC-..."
                />
                </VCol>
                <VCol
                cols="12"
                md="6"
                >
                <AppDateTimePicker
                v-model="reportForm.completed_at"
                label="Ngày hoàn thành"
                :config="{ dateFormat: 'd/m/Y' }"
                placeholder="dd/mm/yyyy"
                />
                </VCol>
                <VCol cols="12">
                <AppTextField
                v-model="reportForm.report_document_excerpt"
                label="Trích yếu"
                placeholder="Nhập trích yếu báo cáo..."
                />
                </VCol>
                <VCol cols="12">
                <AppTextField
                v-model="reportForm.report_document_content"
                label="Nội dung báo cáo"
                placeholder="Nhập nội dung báo cáo..."
                />
                </VCol>
                <VCol cols="12">
                <input
                ref="reportFileInputRef"
                type="file"
                multiple
                style="display: none;"
                @change="onReportFileSelected"
                >
                <VBtn
                variant="tonal"
                color="secondary"
                prepend-icon="tabler-paperclip"
                class="me-3"
                @click="openReportFilePicker"
                >
                Đính kèm file
                </VBtn>
                <span
                v-if="reportPendingFiles.length"
                class="text-caption text-medium-emphasis"
                >
                {{ reportPendingFiles.length }} file đã chọn
                </span>
                </VCol>
                <VCol
                v-if="reportPendingFiles.length"
                cols="12"
                >
                <VList density="compact">
                <VListItem
                v-for="(file, idx) in reportPendingFiles"
                :key="idx"
                >
                <template #prepend>
                <VIcon
                :icon="getFileIcon(file.type, file.name)"
                size="18"
                color="secondary"
                />
                </template>
                <VListItemTitle class="text-body-2">
                {{ file.name }}
                </VListItemTitle>
                <VListItemSubtitle class="text-caption">
                {{ formatFileSize(file.size) }}
                </VListItemSubtitle>
                <template #append>
                <IconBtn
                size="small"
                color="error"
                @click="removeReportPendingFile(idx)"
                >
                <VIcon icon="tabler-x" />
                </IconBtn>
                </template>
                </VListItem>
                </VList>
                </VCol>
                <VCol cols="12">
                <VBtn
                :loading="isCreatingReport"
                prepend-icon="tabler-send"
                @click="submitReport"
                >
                Gửi báo cáo
                </VBtn>
                </VCol>
                </VRow>
                </VCardText>
                </VCard>
              -->

              <!-- Danh sách báo cáo -->
              <ItemReportHistoryList
                :reports="reports"
                :is-loading="isReportsLoading"
                :can-edit="false"
              />
            </VWindowItem>
            <!-- Tab 3:  Lịch sử cập nhật tiến độ -->
            <VWindowItem>
              <ItemProgressHistoryList
                :entries="progressHistory"
                :is-loading="historyLoading"
              />
            </VWindowItem>

            <!-- Tab 3:  Lịch sử -->
            <VWindowItem>
              <VCard>
                <VCardItem>
                  <VCardTitle>Lịch sử hoạt động</VCardTitle>
                </VCardItem>
                <VCardText>
                  <div
                    v-if="!timelineItems.length"
                    class="text-center py-8 text-disabled"
                  >
                    <VIcon
                      icon="tabler-history-off"
                      size="48"
                      class="mb-3 d-block mx-auto"
                    />
                    <div class="text-body-2">
                      Chưa có lịch sử hoạt động
                    </div>
                  </div>
                  <VTimeline
                    v-else
                    side="end"
                    align="start"
                    line-inset="8"
                    truncate-line="start"
                    density="compact"
                  >
                    <VTimelineItem
                      v-for="t in timelineItems"
                      :key="t.title"
                      :dot-color="t.color"
                      size="x-small"
                    >
                      <div class="d-flex justify-space-between align-center gap-2 flex-wrap mb-2">
                        <span class="app-timeline-title">{{ t.title }}</span>
                        <span class="app-timeline-meta">{{ t.time }}</span>
                      </div>
                      <div class="app-timeline-text mt-1">
                        {{ t.desc }}
                      </div>
                    </VTimelineItem>
                  </VTimeline>
                </VCardText>
              </VCard>
            </VWindowItem>
          </VWindow>
        </VCol>
      </VRow>
    </template>

    <!-- ── Không tìm thấy ──────────────────────────────────────── -->
    <VCard
      v-else-if="!isLoading"
      class="text-center pa-12"
    >
      <VIcon
        icon="tabler-checklist"
        size="64"
        color="disabled"
        class="mb-4"
      />
      <div class="text-h6 text-medium-emphasis mb-2">
        Không tìm thấy công việc
      </div>
      <VBtn
        variant="tonal"
        @click="router.push({ name: 'task-assignment-items' })"
      >
        Quay lại danh sách
      </VBtn>
    </VCard>

    <!-- ── Edit Drawer ────────────────────────────────────────── -->
    <ItemFormDrawer
      v-model:is-drawer-open="isEditDrawerOpen"
      :item="currentItem as any"
      @submit="handleEditSubmit"
    />

    <!-- ── Confirm Dialog ─────────────────────────────────────── -->
    <AppConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      @confirm="() => { confirmDialog.onConfirm(); confirmDialog.show = false }"
    />

    <!-- ── Snackbar ───────────────────────────────────────────── -->
    <AppSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </div>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.75rem;
}
</style>
