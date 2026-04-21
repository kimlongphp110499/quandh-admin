<script setup lang="ts">
import { useTheme } from 'vuetify'

const { global } = useTheme()

interface AuthProviderLink {
  icon: string
  color: string
  colorInDark?: string
  url?: string
}

const props = defineProps<{
  links?: AuthProviderLink[]
}>()

const defaultProviders: AuthProviderLink[] = [
  { icon: 'tabler-brand-facebook-filled', color: '#4267b2', colorInDark: '#497CE2' },
  { icon: 'tabler-brand-twitter-filled', color: '#1da1f2', colorInDark: '#1da1f2' },
  { icon: 'tabler-brand-github-filled', color: '#272727', colorInDark: '#fff' },
  { icon: 'tabler-brand-google-filled', color: '#dd4b39', colorInDark: '#db4437' },
]

const items = computed(() => props.links ?? defaultProviders)
</script>

<template>
  <div class="d-flex justify-center flex-wrap gap-1">
    <VBtn
      v-for="link in items"
      :key="link.icon"
      icon
      variant="text"
      size="small"
      :color="global.name.value === 'dark' ? (link.colorInDark ?? link.color) : link.color"
      v-bind="link.url ? { href: link.url, target: '_blank', rel: 'noopener', tag: 'a' } : {}"
    >
      <VIcon
        size="20"
        :icon="link.icon"
      />
    </VBtn>
  </div>
</template>
