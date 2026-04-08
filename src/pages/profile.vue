<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import avatar1 from '@images/avatars/avatar-1.png'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useAuthStore } from '@/store/modules/auth'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useSettingStore } from '@/store/modules/setting'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { organizationApi } from '@/api/modules/organization'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useCookie } from '@/@core/utils/cookie'

const authStore = useAuthStore()
const settingStore = useSettingStore()
const router = useRouter()

const adminSettings = computed(() => settingStore.settings.admin_page ?? {})
const generalSettings = computed(() => settingStore.settings.general ?? {})
const orgSelectPage = computed(() => settingStore.settings.org_select_page ?? {})
const appName = computed(() => (adminSettings.value as any).admin_logo_title || (adminSettings.value as any).admin_app_name || 'Hệ thống quản trị')
const logoUrl = computed(() => (generalSettings.value as any).logo || '')
const orgSelectTitle = computed(() => (orgSelectPage.value as any).org_select_title || '')
const orgSelectDescription = computed(() => (orgSelectPage.value as any).org_select_description || '')

const userName = computed(() => authStore.user?.name || 'Người dùng')
const userEmail = computed(() => authStore.user?.email || '')
const userRoles = computed(() => authStore.userRoles)
const userPermissions = computed(() => authStore.userPermissions)

const activeTab = ref('roles')
const snackbar = ref({ show: false, message: '', color: 'success' })

// Form chỉnh sửa thông tin cơ bản
const profileForm = reactive({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
})

// Sync form khi user data load xong
watch(() => authStore.user, user => {
  if (user) {
    profileForm.name = user.name || ''
    profileForm.email = user.email || ''
  }
})

onMounted(async () => {
  await authStore.fetchUser()

  // Lấy đúng tên tổ chức hiện tại từ API (fallback sang cookie nếu fetchUser không trả về orgId)
  const orgId = authStore.currentOrganizationId
    ?? (Number(useCookie('organizationId').value) || null)

  if (orgId) {
    try {
      const res = await organizationApi.show(orgId)
      if (res.data.success && res.data.data?.name) {
        authStore.currentOrganizationName = res.data.data.name
        localStorage.setItem('currentOrganizationName', res.data.data.name)
      }
    }
    catch (e) {
      console.error('Lấy tên tổ chức thất bại:', e)
    }
  }
})

const profileError = ref('')

// Group permissions theo module
const groupedPermissions = computed(() => {
  const groups: Record<string, string[]> = {}

  userPermissions.value.forEach((perm: string) => {
    const [module] = perm.split('.')

    if (!groups[module])
      groups[module] = []

    groups[module].push(perm)
  })

  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
})

const isSwitchingOrg = ref(false)
const switchError = ref('')
const showSwitchOrgDialog = ref(false)
const selectedOrgId = ref<number | null>(null)

async function openSwitchOrgDialog() {
  switchError.value = ''
  selectedOrgId.value = authStore.currentOrganizationId ?? null
  showSwitchOrgDialog.value = true
  try {
    const res = await organizationApi.publicOptions()
    if (res.data.success && res.data.data) {
      const freshNames = new Map(res.data.data.map((o: { id: number; name: string }) => [o.id, o.name]))
      authStore.availableOrganizations.splice(
        0,
        authStore.availableOrganizations.length,
        ...authStore.availableOrganizations.map((org: any) => ({
          ...org,
          name: freshNames.get(org.id) ?? org.name,
        })),
      )
    }
  }
  catch {}
}

async function handleSwitchOrg() {
  if (!selectedOrgId.value || selectedOrgId.value === authStore.currentOrganizationId)
    return

  try {
    isSwitchingOrg.value = true
    switchError.value = ''

    const orgName = authStore.availableOrganizations.find(o => o.id === selectedOrgId.value)?.name ?? null

    await authStore.switchOrganization(selectedOrgId.value)

    // Gán tên tổ chức mới ngay lập tức, tránh bị fetchUser ghi đè
    if (orgName) {
      authStore.currentOrganizationName = orgName
      localStorage.setItem('currentOrganizationName', orgName)
    }

    showSwitchOrgDialog.value = false
    snackbar.value = { show: true, message: 'Đã chuyển tổ chức làm việc.', color: 'success' }

    setTimeout(() => router.push('/'), 800)
  }
  catch (err: any) {
    switchError.value = err.response?.data?.message || 'Chuyển tổ chức thất bại.'
  }
  finally {
    isSwitchingOrg.value = false
  }
}

function getModuleName(module: string): string {
  const names: Record<string, string> = {
    'users': 'Người dùng',
    'roles': 'Vai trò',
    'permissions': 'Quyền hạn',
    'organizations': 'Tổ chức',
    'posts': 'Bài viết',
    'settings': 'Cài đặt',
    'log-activities': 'Nhật ký',
    'document-fields': 'Lĩnh vực',
    'document-types': 'Loại văn bản',
    'document-signers': 'Người ký',
    'documents': 'Văn bản',
    'issuing-agencies': 'Cơ quan ban hành',
    'issuing-levels': 'Cơ quan ban hành',
  }

  return names[module] || module
}

function getActionName(action: string): string {
  const names: Record<string, string> = {
    stats: 'Xem thống kê',
    index: 'Xem danh sách',
    show: 'Xem chi tiết',
    store: 'Tạo mới',
    create: 'Tạo mới',
    update: 'Cập nhật',
    destroy: 'Xóa',
    delete: 'Xóa',
    read: 'Đọc',
    manage: 'Quản lý',
  }

  return names[action] || action
}
</script>

<template>
  <VRow>
    <!-- Cột trái: thông tin + chỉnh sửa -->
    <VCol
      cols="12"
      md="4"
    >
      <!-- Avatar & tên -->
      <VCard class="mb-6">
        <VCardText class="d-flex flex-column align-center text-center pt-8 pb-6">
          <VAvatar
            color="primary"
            variant="tonal"
            size="96"
            class="mb-4"
          >
            <VImg :src="avatar1" />
          </VAvatar>

          <h5 class="text-h5 mb-1">
            {{ userName }}
          </h5>
          <div class="text-body-2 text-medium-emphasis mb-3">
            {{ userEmail }}
          </div>

          <div class="d-flex gap-2 flex-wrap justify-center mb-3">
            <VChip
              v-for="role in userRoles"
              :key="role"
              color="primary"
              size="small"
              label
            >
              {{ role }}
            </VChip>
          </div>

          <div
            v-if="authStore.currentOrganizationDisplayName"
            class="d-flex align-center gap-1 text-body-2 text-medium-emphasis mb-4"
          >
            <VIcon
              icon="tabler-building"
              size="16"
            />
            {{ authStore.currentOrganizationDisplayName }}
          </div>

          <VBtn
            v-if="authStore.availableOrganizations.length >= 1"
            variant="tonal"
            color="primary"
            size="small"
            prepend-icon="tabler-building-community"
            @click="openSwitchOrgDialog"
          >
            Đổi tổ chức
          </VBtn>
        </VCardText>
      </VCard>

      <!-- Chỉnh sửa thông tin cơ bản -->
      <VCard class="mb-6">
        <VCardTitle class="pa-5 pb-3 text-subtitle-1">
          <VIcon
            icon="tabler-user-edit"
            size="18"
            class="me-2"
          />
          Thông tin cá nhân
        </VCardTitle>

        <VCardText>
          <VAlert
            v-if="profileError"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="profileError = ''"
          >
            {{ profileError }}
          </VAlert>

          <div class="d-flex flex-column gap-4">
            <AppTextField
              v-model="profileForm.name"
              label="Họ và tên"
              prepend-inner-icon="tabler-user"
            />
            <AppTextField
              v-model="profileForm.email"
              label="Email"
              type="email"
              prepend-inner-icon="tabler-mail"
            />
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Cột phải: tổ chức + vai trò + quyền hạn (chỉ xem) -->
    <VCol
      cols="12"
      md="8"
    >
      <!-- Vai trò & quyền hạn (chỉ xem) -->
      <VCard>
        <VTabs
          v-model="activeTab"
          color="primary"
        >
          <VTab value="roles">
            <VIcon
              icon="tabler-user-shield"
              start
            />
            Vai trò
          </VTab>
          <VTab value="permissions">
            <VIcon
              icon="tabler-key"
              start
            />
            Quyền hạn
          </VTab>
        </VTabs>

        <VDivider />

        <VWindow v-model="activeTab">
          <!-- Tab Vai trò -->
          <VWindowItem value="roles">
            <VCardText>
              <div
                v-if="userRoles.length"
                class="d-flex gap-3 flex-wrap"
              >
                <VCard
                  v-for="role in userRoles"
                  :key="role"
                  variant="tonal"
                  color="success"
                >
                  <VCardText class="d-flex align-center gap-3 py-3 px-4">
                    <VAvatar
                      color="success"
                      variant="tonal"
                      size="36"
                    >
                      <VIcon icon="tabler-user-shield" />
                    </VAvatar>
                    <span class="font-weight-semibold">{{ role }}</span>
                  </VCardText>
                </VCard>
              </div>
              <div
                v-else
                class="text-center text-medium-emphasis py-6"
              >
                <VIcon
                  icon="tabler-user-off"
                  size="48"
                  class="mb-2"
                />
                <div>Không có vai trò</div>
              </div>
            </VCardText>
          </VWindowItem>

          <!-- Tab Quyền hạn -->
          <VWindowItem value="permissions">
            <VCardText>
              <div
                v-if="groupedPermissions.length"
                class="d-flex flex-column gap-4"
              >
                <div
                  v-for="[module, perms] in groupedPermissions"
                  :key="module"
                >
                  <div class="d-flex align-center gap-2 mb-2">
                    <VIcon
                      icon="tabler-folder"
                      size="18"
                      color="primary"
                    />
                    <span class="text-subtitle-2 font-weight-semibold">
                      {{ getModuleName(module) }}
                    </span>
                    <VChip
                      size="x-small"
                      color="primary"
                      variant="tonal"
                    >
                      {{ perms.length }}
                    </VChip>
                  </div>
                  <div class="d-flex gap-2 flex-wrap ms-6">
                    <VChip
                      v-for="perm in perms"
                      :key="perm"
                      size="small"
                      variant="outlined"
                      color="primary"
                    >
                      {{ getActionName(perm.split('.')[1] || perm) }}
                    </VChip>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="text-center text-medium-emphasis py-6"
              >
                <VIcon
                  icon="tabler-key-off"
                  size="48"
                  class="mb-2"
                />
                <div>Không có quyền hạn</div>
              </div>
            </VCardText>
          </VWindowItem>
        </VWindow>
      </VCard>
    </VCol>
  </VRow>

  <!-- Dialog đổi tổ chức -->
  <VDialog
    v-model="showSwitchOrgDialog"
    max-width="480"
    persistent
  >
    <VCard>
      <VCardTitle class="pt-6 px-6">
        <div class="d-flex align-center justify-center gap-3 mb-3">
          <VAvatar
            size="48"
            color="primary"
            variant="tonal"
            rounded
          >
            <VIcon
              icon="tabler-building-community"
              size="24"
            />
          </VAvatar>
        </div>
        <div class="text-h4 text-center">
          Chuyển đổi tổ chức
        </div>
      </VCardTitle>

      <VDivider class="mt-4" />

      <VCardText class="px-6 pt-4">
        <VAlert
          v-if="switchError"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="switchError = ''"
        >
          {{ switchError }}
        </VAlert>

        <div class="d-flex flex-column gap-2">
          <VCard
            v-for="org in authStore.availableOrganizations"
            :key="org.id"
            :variant="selectedOrgId === org.id ? 'tonal' : 'outlined'"
            :color="selectedOrgId === org.id ? 'primary' : undefined"
            class="cursor-pointer"
            @click="selectedOrgId = org.id"
          >
            <VCardText class="d-flex align-center gap-3 py-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="36"
                rounded
              >
                <VIcon
                  icon="tabler-building"
                  size="18"
                />
              </VAvatar>
              <span class="font-weight-medium">{{ org.name }}</span>
              <VSpacer />
              <VIcon
                v-if="selectedOrgId === org.id"
                icon="tabler-circle-check-filled"
                color="primary"
                size="20"
              />
            </VCardText>
          </VCard>
        </div>
      </VCardText>

      <VCardActions class="px-6 pb-6 pt-2 d-flex flex-column gap-2">
        <VBtn
          block
          size="large"
          :loading="isSwitchingOrg"
          :disabled="isSwitchingOrg || !selectedOrgId || selectedOrgId === authStore.currentOrganizationId"
          @click="handleSwitchOrg"
        >
          Vào hệ thống
        </VBtn>
        <VBtn
          block
          variant="tonal"
          color="secondary"
          :disabled="isSwitchingOrg"
          @click="showSwitchOrgDialog = false"
        >
          Đóng
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Snackbar -->
  <VSnackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    location="top end"
    :timeout="3000"
  >
    {{ snackbar.message }}
  </VSnackbar>
</template>
