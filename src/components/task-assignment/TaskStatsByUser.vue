<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { taskAssignmentItemApi, type StatsByUserItem } from '@/api/modules/task-assignment-item'

// ── Tab ───────────────────────────────────────────────────────────────────
const currentTab = ref<'overdue' | 'done'>('overdue')

const tabs = [
  { value: 'overdue', label: 'Quá hạn nhiều nhất', color: 'error' },
  { value: 'done',    label: 'Hoàn thành nhiều nhất', color: 'success' },
] as const

// ── Dữ liệu ───────────────────────────────────────────────────────────────
const loading = ref(false)
const rawData = ref<StatsByUserItem[]>([])

async function fetchData() {
  loading.value = true
  try {
    const res = await taskAssignmentItemApi.statsByUser()
    rawData.value = res.data?.data ?? []
  }
  finally { loading.value = false }
}

onMounted(fetchData)

// ── Sắp xếp theo tab ──────────────────────────────────────────────────────
const sortedData = computed(() =>
  [...rawData.value]
    .filter(r => r.total > 0)
    .sort((a, b) => b[currentTab.value] - a[currentTab.value])
    .slice(0, 8),
)

const totalUsers = computed(() => rawData.value.length)
const totalTasks = computed(() => rawData.value.reduce((s, r) => s + r.total, 0))

function doneRate(row: StatsByUserItem) {
  if (!row.total) return 0
  return Math.round((row.done / row.total) * 100)
}

function overdueRate(row: StatsByUserItem) {
  if (!row.total) return 0
  return Math.round((row.overdue / row.total) * 100)
}

function tabColor(val: typeof currentTab.value) {
  return tabs.find(t => t.value === val)?.color ?? 'primary'
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
}

// Màu avatar theo index để phân biệt người dùng
const avatarColors = ['primary', 'info', 'success', 'warning', 'error', 'secondary']
function avatarColor(idx: number) {
  return avatarColors[idx % avatarColors.length]
}
</script>

<template>
  <VCard>
    <VCardItem title="Thống kê theo cá nhân">
      <template #subtitle>
        {{ totalUsers }} người · {{ totalTasks }} công việc
      </template>
    </VCardItem>

    <!-- Tab toggle -->
    <div class="px-4 pb-2">
      <VBtnToggle
        v-model="currentTab"
        density="compact"
        rounded="lg"
        divided
      >
        <VBtn
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
          size="small"
          :color="currentTab === tab.value ? tab.color : undefined"
        >
          {{ tab.label }}
        </VBtn>
      </VBtnToggle>
    </div>

    <VCardText class="pt-1">
      <VProgressLinear v-if="loading" indeterminate color="primary" class="mb-3" />

      <div v-else-if="sortedData.length === 0" class="text-center text-disabled py-6">
        Không có dữ liệu
      </div>

      <VList v-else class="card-list pa-0">
        <VListItem
          v-for="(row, idx) in sortedData"
          :key="row.user_id"
          class="px-0"
        >
          <!-- Avatar chữ cái -->
          <template #prepend>
            <VAvatar
              :color="avatarColor(idx)"
              variant="tonal"
              size="36"
              class="me-2 text-caption font-weight-bold"
            >
              {{ initials(row.user_name) }}
            </VAvatar>
          </template>

          <!-- Tên + tỷ lệ progress -->
          <VListItemTitle class="text-body-2 font-weight-medium mb-1">
            {{ row.user_name }}
          </VListItemTitle>
          <VListItemSubtitle>
            <div class="d-flex align-center gap-x-2">
              <!-- Tỷ lệ hoàn thành đúng hạn -->
              <VProgressLinear
                :model-value="doneRate(row)"
                color="success"
                rounded
                height="5"
                style="max-width: 70px"
              />
              <span class="text-caption text-success">{{ doneRate(row) }}% đúng hạn</span>
              <span
                v-if="overdueRate(row) >= 30"
                class="text-caption text-error d-flex align-center gap-1"
              >
                <VIcon icon="tabler-alert-triangle" size="12" />
                Rủi ro
              </span>
            </div>
          </VListItemSubtitle>

          <!-- Số liệu -->
          <template #append>
            <div class="text-end">
              <div
                class="text-body-1 font-weight-bold"
                :class="currentTab === 'overdue' ? 'text-error' : 'text-success'"
              >
                {{ currentTab === 'overdue' ? row.overdue : row.done }}
              </div>
              <div class="text-caption text-disabled">
                / {{ row.total }} việc
              </div>
            </div>
          </template>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 1rem;
}
</style>
