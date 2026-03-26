<script setup lang="ts">
import { useMeetingStore } from '@/store/modules/meeting'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const meetingStore = useMeetingStore()
const router = useRouter()

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Tiêu đề', key: 'title' },
  { title: 'Địa điểm', key: 'location' },
  { title: 'Thời gian bắt đầu', key: 'start_at' },
  { title: 'Trạng thái', key: 'status' },
  { title: 'Hành động', key: 'actions', sortable: false },
]

const statusColors: Record<string, string> = {
  draft: 'secondary',
  active: 'info',
  in_progress: 'warning',
  ended: 'success',
}

const statusLabels: Record<string, string> = {
  draft: 'Bản nháp',
  active: 'Đã kích hoạt',
  in_progress: 'Đang diễn ra',
  ended: 'Đã kết thúc',
}

onMounted(async () => {
  await meetingStore.fetchMeetings()
})

const viewMeeting = (id: number) => {
  router.push(`/meetings/${id}`)
}

const editMeeting = (id: number) => {
  router.push(`/meetings/${id}/edit`)
}

const deleteMeeting = async (id: number) => {
  if (confirm('Bạn có chắc chắn muốn xóa cuộc họp này?')) {
    try {
      await meetingStore.deleteMeeting(id)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <VRow>
      <VCol cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h2 class="text-h4 mb-1">
              Quản lý cuộc họp
            </h2>
            <p class="text-body-1 text-medium-emphasis">
              Danh sách cuộc họp và lịch trình
            </p>
          </div>
          <VBtn
            color="primary"
            prepend-icon="tabler-plus"
            @click="router.push('/meetings/create')"
          >
            Tạo cuộc họp mới
          </VBtn>
        </div>
      </VCol>
    </VRow>

    <!-- Filters & Search -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="meetingStore.filters.search"
              placeholder="Tìm kiếm cuộc họp..."
              prepend-inner-icon="tabler-search"
              clearable
              @input="meetingStore.fetchMeetings()"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="meetingStore.filters.status"
              :items="[
                { title: 'Tất cả trạng thái', value: '' },
                { title: 'Bản nháp', value: 'draft' },
                { title: 'Đã kích hoạt', value: 'active' },
                { title: 'Đang diễn ra', value: 'in_progress' },
                { title: 'Đã kết thúc', value: 'ended' },
              ]"
              label="Trạng thái"
              clearable
              @update:model-value="meetingStore.fetchMeetings()"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="meetingStore.filters.from_date"
              type="date"
              label="Từ ngày"
              @input="meetingStore.fetchMeetings()"
            />
          </VCol>
          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="meetingStore.filters.to_date"
              type="date"
              label="Đến ngày"
              @input="meetingStore.fetchMeetings()"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Data Table -->
    <VCard>
      <VDataTable
        :headers="headers"
        :items="meetingStore.meetings"
        :loading="meetingStore.isLoading"
        :items-per-page="meetingStore.filters.limit"
        class="text-no-wrap"
      >
        <!-- Status Column -->
        <template #item.status="{ item }">
          <VChip
            :color="statusColors[item.status]"
            size="small"
          >
            {{ statusLabels[item.status] }}
          </VChip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <VBtn
            icon
            variant="text"
            size="small"
            @click="viewMeeting(item.id)"
          >
            <VIcon icon="tabler-eye" />
          </VBtn>
          <VBtn
            icon
            variant="text"
            size="small"
            @click="editMeeting(item.id)"
          >
            <VIcon icon="tabler-edit" />
          </VBtn>
          <VBtn
            icon
            variant="text"
            size="small"
            color="error"
            @click="deleteMeeting(item.id)"
          >
            <VIcon icon="tabler-trash" />
          </VBtn>
        </template>

        <!-- Loading State -->
        <template #loading>
          <VProgressLinear
            indeterminate
            color="primary"
          />
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-10">
            <VIcon
              icon="tabler-folder-off"
              size="48"
              class="mb-4 text-disabled"
            />
            <p class="text-body-1 text-medium-emphasis">
              Chưa có cuộc họp nào
            </p>
          </div>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
