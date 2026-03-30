<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCookie } from '@/@core/utils/cookie'

const router = useRouter()

const userData = computed(() => {
  const data = useCookie('userData').value
  if (!data)
    return null
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  }
  catch {
    return data
  }
})

const handleLogout = () => {
  // Xóa cookies
  useCookie('accessToken').value = null
  useCookie('userData').value = null
  useCookie('userAbilityRules').value = null

  // Redirect về login
  router.push('/login')
}
</script>

<template>
  <div>
    <VCard
      class="mb-6"
      title="Chào mừng đến với Quandh Admin 🚀"
    />

    <VCard title="Hệ thống quản trị">
      <VCardText>
        Bạn đã đăng nhập thành công vào hệ thống quản trị Quandh.
      </VCardText>
      <VCardText>
        Sử dụng menu bên trái để điều hướng đến các chức năng của hệ thống.
      </VCardText>
    </VCard>
  </div>
</template>
