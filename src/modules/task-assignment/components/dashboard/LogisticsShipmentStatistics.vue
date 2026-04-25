<script setup lang="ts">
import { itemApi } from '../../services/itemApi'
import type { StatsByTimeItem } from '../../services/itemApi'

const chartColors = {
  done: '#28C76F',
  overdue: '#EA5455',
  doneFill: '#28C76F29',
}

const headingColor = 'rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity))'
const labelColor = 'rgba(var(--v-theme-on-background), var(--v-medium-emphasis-opacity))'
const borderColor = 'rgba(var(--v-border-color), var(--v-border-opacity))'

type GroupBy = 'week' | 'month' | 'quarter'
const groupBy = ref<GroupBy>('month')

const groupByOptions: { title: string; value: GroupBy }[] = [
  { title: 'Tuần', value: 'week' },
  { title: 'Tháng', value: 'month' },
  { title: 'Quý', value: 'quarter' },
]

const loading = ref(false)
const rows = ref<StatsByTimeItem[]>([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await itemApi.statsByTime({ group_by: groupBy.value })

    rows.value = res.data.data ?? []
  }
  catch { rows.value = [] }
  finally { loading.value = false }
}

watch(groupBy, fetchData, { immediate: true })

const categories = computed(() => rows.value.map(r => r.period))
const totalSum = computed(() => rows.value.reduce((s, r) => s + r.total, 0))

const series = computed(() => [
  {
    name: 'Hoàn thành',
    type: 'column',
    data: rows.value.map(r => r.done),
  },
  {
    name: 'Quá hạn',
    type: 'line',
    data: rows.value.map(r => r.overdue),
  },
])

const chartConfig = computed(() => ({
  chart: {
    type: 'line',
    stacked: false,
    parentHeightOffset: 0,
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  markers: {
    size: 5,
    colors: '#fff',
    strokeColors: chartColors.overdue,
    hover: { size: 6 },
    borderRadius: 4,
  },
  stroke: {
    curve: 'smooth',
    width: [0, 3],
    lineCap: 'round',
  },
  legend: {
    show: true,
    position: 'bottom',
    markers: { width: 8, height: 8, offsetX: -3 },
    height: 40,
    itemMargin: { horizontal: 10, vertical: 0 },
    fontSize: '15px',
    fontFamily: 'Open Sans',
    fontWeight: 400,
    labels: { colors: headingColor, useSeriesColors: false },
    offsetY: 10,
  },
  grid: { strokeDashArray: 8, borderColor },
  colors: [chartColors.done, chartColors.overdue],
  fill: { opacity: [1, 1] },
  plotOptions: {
    bar: {
      columnWidth: '30%',
      borderRadius: 4,
      borderRadiusApplication: 'end',
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: categories.value,
    labels: {
      style: { colors: labelColor, fontSize: '13px', fontWeight: 400 },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    tickAmount: 4,
    min: 0,
    labels: {
      style: { colors: labelColor, fontSize: '13px', fontWeight: 400 },
      formatter: (val: number) => `${val}`,
    },
  },
  responsive: [
    {
      breakpoint: 1400,
      options: {
        chart: { height: 320 },
        xaxis: { labels: { style: { fontSize: '10px' } } },
        legend: { itemMargin: { vertical: 0, horizontal: 10 }, fontSize: '13px', offsetY: 12 },
      },
    },
    { breakpoint: 1025, options: { chart: { height: 415 }, plotOptions: { bar: { columnWidth: '50%' } } } },
    { breakpoint: 982, options: { plotOptions: { bar: { columnWidth: '30%' } } } },
    { breakpoint: 480, options: { chart: { height: 250 }, legend: { offsetY: 7 } } },
  ],
}))
</script>

<template>
  <VCard>
    <VCardItem title="Xu hướng hoàn thành & quá hạn">
      <template #subtitle>
        Tổng số công việc: <strong>{{ totalSum }}</strong>
      </template>
      <template #append>
        <div class="d-flex align-center gap-2">
          <VBtnToggle
            v-model="groupBy"
            color="primary"
            density="compact"
            divided
            mandatory
            rounded="lg"
          >
            <VBtn
              v-for="opt in groupByOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.title }}
            </VBtn>
          </VBtnToggle>
        </div>
      </template>
    </VCardItem>

    <VCardText>
      <div
        v-if="loading"
        class="d-flex justify-center align-center"
        style="block-size: 320px;"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>
      <VueApexCharts
        v-else
        id="shipment-statistics"
        type="line"
        height="320"
        :options="chartConfig"
        :series="series"
      />
    </VCardText>
  </VCard>
</template>

<style lang="scss">
@use "@core/scss/template/libs/apex-chart";

#shipment-statistics {
  .apexcharts-legend-text {
    font-size: 16px !important;
  }

  .apexcharts-legend-series {
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 0.375rem;
    block-size: 83%;
    padding-block: 4px;
    padding-inline: 16px 12px;
  }
}
</style>
