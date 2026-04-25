<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import type { Item, ItemPriority, ItemProgressHistory, ItemStatus } from '../../services/itemApi'
import { itemApi } from '../../services/itemApi'
import { useItemStore } from '../../stores/useItemStore'
import { ITEM_PRIORITY_OPTIONS, ITEM_STATUS_OPTIONS } from '../../configs/itemOptions'
import ItemProgressHistoryList from '../shared/ItemProgressHistoryList.vue'
import { getErrorMessage } from '@/utils/errorMessage'

interface Props {
  modelValue: boolean
  item: Item | null
}

interface Emits {
  (e: 'update:modelValue', val: boolean): void
  (e: 'toast', message: string, color: 'success' | 'error'): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useItemStore()

const progressStatus = ref<ItemStatus | ''>('')
const progressPercent = ref(0)
const progressPriority = ref<ItemPriority | ''>('')
const completedAt = ref<string>('')
const progressNote = ref('')
const progressLoading = ref(false)
const activeTab = ref('form')
const progressHistory = ref<ItemProgressHistory[]>([])
const historyLoading = ref(false)

// Loại bỏ giá trị 'Tất cả' khỏi danh sách priority trong form cập nhật
const priorityOptions = ITEM_PRIORITY_OPTIONS.filter(o => o.value !== '')

// Khởi tạo form khi dialog mở
watch(() => props.modelValue, async val => {
  if (val && props.item) {
    progressStatus.value = props.item.processing_status
    progressPercent.value = props.item.completion_percent
    progressPriority.value = props.item.priority ?? ''
    completedAt.value = props.item.completed_at
      ? dayjs(props.item.completed_at, ['DD/MM/YYYY HH:mm:ss ', 'HH:mm:ss DD/MM/YYYY']).format('DD/MM/YYYY HH:mm:ss')
      : ''
    progressNote.value = ''
    activeTab.value = 'form'

    historyLoading.value = true
    try {
      const res = await itemApi.getProgressHistory(props.item.id)

      progressHistory.value = res.data.data || []
    }
    catch { progressHistory.value = [] }
    finally { historyLoading.value = false }
  }
})

// Đồng bộ: done → 100%
watch(progressStatus, (val, oldVal) => {
  if (val === 'done')
    progressPercent.value = 100
  else if (oldVal === 'done')
    completedAt.value = ''
})

// Đồng bộ: 100% → tự chuyển done
watch(progressPercent, val => {
  if (val === 100 && progressStatus.value !== 'done')
    progressStatus.value = 'done'
})

const submitProgress = async () => {
  if (!props.item)
    return
  progressLoading.value = true
  try {
    await store.updateProgress(props.item.id, {
      processing_status: progressStatus.value as ItemStatus || undefined,
      completion_percent: progressPercent.value,
      priority: progressPriority.value as ItemPriority || undefined,
      note: progressNote.value || undefined,
    } as any)
    emit('toast', 'Cập nhật tiến độ thành công!', 'success')
    emit('update:modelValue', false)
    emit('saved')
  }
  catch (err: any) {
    emit('toast', getErrorMessage(err, 'Cập nhật tiến độ thất bại!'), 'error')
  }
  finally {
    progressLoading.value = false
  }
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 720"
    :model-value="props.modelValue"
    scrollable
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <DialogCloseBtn @click="emit('update:modelValue', false)" />

    <VCard
      v-if="props.item"
      class="pa-sm-10 pa-2"
    >
      <VCardText>
        <h4 class="text-h4 text-center mb-2">
          Cập nhật tiến độ
        </h4>
        <p class="text-body-1 text-center text-medium-emphasis mb-6">
          {{ props.item.name }}
        </p>

        <VTabs
          v-model="activeTab"
          class="mb-6"
        >
          <VTab value="form">
            Cập nhật
          </VTab>
          <VTab value="history">
            Lịch sử cập nhật
          </VTab>
        </VTabs>

        <VTabsWindow v-model="activeTab">
          <!-- ── Form Tab ───────────────────────────────────── -->
          <VTabsWindowItem value="form">
            <VForm @submit.prevent="submitProgress">
              <VRow>
                <!-- Trạng thái xử lý -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppSelect
                    v-model="progressStatus"
                    :items="ITEM_STATUS_OPTIONS"
                    label="Trạng thái"
                    hide-details
                  />
                </VCol>

                <!-- Mức độ ưu tiên -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppSelect
                    v-model="progressPriority"
                    :items="priorityOptions"
                    label="Mức độ ưu tiên"
                    clearable
                    hide-details
                  />
                </VCol>
                <!-- % Hoàn thành -->
                <VCol
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    v-model="progressPercent"
                    label="% Hoàn thành"
                    placeholder=""
                  />
                </VCol>
                <!-- Ngày hoàn thành: readonly nếu backend đã set, hiện khi done -->
                <VCol
                  v-if="progressStatus === 'done' && completedAt"
                  cols="12"
                  sm="6"
                >
                  <AppTextField
                    :model-value="completedAt"
                    label="Ngày hoàn thành"
                    readonly
                    hide-details
                    prepend-inner-icon="tabler-calendar-check"
                  />
                </VCol>

                <!-- Ghi chú -->
                <VCol cols="12">
                  <AppTextarea
                    v-model="progressNote"
                    label="Ghi chú tiến độ"
                    placeholder="Mô tả tiến độ hiện tại..."
                    rows="3"
                    hide-details
                  />
                </VCol>

                <!-- Nút hành động -->
                <VCol
                  cols="12"
                  class="text-center mt-2"
                >
                  <VBtn
                    type="submit"
                    color="primary"
                    class="me-3"
                    :loading="progressLoading"
                  >
                    Lưu
                  </VBtn>
                  <VBtn
                    variant="tonal"
                    color="secondary"
                    :disabled="progressLoading"
                    @click="emit('update:modelValue', false)"
                  >
                    Huỷ
                  </VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VTabsWindowItem>

          <!-- ── History Tab ────────────────────────────────── -->
          <VTabsWindowItem value="history">
            <ItemProgressHistoryList
              :entries="progressHistory"
              :is-loading="historyLoading"
            />
          </VTabsWindowItem>
        </VTabsWindow>
      </VCardText>
    </VCard>
  </VDialog>
</template>
