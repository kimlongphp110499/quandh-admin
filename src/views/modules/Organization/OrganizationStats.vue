<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useOrganizationStore } from '@/store/modules/organization'

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
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h5 class="text-h5 font-weight-bold">
          Thống kê tổ chức
        </h5>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Tổng quan về toàn bộ tổ chức trong hệ thống
        </p>
      </div>
      <VBtn
        variant="tonal"
        color="primary"
        prepend-icon="tabler-refresh"
        :loading="isLoading"
        @click="loadStats"
      >
        Làm mới
      </VBtn>
    </div>

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
      <!-- Stat Cards -->
      <VRow class="mb-6">
        <!-- Tổng tổ chức -->
        <VCol
          cols="12"
          sm="4"
        >
          <VCard elevation="0" border>
            <VCardText class="pa-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="56"
                  rounded
                >
                  <VIcon
                    icon="tabler-building"
                    size="30"
                  />
                </VAvatar>
                <VChip
                  color="primary"
                  variant="tonal"
                  size="small"
                >
                  100%
                </VChip>
              </div>
              <div class="text-h3 font-weight-bold mb-1">
                {{ total }}
              </div>
              <div class="text-body-1 text-medium-emphasis">
                Tổng tổ chức
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Đang hoạt động -->
        <VCol
          cols="12"
          sm="4"
        >
          <VCard elevation="0" border>
            <VCardText class="pa-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <VAvatar
                  color="success"
                  variant="tonal"
                  size="56"
                  rounded
                >
                  <VIcon
                    icon="tabler-circle-check"
                    size="30"
                  />
                </VAvatar>
                <VChip
                  color="success"
                  variant="tonal"
                  size="small"
                >
                  {{ activePercent }}%
                </VChip>
              </div>
              <div class="text-h3 font-weight-bold mb-1">
                {{ active }}
              </div>
              <div class="text-body-1 text-medium-emphasis">
                Đang hoạt động
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Không hoạt động -->
        <VCol
          cols="12"
          sm="4"
        >
          <VCard elevation="0" border>
            <VCardText class="pa-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <VAvatar
                  color="error"
                  variant="tonal"
                  size="56"
                  rounded
                >
                  <VIcon
                    icon="tabler-circle-x"
                    size="30"
                  />
                </VAvatar>
                <VChip
                  color="error"
                  variant="tonal"
                  size="small"
                >
                  {{ inactivePercent }}%
                </VChip>
              </div>
              <div class="text-h3 font-weight-bold mb-1">
                {{ inactive }}
              </div>
              <div class="text-body-1 text-medium-emphasis">
                Không hoạt động
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

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
