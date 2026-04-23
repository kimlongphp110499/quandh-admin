<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MyTaskItem, MyTaskProgressHistory, MyTaskStatus } from '../../services/myTaskItemApi'
import { useMyTaskAssignmentItemStore } from '../../stores/useMyTaskAssignmentItemStore'
import ItemProgressHistoryList from '../shared/ItemProgressHistoryList.vue'
import { getErrorMessage } from '@/utils/errorMessage'

interface Props {
  modelValue: boolean
  item: MyTaskItem | null
}

interface Emits {
  (e: 'update:modelValue', val: boolean): void
  (e: 'toast', message: string, color: 'success' | 'error'): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useMyTaskAssignmentItemStore()

const progressStatus = ref<MyTaskStatus | ''>('')
const progressPercent = ref(0)
const progressNote = ref('')
const progressLoading = ref(false)
const reportTab = ref('form')
const progressHistory = ref<MyTaskProgressHistory[]>([])
const historyLoading = ref(false)

watch(() => props.modelValue, async (val) => {
  if (val && props.item) {
    progressStatus.value = props.item.processing_status
    progressPercent.value = props.item.completion_percent
    progressNote.value = props.item.my_assignment?.note || ''
    historyLoading.value = true
    progressHistory.value = await store.getProgressHistory(props.item.id)
    historyLoading.value = false
  }
})

watch(progressStatus, val => {
  if (val === 'done')
    progressPercent.value = 100
})

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
      processing_status: progressStatus.value as Exclude<MyTaskStatus, 'overdue'> || undefined,
      completion_percent: progressPercent.value,
      note: progressNote.value || undefined,
    })
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

<!-- copy from /var/www/html/code/quandh-admin/src/components/dialogs/AddEditAddressDialog.vue-->
<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <!-- 👉 Dialog close btn -->
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
          v-model="reportTab"
          class="mb-6"
        >
          <VTab value="form">
            Cập nhật
          </VTab>
          <VTab value="history">
            Lịch sử cập nhật
          </VTab>
        </VTabs>

        <VTabsWindow v-model="reportTab">
          <VTabsWindowItem value="form">
            <!-- 👉 Form -->
            <VForm @submit.prevent="submitProgress">
              <VRow>
                <VCol cols="12">
                  <AppTextField
                    v-model="progressPercent"
                    label="% Hoàn thành"
                    placeholder=""
                  />
                </VCol>

                <VCol cols="12">
                  <AppTextarea
                    v-model="progressNote"
                    label="Ghi chú tiến độ"
                    placeholder="Mô tả tiến độ hiện tại"
                    rows="3"
                    hide-details
                  />
                </VCol>

                <!-- 👉 Submit and Cancel button -->
                <VCol
                  cols="12"
                  class="text-center"
                >
                  <VBtn
                    type="submit"
                    class="me-3"
                  >
                    Lưu
                  </VBtn>

                  <VBtn
                    variant="tonal"
                    color="secondary"
                    @click="emit('update:modelValue', false)"
                  >
                    Huỷ
                  </VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VTabsWindowItem>

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
