<!-- eslint-disable no-restricted-imports -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { type MeetingDashboard, meetingApi } from '@/api/modules/meeting'

const isLoading = ref(false)
const dashboard = ref<MeetingDashboard | null>(null)

const fetchDashboard = async () => {
  isLoading.value = true
  try {
    const res = await meetingApi.dashboard()
    if (res.data.success && res.data.data)
      dashboard.value = res.data.data
  }
  catch {
    // silent
  }
  finally {
    isLoading.value = false
  }
}

onMounted(fetchDashboard)

// --- Computed helpers ---
const monthly = computed(() => dashboard.value?.monthly_stats)
const upcoming = computed(() => dashboard.value?.upcoming_meetings ?? [])
const attendance = computed(() => dashboard.value?.attendance_stats)

// Donut chart: tỷ lệ điểm danh
const attendanceChartSeries = computed(() => {
  const a = attendance.value
  if (!a || a.total === 0)
    return [0, 0, 0]

  return [a.present, a.absent, a.not_arrived]
})

const attendanceChartOptions = computed(() => ({
  chart: { type: 'donut' },
  labels: ['Có mặt', 'Vắng mặt', 'Chưa điểm danh'],
  colors: ['#56CA00', '#FF4C51', '#FFB400'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Tổng',
            formatter: () => String(attendance.value?.total ?? 0),
          },
        },
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} đại biểu`,
    },
  },
}))

// Bar chart: cuộc họp trong tháng theo trạng thái
const monthlyChartSeries = computed(() => [
  {
    name: 'Số cuộc họp',
    data: [
      monthly.value?.draft ?? 0,
      monthly.value?.active ?? 0,
      monthly.value?.in_progress ?? 0,
      monthly.value?.ended ?? 0,
    ],
  },
])

const monthlyChartOptions = {
  chart: { type: 'bar', toolbar: { show: false } },
  plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
  xaxis: { categories: ['Nháp', 'Đã lên lịch', 'Đang diễn ra', 'Đã kết thúc'] },
  colors: ['#8C57FF', '#16B1FF', '#FFB400', '#56CA00'],
  dataLabels: { enabled: false },
  yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
}

// Status helpers
const resolveStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    draft: 'secondary',
    active: 'info',
    in_progress: 'warning',
    ended: 'success',
  }

  return variants[status] || 'secondary'
}

const resolveStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Nháp',
    active: 'Đã lên lịch',
    in_progress: 'Đang diễn ra',
    ended: 'Đã kết thúc',
  }

  return labels[status] || status
}
</script>

<template>
  <section>
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="d-flex justify-center align-center pa-16"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="48"
      />
    </div>

    <template v-else-if="dashboard">
      <!-- Stat cards tháng hiện tại -->
      <VRow class="mb-6">
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar
                color="primary"
                variant="tonal"
                rounded
                size="44"
                class="me-4"
              >
                <VIcon
                  icon="tabler-calendar-stats"
                  size="26"
                />
              </VAvatar>
              <div>
                <div class="text-body-2 text-disabled">
                  Tổng tháng {{ monthly?.month }}
                </div>
                <h4 class="text-h4">
                  {{ monthly?.total ?? 0 }}
                </h4>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar
                color="info"
                variant="tonal"
                rounded
                size="44"
                class="me-4"
              >
                <VIcon
                  icon="tabler-clock"
                  size="26"
                />
              </VAvatar>
              <div>
                <div class="text-body-2 text-disabled">
                  Đã lên lịch
                </div>
                <h4 class="text-h4">
                  {{ monthly?.active ?? 0 }}
                </h4>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar
                color="warning"
                variant="tonal"
                rounded
                size="44"
                class="me-4"
              >
                <VIcon
                  icon="tabler-progress"
                  size="26"
                />
              </VAvatar>
              <div>
                <div class="text-body-2 text-disabled">
                  Đang diễn ra
                </div>
                <h4 class="text-h4">
                  {{ monthly?.in_progress ?? 0 }}
                </h4>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VCard>
            <VCardText class="d-flex align-center">
              <VAvatar
                color="success"
                variant="tonal"
                rounded
                size="44"
                class="me-4"
              >
                <VIcon
                  icon="tabler-check"
                  size="26"
                />
              </VAvatar>
              <div>
                <div class="text-body-2 text-disabled">
                  Đã kết thúc
                </div>
                <h4 class="text-h4">
                  {{ monthly?.ended ?? 0 }}
                </h4>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Charts row -->
      <VRow class="mb-6">
        <!-- Bar chart: phân bổ cuộc họp theo trạng thái -->
        <VCol
          cols="12"
          md="7"
        >
          <VCard height="100%">
            <VCardTitle class="pa-4 pb-2">
              Phân bổ cuộc họp tháng {{ monthly?.month }}
            </VCardTitle>
            <VCardText>
              <VueApexCharts
                type="bar"
                height="260"
                :options="monthlyChartOptions"
                :series="monthlyChartSeries"
              />
            </VCardText>
          </VCard>
        </VCol>

        <!-- Donut chart: tỷ lệ điểm danh -->
        <VCol
          cols="12"
          md="5"
        >
          <VCard height="100%">
            <VCardTitle class="pa-4 pb-2">
              Tỷ lệ điểm danh tháng {{ monthly?.month }}
            </VCardTitle>
            <VCardText>
              <template v-if="attendance && attendance.total > 0">
                <VueApexCharts
                  type="donut"
                  height="260"
                  :options="attendanceChartOptions"
                  :series="attendanceChartSeries"
                />
              </template>
              <div
                v-else
                class="d-flex flex-column align-center justify-center"
                style="height: 260px;"
              >
                <VIcon
                  icon="tabler-users-off"
                  size="48"
                  color="disabled"
                  class="mb-3"
                />
                <div class="text-body-1 text-disabled">
                  Chưa có dữ liệu điểm danh
                </div>
              </div>
            </VCardText>

            <!-- Attendance summary cards -->
            <VCardText
              v-if="attendance && attendance.total > 0"
              class="pt-0"
            >
              <VRow dense>
                <VCol cols="4">
                  <div class="text-center pa-2 rounded bg-success-tonal">
                    <div class="text-h6 text-success">
                      {{ attendance.present }}
                    </div>
                    <div class="text-caption">
                      Có mặt
                    </div>
                  </div>
                </VCol>
                <VCol cols="4">
                  <div class="text-center pa-2 rounded bg-error-tonal">
                    <div class="text-h6 text-error">
                      {{ attendance.absent }}
                    </div>
                    <div class="text-caption">
                      Vắng mặt
                    </div>
                  </div>
                </VCol>
                <VCol cols="4">
                  <div class="text-center pa-2 rounded bg-warning-tonal">
                    <div class="text-h6 text-warning">
                      {{ attendance.not_arrived }}
                    </div>
                    <div class="text-caption">
                      Chưa đến
                    </div>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Upcoming meetings -->
      <VCard>
        <VCardTitle class="pa-4 pb-0 d-flex align-center">
          <VIcon
            icon="tabler-calendar-event"
            class="me-2"
            color="primary"
          />
          Cuộc họp sắp diễn ra (7 ngày tới)
        </VCardTitle>

        <VCardText class="pt-3">
          <!-- Empty -->
          <div
            v-if="upcoming.length === 0"
            class="d-flex flex-column align-center py-10"
          >
            <VIcon
              icon="tabler-calendar-off"
              size="48"
              color="disabled"
              class="mb-3"
            />
            <div class="text-body-1 text-disabled">
              Không có cuộc họp nào sắp diễn ra
            </div>
          </div>

          <!-- List -->
          <VList
            v-else
            lines="two"
          >
            <VListItem
              v-for="meeting in upcoming"
              :key="meeting.id"
              class="px-0 py-2"
            >
              <template #prepend>
                <VAvatar
                  color="primary"
                  variant="tonal"
                  rounded
                  size="42"
                  class="me-4"
                >
                  <VIcon
                    icon="tabler-calendar"
                    size="22"
                  />
                </VAvatar>
              </template>

              <VListItemTitle class="font-weight-medium">
                {{ meeting.title }}
              </VListItemTitle>
              <VListItemSubtitle>
                <VIcon
                  icon="tabler-clock"
                  size="14"
                  class="me-1"
                />
                {{ meeting.start_at }} – {{ meeting.end_at }}
                <span
                  v-if="meeting.location"
                  class="ms-3"
                >
                  <VIcon
                    icon="tabler-map-pin"
                    size="14"
                    class="me-1"
                  />{{ meeting.location }}
                </span>
              </VListItemSubtitle>

              <template #append>
                <div class="d-flex flex-column align-end gap-1">
                  <VChip
                    :color="resolveStatusVariant(meeting.status)"
                    size="small"
                  >
                    {{ resolveStatusLabel(meeting.status) }}
                  </VChip>
                  <span class="text-caption text-disabled">
                    <VIcon
                      icon="tabler-users"
                      size="13"
                      class="me-1"
                    />{{ meeting.participant_count }} đại biểu
                  </span>
                </div>
              </template>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </template>
  </section>
</template>
