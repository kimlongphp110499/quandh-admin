<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useOrganizationStore } from '@/store/modules/organization'
import AppSystemPageHeader from '@/components/AppSystemPageHeader.vue'

const orgStore = useOrganizationStore()

const isLoading = ref(false)

const stats = computed(() => orgStore.stats)
const total = computed(() => stats.value?.total ?? 0)
const active = computed(() => stats.value?.active ?? 0)
const inactive = computed(() => stats.value?.inactive ?? 0)
const activePercent = computed(() => total.value > 0 ? Math.round((active.value / total.value) * 100) : 0)
const inactivePercent = computed(() => total.value > 0 ? 100 - activePercent.value : 0)

const loadStats = async () => {
  isLoading.value = true
  try {
    await orgStore.fetchStats()
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadStats)

defineExpose({ reload: loadStats })
</script>

<template>
  <div>

    <!-- Loading state -->
    <div
      v-if="isLoading && !stats"
      class="d-flex justify-center align-center py-16"
    >
      <VProgressCircular
        indeterminate
        size="48"
        color="primary"
      />
    </div>

    <template v-else>
        <!-- System Page Header -->
      <AppSystemPageHeader
        title="Tổ chức"
        :total="orgStore.stats?.total ?? 0"
        :active="orgStore.activeCount ?? 0"
        :inactive="orgStore.inactiveCount ?? 0"
        total-label="Tổng tổ chức"
        active-label="Đang hoạt động"
        inactive-label="Không hoạt động"
        total-icon="tabler-building"
        active-icon="tabler-circle-check"
        inactive-icon="tabler-circle-x"
        @settings="() => {}"
      />
      <!-- Tỷ lệ biểu đồ -->
      <VRow>
        <VCol cols="12" md="6">
          <VCard elevation="0" border>
            <VCardTitle class="pa-6 pb-2 text-h6">
              Tỷ lệ trạng thái
            </VCardTitle>
            <VCardText class="pa-6 pt-4">
              <!-- Progress bars -->
              <div class="mb-5">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="d-flex align-center gap-2">
                    <div
                      class="rounded-circle"
                      style="width:12px;height:12px;background:rgb(var(--v-theme-success))"
                    />
                    <span class="text-body-2 font-weight-medium">Đang hoạt động</span>
                  </div>
                  <span class="text-body-2 font-weight-bold">{{ active }} / {{ total }}</span>
                </div>
                <VProgressLinear
                  :model-value="activePercent"
                  color="success"
                  height="10"
                  rounded
                  bg-color="success"
                  bg-opacity="0.12"
                />
              </div>

              <div>
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="d-flex align-center gap-2">
                    <div
                      class="rounded-circle"
                      style="width:12px;height:12px;background:rgb(var(--v-theme-error))"
                    />
                    <span class="text-body-2 font-weight-medium">Không hoạt động</span>
                  </div>
                  <span class="text-body-2 font-weight-bold">{{ inactive }} / {{ total }}</span>
                </div>
                <VProgressLinear
                  :model-value="inactivePercent"
                  color="error"
                  height="10"
                  rounded
                  bg-color="error"
                  bg-opacity="0.12"
                />
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Bảng tóm tắt -->
        <VCol cols="12" md="6">
          <VCard elevation="0" border>
            <VCardTitle class="pa-6 pb-2 text-h6">
              Bảng tóm tắt
            </VCardTitle>
            <VTable>
              <thead>
                <tr>
                  <th>Trạng thái</th>
                  <th class="text-center">
                    Số lượng
                  </th>
                  <th class="text-center">
                    Tỷ lệ
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="d-flex align-center gap-2">
                      <VBadge
                        dot
                        color="success"
                        inline
                      />
                      Đang hoạt động
                    </div>
                  </td>
                  <td class="text-center font-weight-bold">
                    {{ active }}
                  </td>
                  <td class="text-center">
                    <VChip
                      color="success"
                      size="small"
                      variant="tonal"
                    >
                      {{ activePercent }}%
                    </VChip>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="d-flex align-center gap-2">
                      <VBadge
                        dot
                        color="error"
                        inline
                      />
                      Không hoạt động
                    </div>
                  </td>
                  <td class="text-center font-weight-bold">
                    {{ inactive }}
                  </td>
                  <td class="text-center">
                    <VChip
                      color="error"
                      size="small"
                      variant="tonal"
                    >
                      {{ inactivePercent }}%
                    </VChip>
                  </td>
                </tr>
                <tr class="font-weight-bold">
                  <td>Tổng cộng</td>
                  <td class="text-center">
                    {{ total }}
                  </td>
                  <td class="text-center">
                    <VChip
                      color="primary"
                      size="small"
                      variant="tonal"
                    >
                      100%
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCard>
        </VCol>
      </VRow>
    </template>
  </div>
</template>
