<!-- eslint-disable import/extensions, import/no-unresolved -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import { organizationApi } from '@/api/modules/organization'
import { useCookie } from '@/@core/utils/cookie'
import AppSnackbar from '@/components/AppSnackbar.vue'
import AppSwitchOrgDialog from '@/components/AppSwitchOrgDialog.vue'
import ProfileBioPanel from '@/views/pages/user-profile/profile/ProfileBioPanel.vue'
import ProfileTabRoles from '@/views/pages/user-profile/profile/ProfileTabRoles.vue'

const authStore = useAuthStore()
const router = useRouter()

const userTab = ref(null)
const snackbar = ref({ show: false, message: '', color: 'success' })

const tabs = [
  { icon: 'tabler-user-shield', title: 'Vai trò & Quyền hạn' },
]

onMounted(async () => {
  await authStore.fetchUser()

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

// ── Đổi tổ chức ──────────────────────────────────────────────────
const isSwitchingOrg = ref(false)
const switchError = ref('')
const showSwitchOrgDialog = ref(false)

async function openSwitchOrgDialog() {
  switchError.value = ''
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

async function handleSwitchOrg(orgId: number) {
  try {
    isSwitchingOrg.value = true
    switchError.value = ''

    const orgName = authStore.availableOrganizations.find(o => o.id === orgId)?.name ?? null

    await authStore.switchOrganization(orgId)
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

function showToast(message: string, color: string) {
  snackbar.value = { show: true, message, color }
}
</script>

<template>
  <VRow>
    <!-- ── Cột trái: BioPanel ────────────────────────────────────── -->
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <ProfileBioPanel @switch-org="openSwitchOrgDialog" />
    </VCol>

    <!-- ── Cột phải: Tabs ────────────────────────────────────────── -->
    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VTabs
        v-model="userTab"
        class="v-tabs-pill"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.icon"
        >
          <VIcon
            :size="18"
            :icon="tab.icon"
            class="me-1"
          />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>

      <VWindow
        v-model="userTab"
        class="mt-6 disable-tab-transition"
        :touch="false"
      >
        <!-- Tab: Vai trò & Quyền hạn -->
        <VWindowItem>
          <ProfileTabRoles />
        </VWindowItem>
      </VWindow>
    </VCol>
  </VRow>

  <!-- ── Dialog đổi tổ chức ─────────────────────────────────────── -->
  <AppSwitchOrgDialog
    v-model="showSwitchOrgDialog"
    :loading="isSwitchingOrg"
    :error="switchError"
    @confirm="handleSwitchOrg"
  />

  <!-- ── Snackbar ──────────────────────────────────────────────── -->
  <AppSnackbar
    v-model="snackbar.show"
    :message="snackbar.message"
    :color="snackbar.color"
  />
</template>
