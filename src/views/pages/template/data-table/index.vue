<script setup lang="ts">
import { basic, cellSlot, dense, expandableRows, externalPagination, fixedHeader, groupingRows, kitchenSink, rowEditingViaDialog, rowSelection } from '@/views/pages/template/data-table/demoCodeDataTable'
import DemoDataTableBasic from '@/views/pages/template/data-table/DemoDataTableBasic.vue'
import DemoDataTableDense from '@/views/pages/template/data-table/DemoDataTableDense.vue'
import DemoDataTableCellSlot from '@/views/pages/template/data-table/DemoDataTableCellSlot.vue'
import DemoDataTableRowSelection from '@/views/pages/template/data-table/DemoDataTableRowSelection.vue'
import DemoDataTableFixedHeader from '@/views/pages/template/data-table/DemoDataTableFixedHeader.vue'
import DemoDataTableExpandableRows from '@/views/pages/template/data-table/DemoDataTableExpandableRows.vue'
import DemoDataTableGroupingRows from '@/views/pages/template/data-table/DemoDataTableGroupingRows.vue'
import DemoDataTableRowEditingViaDialog from '@/views/pages/template/data-table/DemoDataTableRowEditingViaDialog.vue'
import DemoDataTableExternalPagination from '@/views/pages/template/data-table/DemoDataTableExternalPagination.vue'
import DemoDataTableKitchenSink from '@/views/pages/template/data-table/DemoDataTableKitchenSink.vue'
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- 👉 Basic -->
      <AppCardCode
        title="Basic"
        :code="basic"
        no-padding
      >
        <DemoDataTableBasic />
      </AppCardCode>
    </VCol>

    <VCol>
      <!-- 👉 Dense  -->
      <AppCardCode
        title="Dense"
        :code="dense"
        no-padding
      >
        <DemoDataTableDense />
      </AppCardCode>
    </VCol>

    <!-- 👉 Table Cell Slot  -->
    <VCol cols="12">
      <AppCardCode
        title="Cell Slot"
        :code="cellSlot"
        no-padding
      >
        <DemoDataTableCellSlot />
      </AppCardCode>
    </VCol>

    <!-- 👉 Table Row selection  -->
    <VCol cols="12">
      <AppCardCode
        title="Row Selection"
        :code="rowSelection"
        no-padding
      >
        <DemoDataTableRowSelection />
      </AppCardCode>
    </VCol>

    <!-- 👉 Fixed Header  -->
    <VCol cols="12">
      <AppCardCode
        title="Fixed Header"
        :code="fixedHeader"
        no-padding
      >
        <DemoDataTableFixedHeader />
      </AppCardCode>
    </VCol>

    <!-- 👉 Expandable rows -->
    <VCol cols="12">
      <AppCardCode
        title="Expandable Rows"
        :code="expandableRows"
        no-padding
      >
        <DemoDataTableExpandableRows />
      </AppCardCode>
    </VCol>
    <!-- 👉 Grouping Rows -->
    <VCol cols="12">
      <AppCardCode
        title="Grouping Rows"
        :code="groupingRows"
        no-padding
      >
        <DemoDataTableGroupingRows />
      </AppCardCode>
    </VCol>

    <!-- 👉 Row Editing via Dialog -->
    <VCol cols="12">
      <AppCardCode
        title="Row Editing via Dialog"
        :code="rowEditingViaDialog"
        no-padding
      >
        <DemoDataTableRowEditingViaDialog />
      </AppCardCode>
    </VCol>

    <!-- 👉 External Pagination  -->
    <VCol cols="12">
      <AppCardCode
        title="External Pagination"
        :code="externalPagination"
        no-padding
      >
        <DemoDataTableExternalPagination />
      </AppCardCode>
    </VCol>

    <!-- 👉 Kitchen Sink  -->
    <VCol cols="12">
      <AppCardCode
        title="Kitchen Sink"
        :code="kitchenSink"
        no-padding
      >
        <DemoDataTableKitchenSink />
      </AppCardCode>
    </VCol>
  </VRow>
</template>
