<script setup lang="ts">
import { itemApi } from '../../services/itemApi'
import type { StatsByDepartmentItem, StatsByUserItem, Item } from '../../services/itemApi'
import LogisticsOverviewTable from '../../components/dashboard/LogisticsOverviewTable.vue'
import LogisticsShipmentStatistics from '../../components/dashboard/LogisticsShipmentStatistics.vue'
import SlowProgressRanking from '../../components/dashboard/SlowProgressRanking.vue'
import LogisticsCardStatistics from '../../components/dashboard/LogisticsCardStatistics.vue'
import DashboardExceptionStats from '../../components/dashboard/DashboardExceptionStats.vue'
import DocumentPeriodStats from '../../components/dashboard/DocumentPeriodStats.vue'

// ── Stats by department ────────────────────────────────────
const deptLoading = ref(false)
const deptRows = ref<StatsByDepartmentItem[]>([])
const deptHeaders = [
  { title: 'Phòng ban', key: 'department_name' },
  { title: 'Đang làm', key: 'in_progress' },
  { title: 'Hoàn thành', key: 'done' },
  { title: 'Quá hạn', key: 'overdue' },
]

// ── Stats by user ──────────────────────────────────────────
const userLoading = ref(false)
const userRows = ref<StatsByUserItem[]>([])
const userHeaders = [
  { title: 'Nhân viên', key: 'user_name' },
  { title: 'Tổng', key: 'total' },
  { title: 'Hoàn thành', key: 'done' },
  { title: 'Quá hạn', key: 'overdue' },
]

// ── Overdue ────────────────────────────────────────────────
const overdueLoading = ref(false)
const overdueRows = ref<Item[]>([])
const overdueHeaders = [
  { title: 'Công việc', key: 'name' },
  { title: 'Hạn kết thúc', key: 'end_at' },
  { title: 'Tiến độ', key: 'completion_percent' },
  { title: 'Độ ưu tiên', key: 'priority' },
]

// ── Upcoming deadline ──────────────────────────────────────
const upcomingLoading = ref(false)
const upcomingRows = ref<Item[]>([])
const upcomingHeaders = [
  { title: 'Công việc', key: 'name' },
  { title: 'Hạn kết thúc', key: 'end_at' },
  { title: 'Tiến độ', key: 'completion_percent' },
  { title: 'Độ ưu tiên', key: 'priority' },
]

const priorityColor = (p?: string) => {
  if (p === 'high') return 'error'
  if (p === 'medium') return 'warning'
  if (p === 'low') return 'success'
  return 'secondary'
}
const priorityLabel = (p?: string) => {
  if (p === 'high') return 'Cao'
  if (p === 'medium') return 'Trung bình'
  if (p === 'low') return 'Thấp'
  return '—'
}

const topSlowDept = computed(() =>
  [...deptRows.value]
    .filter(d => d.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 5)
    .map(d => ({ id: d.department_id, name: d.department_name ?? '', total: d.total, overdue: d.overdue, done: d.done })),
)

const topSlowUser = computed(() =>
  [...userRows.value]
    .filter(u => u.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 5)
    .map(u => ({ id: u.user_id, name: u.user_name, total: u.total, overdue: u.overdue, done: u.done })),
)

const fetchAll = async () => {
  deptLoading.value = true
  userLoading.value = true
  overdueLoading.value = true
  upcomingLoading.value = true
  try {
    const [deptRes, userRes, overdueRes, upcomingRes] = await Promise.all([
      itemApi.statsByDepartment(),
      itemApi.statsByUser(),
      itemApi.overdue(),
      itemApi.upcomingDeadline({ days: 7 }),
    ])
    deptRows.value = deptRes.data.data ?? []
    userRows.value = userRes.data.data ?? []
    overdueRows.value = overdueRes.data.data ?? []
    upcomingRows.value = upcomingRes.data.data ?? []
  }
  catch {}
  finally {
    deptLoading.value = false
    userLoading.value = false
    overdueLoading.value = false
    upcomingLoading.value = false
  }
}

fetchAll()
</script>

<template>
  <VRow class="match-height">

     <VCol
      cols="12"
    >
    <LogisticsCardStatistics/>
    </VCol>
    <!-- Thống kê theo phòng ban -->
    <VCol
      cols="12"
      md="6"
    >
      <LogisticsOverviewTable
        title="Thống kê theo phòng ban"
        :headers="deptHeaders"
        :items="deptRows"
        :loading="deptLoading"
        item-value="department_id"
      >
        <template #item.department_name="{ item }">
          <span class="text-base font-weight-medium">
            {{ item.department_name ?? 'Chưa phân phòng ban' }}
          </span>
        </template>
        <template #item.in_progress="{ item }">
          <VChip color="info" size="small" label>{{ item.in_progress }}</VChip>
        </template>
        <template #item.done="{ item }">
          <VChip color="success" size="small" label>{{ item.done }}</VChip>
        </template>
        <template #item.overdue="{ item }">
          <VChip color="error" size="small" label>{{ item.overdue }}</VChip>
        </template>
      </LogisticsOverviewTable>
    </VCol>

    <!-- Thống kê theo nhân viên -->
    <VCol
      cols="12"
      md="6"
    >
      <LogisticsOverviewTable
        title="Thống kê theo nhân viên"
        :headers="userHeaders"
        :items="userRows"
        :loading="userLoading"
        item-value="user_id"
      >
        <template #item.user_name="{ item }">
          <span class="text-base font-weight-medium">{{ item.user_name }}</span>
        </template>
        <template #item.total="{ item }">
          <VChip color="secondary" size="small" label>{{ item.total }}</VChip>
        </template>
        <template #item.done="{ item }">
          <VChip color="success" size="small" label>{{ item.done }}</VChip>
        </template>
        <template #item.overdue="{ item }">
          <VChip color="error" size="small" label>{{ item.overdue }}</VChip>
        </template>
      </LogisticsOverviewTable>
    </VCol>

    <!-- Biểu đồ xu hướng -->
    <VCol cols="12" md="6">
      <DashboardExceptionStats />
    </VCol>

    <VCol cols="12" md="6">
      <LogisticsShipmentStatistics />
    </VCol>

    <!-- Văn bản giao việc theo kỳ -->
    <VCol cols="12">
      <DocumentPeriodStats />
    </VCol>

    <!-- Top phòng ban chậm tiến độ -->
    <VCol
      cols="12"
      md="6"
    >
      <SlowProgressRanking
        title="Top phòng ban chậm tiến độ"
        :items="topSlowDept"
        :loading="deptLoading"
        avatar-icon="tabler-building"
      />
    </VCol>

    <!-- Top cá nhân chậm tiến độ -->
    <VCol
      cols="12"
      md="6"
    >
      <SlowProgressRanking
        title="Top cá nhân chậm tiến độ"
        :items="topSlowUser"
        :loading="userLoading"
        avatar-icon="tabler-user"
      />
    </VCol>

    <!-- Công việc quá hạn -->
    <VCol
      cols="12"
      md="6"
    >
      <LogisticsOverviewTable
        title="Công việc quá hạn"
        :headers="overdueHeaders"
        :items="overdueRows"
        :loading="overdueLoading"
        item-value="id"
      >
        <template #item.name="{ item }">
          <RouterLink :to="{ name: 'task-assignment-items-id', params: { id: item.id } }">
            <span class="text-base font-weight-medium">{{ item.name }}</span>
          </RouterLink>
        </template>
        <template #item.end_at="{ item }">
          <span class="text-error">{{ item.end_at ?? '—' }}</span>
        </template>
        <template #item.completion_percent="{ item }">
          <div class="d-flex align-center gap-x-2" style="min-width: 60px;">
            <span class="text-caption">{{ item.completion_percent }}%</span>
          </div>
        </template>
        <template #item.priority="{ item }">
          <VChip :color="priorityColor(item.priority)" size="small" label>
            {{ priorityLabel(item.priority) }}
          </VChip>
        </template>
      </LogisticsOverviewTable>
    </VCol>

    <!-- Công việc sắp đến hạn -->
    <VCol
      cols="12"
      md="6"
    >
      <LogisticsOverviewTable
        title="Sắp đến hạn (7 ngày tới)"
        :headers="upcomingHeaders"
        :items="upcomingRows"
        :loading="upcomingLoading"
        item-value="id"
      >
        <template #item.name="{ item }">
          <RouterLink :to="{ name: 'task-assignment-items-id', params: { id: item.id } }">
            <span class="text-base font-weight-medium">{{ item.name }}</span>
          </RouterLink>
        </template>
        <template #item.end_at="{ item }">
          <span class="text-warning">{{ item.end_at ?? '—' }}</span>
        </template>
        <template #item.completion_percent="{ item }">
          <div class="d-flex align-center gap-x-2" style="min-width: 60px;">
            <span class="text-caption">{{ item.completion_percent }}%</span>
          </div>
        </template>
        <template #item.priority="{ item }">
          <VChip :color="priorityColor(item.priority)" size="small" label>
            {{ priorityLabel(item.priority) }}
          </VChip>
        </template>
      </LogisticsOverviewTable>
    </VCol>

  </VRow>
</template>
