<script setup lang="ts">
import { itemApi } from '../../services/itemApi'
import type { TaskAssignmentItemStats } from '../../services/itemApi'

const headingColor = 'rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity))'
const labelColor = 'rgba(var(--v-theme-on-background), var(--v-medium-emphasis-opacity))'

const loading = ref(false)
const stats = ref<TaskAssignmentItemStats | null>(null)

const statusConfig = [
  { key: 'todo', label: 'Chưa bắt đầu', color: '#9E9E9E' },
  { key: 'in_progress', label: 'Đang thực hiện', color: '#26C6DA' },
  { key: 'done', label: 'Hoàn thành', color: '#28C76F' },
  { key: 'overdue', label: 'Quá hạn', color: '#EA5455' },
  { key: 'paused', label: 'Tạm dừng', color: '#FF9F43' },
  { key: 'cancelled', label: 'Đã huỷ', color: '#7367F0' },
]

const series = computed(() =>
  statusConfig.map(s => (stats.value as any)?.[s.key] ?? 0),
)

const total = computed(() => series.value.reduce((a, b) => a + b, 0))

const chartConfig = computed(() => ({
  labels: statusConfig.map(s => s.label),
  colors: statusConfig.map(s => s.color),
  stroke: { width: 0 },
  dataLabels: {
    enabled: false,
  },
  legend: {
    show: true,
    position: 'bottom',
    offsetY: 10,
    markers: { width: 8, height: 8, offsetX: -3 },
    itemMargin: { horizontal: 12, vertical: 4 },
    fontSize: '13px',
    fontWeight: 400,
    labels: { colors: headingColor, useSeriesColors: false },
  },
  tooltip: { theme: false },
  grid: { padding: { top: 15 } },
  plotOptions: {
    pie: {
      donut: {
        size: '75%',
        labels: {
          show: true,
          value: {
            fontSize: '24px',
            color: headingColor,
            fontWeight: 500,
            offsetY: -20,
            formatter: (val: string) => Number.parseInt(val),
          },
          name: { offsetY: 20, color: labelColor },
          total: {
            show: true,
            fontSize: '0.9375rem',
            fontWeight: 400,
            label: 'Tổng công việc',
            color: labelColor,
            formatter: () => total.value,
          },
        },
      },
    },
  },
  responsive: [{ breakpoint: 420, options: { chart: { height: 400 } } }],
}))

onMounted(async () => {
  loading.value = true
  try {
    const res = await itemApi.stats()

    stats.value = res.data.data ?? null
  }
  catch {}
  finally { loading.value = false }
})
</script>

<template>
  <VCard>
    <VCardItem title="Phân bổ trạng thái công việc" />
    <VCardText>
      <div
        v-if="loading"
        class="d-flex justify-center align-center"
        style="block-size: 400px;"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>
      <VueApexCharts
        v-else
        type="donut"
        height="400"
        :options="chartConfig"
        :series="series"
      />
    </VCardText>
  </VCard>
</template>
