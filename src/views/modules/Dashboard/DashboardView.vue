<!-- eslint-disable import/extensions -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useAbility } from '@casl/vue'
// eslint-disable-next-line no-restricted-imports
import VueApexCharts from 'vue3-apexcharts'

// eslint-disable-next-line import/no-unresolved
import { useAuthStore } from '@/store/modules/auth'
// eslint-disable-next-line import/no-unresolved
import { useUserStore } from '@/store/modules/user'
// eslint-disable-next-line import/no-unresolved
import { useOrganizationStore } from '@/modules/core/stores/useOrganizationStore'

const { can } = useAbility()
const authStore = useAuthStore()
const userStore = useUserStore()
const orgStore = useOrganizationStore()

const canSeeUsers = computed(() => can('index', 'Users'))
const canSeeOrgs = computed(() => can('index', 'Organizations'))

const userData = computed(() => authStore.user)
const currentOrg = computed(() => authStore.currentOrganization)

const userStats = computed(() => userStore.stats)
const orgStats = computed(() => orgStore.stats)

const isLoadingStats = computed(() => userStore.isLoading || orgStore.isLoading)

const hasAnyPermission = computed(() =>
  canSeeUsers.value || canSeeOrgs.value,
)

onMounted(async () => {
  const tasks: Promise<any>[] = []
  if (canSeeUsers.value)
    tasks.push(userStore.fetchStats())
  if (canSeeOrgs.value)
    tasks.push(orgStore.fetchStats())
  await Promise.allSettled(tasks)
})

// ─── Stat cards ───────────────────────────────────────────────────────────────
interface StatCard {
  title: string
  icon: string
  color: string
  to: RouteLocationRaw
  stats: { label: string; value: number | string; color: string }[]
}

const statCards = computed<StatCard[]>(() => {
  const cards: StatCard[] = []

  if (canSeeUsers.value) {
    cards.push({
      title: 'Người dùng',
      icon: 'tabler-users',
      color: 'primary',
      to: { name: 'system-users' },
      stats: [
        { label: 'Tổng', value: userStats.value?.total ?? '—', color: 'primary' },
        { label: 'Hoạt động', value: userStats.value?.active ?? '—', color: 'success' },
        { label: 'Ngừng', value: userStats.value?.inactive ?? '—', color: 'warning' },
      ],
    })
  }

  if (canSeeOrgs.value) {
    cards.push({
      title: 'Tổ chức',
      icon: 'tabler-building',
      color: 'info',
      to: { name: 'system-organizations' },
      stats: [
        { label: 'Tổng', value: orgStats.value?.total ?? '—', color: 'info' },
        { label: 'Hoạt động', value: orgStats.value?.active ?? '—', color: 'success' },
        { label: 'Ngừng', value: orgStats.value?.inactive ?? '—', color: 'warning' },
      ],
    })
  }

  return cards
})

// ─── Charts ───────────────────────────────────────────────────────────────────
const userChartSeries = computed(() => {
  const s = userStats.value
  if (!s || s.total === 0)
    return [0, 0]

  return [s.active, s.inactive]
})

const userChartOptions = computed(() => ({
  chart: { type: 'donut', sparkline: { enabled: false } },
  labels: ['Hoạt động', 'Ngừng hoạt động'],
  colors: ['#56CA00', '#FFB400'],
  legend: { position: 'bottom', fontSize: '13px' },
  dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Tổng',
            fontSize: '15px',
            fontWeight: 600,
            formatter: () => String(userStats.value?.total ?? 0),
          },
        },
      },
    },
  },
  tooltip: { y: { formatter: (v: number) => `${v} người dùng` } },
}))

const orgChartSeries = computed(() => {
  const s = orgStats.value
  if (!s || s.total === 0)
    return [0, 0]

  return [s.active, s.inactive]
})

const orgChartOptions = computed(() => ({
  chart: { type: 'donut' },
  labels: ['Hoạt động', 'Ngừng hoạt động'],
  colors: ['#16B1FF', '#FF4C51'],
  legend: { position: 'bottom', fontSize: '13px' },
  dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Tổng',
            fontSize: '15px',
            fontWeight: 600,
            formatter: () => String(orgStats.value?.total ?? 0),
          },
        },
      },
    },
  },
  tooltip: { y: { formatter: (v: number) => `${v} tổ chức` } },
}))

const quickNavItems = computed(() => {
  const items = []
  if (canSeeUsers.value)
    items.push({ title: 'Người dùng', to: { name: 'system-users' }, icon: 'tabler-users', color: 'primary' })
  if (canSeeOrgs.value)
    items.push({ title: 'Tổ chức', to: { name: 'system-organizations' }, icon: 'tabler-building', color: 'info' })

  return items
})
</script>

<template>
  <!-- ── No permissions ─────────────────────────────────────────────────── -->
  <VRow v-if="!hasAnyPermission && !isLoadingStats">
    <VCol cols="12">
      <VCard>
        <VCardText class="text-center py-12">
          <VIcon icon="tabler-lock" size="52" color="warning" class="mb-4" />
          <div class="text-h6 mb-2">Bạn chưa có quyền xem thống kê</div>
          <p class="text-medium-emphasis">Liên hệ quản trị viên để được cấp quyền truy cập phù hợp.</p>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <template v-if="hasAnyPermission">
    <!-- ── Stat cards ──────────────────────────────────────────────────────── -->
    <VRow>
      <VCol v-for="card in statCards" :key="card.title" cols="12" sm="6" :lg="statCards.length >= 4 ? 3 : 6">
        <VCard class="h-100">
          <VCardText class="pb-2">
            <div class="d-flex align-center justify-space-between mb-4">
              <span class="text-body-1 font-weight-medium">{{ card.title }}</span>
              <VAvatar :color="card.color" variant="tonal" size="40" rounded>
                <VIcon :icon="card.icon" size="22" />
              </VAvatar>
            </div>
            <div v-if="isLoadingStats" class="d-flex align-center" style="height:48px">
              <VProgressCircular indeterminate size="24" width="2" :color="card.color" />
            </div>
            <div v-else class="d-flex flex-wrap gap-x-6 gap-y-2">
              <div v-for="stat in card.stats" :key="stat.label">
                <div class="text-h5 font-weight-bold" :class="`text-${stat.color}`">{{ stat.value }}</div>
                <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
              </div>
            </div>
          </VCardText>
          <VCardActions class="pt-0 px-4 pb-3">
            <RouterLink :to="card.to as any" class="text-caption" style="text-decoration:none">
              <span :class="`text-${card.color}`">Xem chi tiết</span>
              <VIcon icon="tabler-arrow-right" size="14" :class="`text-${card.color} ms-1`" />
            </RouterLink>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>

    <!-- ── Charts row ──────────────────────────────────────────────────────── -->
    <VRow class="mt-2">
      <VCol v-if="canSeeUsers" cols="12" md="6" lg="6">
        <VCard class="h-100">
          <VCardTitle class="pa-4 pb-0 text-body-1 font-weight-semibold">
            <VIcon icon="tabler-users" size="18" color="primary" class="me-2" />
            Trạng thái người dùng
          </VCardTitle>
          <VCardText>
            <template v-if="!isLoadingStats && userStats && userStats.total > 0">
              <VueApexCharts type="donut" height="240" :options="userChartOptions" :series="userChartSeries" />
            </template>
            <div v-else-if="isLoadingStats" class="d-flex justify-center align-center" style="height:240px">
              <VProgressCircular indeterminate color="primary" size="36" />
            </div>
            <div v-else class="d-flex flex-column align-center justify-center text-disabled" style="height:240px">
              <VIcon icon="tabler-chart-donut-off" size="40" class="mb-2" />
              Chưa có dữ liệu
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol v-if="canSeeOrgs" cols="12" md="6" lg="6">
        <VCard class="h-100">
          <VCardTitle class="pa-4 pb-0 text-body-1 font-weight-semibold">
            <VIcon icon="tabler-building" size="18" color="info" class="me-2" />
            Trạng thái tổ chức
          </VCardTitle>
          <VCardText>
            <template v-if="!isLoadingStats && orgStats && orgStats.total > 0">
              <VueApexCharts type="donut" height="240" :options="orgChartOptions" :series="orgChartSeries" />
            </template>
            <div v-else-if="isLoadingStats" class="d-flex justify-center align-center" style="height:240px">
              <VProgressCircular indeterminate color="info" size="36" />
            </div>
            <div v-else class="d-flex flex-column align-center justify-center text-disabled" style="height:240px">
              <VIcon icon="tabler-chart-donut-off" size="40" class="mb-2" />
              Chưa có dữ liệu
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ── Summary table ───────────────────────────────────────────────────── -->
    <VRow v-if="canSeeUsers || canSeeOrgs" class="mt-2">
      <VCol cols="12">
        <VCard>
          <VCardTitle class="pa-4 pb-2 text-body-1 font-weight-semibold">
            <VIcon icon="tabler-table" size="18" class="me-2" color="primary" />
            Bảng tổng hợp
          </VCardTitle>
          <VTable>
            <thead>
              <tr>
                <th>Danh mục</th>
                <th class="text-center">Tổng</th>
                <th class="text-center">Hoạt động</th>
                <th class="text-center">Ngừng</th>
                <th class="text-center">Tỷ lệ hoạt động</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-if="canSeeUsers">
                <td>
                  <div class="d-flex align-center gap-2">
                    <VAvatar color="primary" variant="tonal" size="28" rounded>
                      <VIcon icon="tabler-users" size="16" />
                    </VAvatar>
                    Người dùng
                  </div>
                </td>
                <td class="text-center font-weight-bold">{{ userStats?.total ?? '—' }}</td>
                <td class="text-center"><VChip color="success" size="small" variant="tonal">{{ userStats?.active ?? '—' }}</VChip></td>
                <td class="text-center"><VChip color="warning" size="small" variant="tonal">{{ userStats?.inactive ?? '—' }}</VChip></td>
                <td class="text-center">
                  <VProgressLinear
                    :model-value="userStats?.total ? Math.round((userStats.active / userStats.total) * 100) : 0"
                    color="success" height="8" rounded bg-color="success" bg-opacity="0.12"
                    style="max-width:120px;margin:auto"
                  />
                  <span class="text-caption text-medium-emphasis">
                    {{ userStats?.total ? Math.round((userStats.active / userStats.total) * 100) : 0 }}%
                  </span>
                </td>
                <td class="text-end pe-4">
                  <VBtn :to="{ name: 'system-users' }" size="small" variant="tonal" color="primary" icon="tabler-arrow-right" />
                </td>
              </tr>
              <tr v-if="canSeeOrgs">
                <td>
                  <div class="d-flex align-center gap-2">
                    <VAvatar color="info" variant="tonal" size="28" rounded>
                      <VIcon icon="tabler-building" size="16" />
                    </VAvatar>
                    Tổ chức
                  </div>
                </td>
                <td class="text-center font-weight-bold">{{ orgStats?.total ?? '—' }}</td>
                <td class="text-center"><VChip color="success" size="small" variant="tonal">{{ orgStats?.active ?? '—' }}</VChip></td>
                <td class="text-center"><VChip color="warning" size="small" variant="tonal">{{ orgStats?.inactive ?? '—' }}</VChip></td>
                <td class="text-center">
                  <VProgressLinear
                    :model-value="orgStats?.total ? Math.round((orgStats.active / orgStats.total) * 100) : 0"
                    color="info" height="8" rounded bg-color="info" bg-opacity="0.12"
                    style="max-width:120px;margin:auto"
                  />
                  <span class="text-caption text-medium-emphasis">
                    {{ orgStats?.total ? Math.round((orgStats.active / orgStats.total) * 100) : 0 }}%
                  </span>
                </td>
                <td class="text-end pe-4">
                  <VBtn :to="{ name: 'system-organizations' }" size="small" variant="tonal" color="info" icon="tabler-arrow-right" />
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>
    </VRow>
  </template>
</template>
