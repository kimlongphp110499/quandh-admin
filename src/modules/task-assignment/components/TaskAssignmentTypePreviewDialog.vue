<!-- Modal xem nhanh thông tin loại văn bản — tái sử dụng được ở mọi trang -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { typeApi } from '../services/typeApi'
import type { Type } from '../services/typeApi'
import { useTypeStore } from '../stores/useTypeStore'

interface Props {
  typeId: number | null
  isDialogVisible: boolean
}

interface Emit {
  (e: 'update:isDialogVisible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const router = useRouter()
const typeStore = useTypeStore()
const type = ref<Type | null>(null)
const isLoading = ref(false)

const close = () => emit('update:isDialogVisible', false)

const goToEditPage = () => {
  if (!props.typeId) return
  typeStore.pendingEditId = props.typeId
  close()
  router.push({ path: '/task-assignment/types' })
}

watch(
  () => [props.isDialogVisible, props.typeId],
  async ([visible, id]) => {
    if (!visible || !id) { type.value = null; return }
    isLoading.value = true
    try {
      const res = await typeApi.show(id as number)
      if (res.data.success)
        type.value = res.data.data ?? null
    }
    finally { isLoading.value = false }
  },
  { immediate: true },
)
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    :width="$vuetify.display.smAndDown ? 'auto' : 520"
    @update:model-value="val => emit('update:isDialogVisible', val)"
  >
    <DialogCloseBtn @click="close" />

    <VCard class="pa-sm-6 pa-4">
      <!-- Tiêu đề -->
      <VCardItem class="pb-2">
        <VCardTitle>Loại văn bản</VCardTitle>
      </VCardItem>

      <VDivider class="mb-4" />

      <!-- Loading -->
      <VCardText v-if="isLoading" class="d-flex justify-center py-8">
        <VProgressCircular indeterminate color="primary" />
      </VCardText>

      <!-- Nội dung -->
      <VCardText v-else-if="type">
        <VList lines="two" density="compact">
          <VListItem>
            <template #prepend>
              <VIcon icon="tabler-forms" size="18" class="me-2 text-medium-emphasis" />
            </template>
            <VListItemTitle class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-1">
              Tên loại văn bản
            </VListItemTitle>
            <VListItemSubtitle class="text-body-1 font-weight-medium text-high-emphasis">
              {{ type.name }}
            </VListItemSubtitle>
          </VListItem>

          <VListItem v-if="type.description">
            <template #prepend>
              <VIcon icon="tabler-align-left" size="18" class="me-2 text-medium-emphasis" />
            </template>
            <VListItemTitle class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-1">
              Mô tả
            </VListItemTitle>
            <VListItemSubtitle class="text-body-2 text-high-emphasis" style="white-space: pre-wrap;">
              {{ type.description }}
            </VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VIcon icon="tabler-circle-check" size="18" class="me-2 text-medium-emphasis" />
            </template>
            <VListItemTitle class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-1">
              Trạng thái
            </VListItemTitle>
            <VListItemSubtitle>
              <VChip
                :color="type.status === 'active' ? 'success' : 'default'"
                size="small"
                variant="tonal"
              >
                {{ type.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động' }}
              </VChip>
            </VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VIcon icon="tabler-user" size="18" class="me-2 text-medium-emphasis" />
            </template>
            <VListItemTitle class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-1">
              Người tạo
            </VListItemTitle>
            <VListItemSubtitle class="text-body-2 text-high-emphasis">
              {{ type.created_by }}
            </VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VIcon icon="tabler-clock" size="18" class="me-2 text-medium-emphasis" />
            </template>
            <VListItemTitle class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-1">
              Ngày tạo
            </VListItemTitle>
            <VListItemSubtitle class="text-body-2 text-high-emphasis">
              {{ type.created_at }}
            </VListItemSubtitle>
          </VListItem>
        </VList>
      </VCardText>

      <!-- Actions -->
      <VCardActions v-if="type" class="px-6 pb-4 pt-2 d-flex justify-end gap-3">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-x"
          @click="close"
        >
          Đóng
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="tabler-edit"
          @click="goToEditPage"
        >
          Chỉnh sửa
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
