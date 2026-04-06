<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useConfigStore } from '@core/stores/config'
import { AppContentLayoutNav } from '@layouts/enums'

const isNavDrawerOpen = ref(false)

const configStore = useConfigStore()

// 👉 Primary Color
const vuetifyTheme = useTheme()

const colors: { main: string; darken: string }[] = [
  { main: '#5e35b1', darken: '#512da8' },
  { main: '#0D9394', darken: '#0C8485' },
  { main: '#FFB400', darken: '#E6A200' },
  { main: '#FF4C51', darken: '#E64449' },
  { main: '#16B1FF', darken: '#149FE6' },
]

const customPrimaryColor = ref('#663131')

// 👉 Mode
const theme = ref('light')
const themeMode = computed(() => {
  return [
    {
      icon: 'tabler-sun',
      value: 'light',
      label: 'Light',
    },
    {
      icon: 'tabler-moon-stars',
      value: 'dark',
      label: 'Dark',
    },
  ]
})

// 👉 Skin
const skin = ref('default')
const themeSkin = computed(() => {
  return [
    {
      value: 'default',
      label: 'Default',
    },
    {
      value: 'bordered',
      label: 'Bordered',
    },
  ]
})

// 👉 Layout — sync với configStore.appContentLayoutNav
const layout = ref(configStore.appContentLayoutNav)
const layouts = computed(() => {
  return [
    {
      icon: 'tabler-layout-sidebar-left-collapse',
      value: 'vertical',
      label: 'Vertical',
    },
    {
      icon: 'tabler-layout-navbar',
      value: 'horizontal',
      label: 'Horizontal',
    },
  ]
})

// 👉 Direction
const direction = ref('ltr')
const directionOptions = computed(() => {
  return [
    {
      icon: 'tabler-arrow-left',
      value: 'ltr',
      label: 'LTR',
    },
    {
      icon: 'tabler-arrow-right',
      value: 'rtl',
      label: 'RTL',
    },
  ]
})

const setPrimaryColor = (color: { main: string; darken: string }) => {
  vuetifyTheme.themes.value.light.colors.primary = color.main
  vuetifyTheme.themes.value.dark.colors.primary = color.main
}

const resetCustomizer = async () => {
  theme.value = 'light'
  skin.value = 'default'
  layout.value = AppContentLayoutNav.Vertical
  direction.value = 'ltr'
  customPrimaryColor.value = '#5e35b1'
  setPrimaryColor({ main: '#5e35b1', darken: '#512da8' })

  await nextTick()
}

watch(
  () => theme.value,
  (newTheme) => {
    vuetifyTheme.global.name.value = newTheme === 'dark' ? 'dark' : 'light'
  },
)

watch(
  () => direction.value,
  (newDirection) => {
    document.documentElement.dir = newDirection
  },
)

watch(
  () => layout.value,
  (newLayout) => {
    configStore.appContentLayoutNav = newLayout === 'horizontal'
      ? AppContentLayoutNav.Horizontal
      : AppContentLayoutNav.Vertical
  },
)
</script>

<template>
  <div>
    <!-- Settings Button -->
    <VBtn
      icon
      class="app-customizer-toggler"
      style="position: fixed; z-index: 1001; right: 0; top: 20%;"
      @click="isNavDrawerOpen = true"
    >
      <VIcon
        size="22"
        icon="tabler-settings"
      />
    </VBtn>

    <!-- Customizer Drawer -->
    <VNavigationDrawer
      v-model="isNavDrawerOpen"
      temporary
      touchless
      border="none"
      location="end"
      width="400"
      elevation="10"
      :scrim="false"
      class="app-customizer"
    >
      <!-- Header -->
      <div class="d-flex align-center justify-space-between pa-6">
        <div>
          <h6 class="text-h6">Theme Customizer</h6>
          <p class="text-body-2 mb-0">Customize & Preview in Real Time</p>
        </div>

        <div class="d-flex align-center gap-1">
          <VBtn
            icon
            variant="text"
            size="small"
            @click="resetCustomizer"
          >
            <VIcon icon="tabler-refresh" />
          </VBtn>

          <VBtn
            icon
            variant="text"
            size="small"
            @click="isNavDrawerOpen = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- Content -->
      <div class="pa-6 overflow-y-auto" style="max-height: calc(100vh - 120px);">
        <!-- Primary Color -->
        <div class="mb-6">
          <h6 class="text-h6 mb-3">Primary Color</h6>
          <div class="d-flex gap-2 flex-wrap">
            <div
              v-for="color in colors"
              :key="color.main"
              class="cursor-pointer"
              style="
                width: 50px;
                height: 50px;
                border-radius: 4px;
                border: 2px solid;
                border-color: rgba(var(--v-border-color), var(--v-border-opacity));
              "
              :style="{
                'border-color': vuetifyTheme.current.value.colors.primary === color.main ? color.main : 'rgba(var(--v-border-color), var(--v-border-opacity))',
                'border-width': vuetifyTheme.current.value.colors.primary === color.main ? '3px' : '2px',
                backgroundColor: color.main,
              }"
              @click="setPrimaryColor(color)"
            />
            <VMenu activator="parent">
              <VColorPicker
                v-model="customPrimaryColor"
                mode="hex"
                @update:model-value="setPrimaryColor({ main: customPrimaryColor, darken: customPrimaryColor })"
              />
            </VMenu>
          </div>
        </div>

        <!-- Theme Mode -->
        <div class="mb-6">
          <h6 class="text-h6 mb-3">Theme</h6>
          <div class="d-flex gap-2">
            <VBtn
              v-for="mode in themeMode"
              :key="mode.value"
              variant="outlined"
              class="flex-grow-1"
              :color="theme === mode.value ? 'primary' : 'default'"
              @click="theme = mode.value"
            >
              <VIcon :icon="mode.icon" class="me-2" />
              {{ mode.label }}
            </VBtn>
          </div>
        </div>

        <!-- Skin -->
        <div class="mb-6">
          <h6 class="text-h6 mb-3">Skins</h6>
          <div class="d-flex gap-2">
            <VBtn
              v-for="s in themeSkin"
              :key="s.value"
              variant="outlined"
              class="flex-grow-1"
              :color="skin === s.value ? 'primary' : 'default'"
              @click="skin = s.value"
            >
              {{ s.label }}
            </VBtn>
          </div>
        </div>

        <!-- Layout -->
        <div class="mb-6">
          <h6 class="text-h6 mb-3">Layout</h6>
          <div class="d-flex gap-2">
            <VBtn
              v-for="l in layouts"
              :key="l.value"
              variant="outlined"
              class="flex-grow-1"
              :color="layout === l.value ? 'primary' : 'default'"
              @click="layout = l.value"
            >
              <VIcon :icon="l.icon" class="me-2" />
              {{ l.label }}
            </VBtn>
          </div>
        </div>

        <!-- Direction -->
        <div class="mb-6">
          <h6 class="text-h6 mb-3">Direction</h6>
          <div class="d-flex gap-2">
            <VBtn
              v-for="dir in directionOptions"
              :key="dir.value"
              variant="outlined"
              class="flex-grow-1"
              :color="direction === dir.value ? 'primary' : 'default'"
              @click="direction = dir.value"
            >
              <VIcon :icon="dir.icon" class="me-2" />
              {{ dir.label }}
            </VBtn>
          </div>
        </div>
      </div>
    </VNavigationDrawer>
  </div>
</template>

<style scoped>
.app-customizer-toggler {
  border-radius: 4px 0 0 4px !important;
}

.app-customizer {
  :deep(.v-navigation-drawer__content) {
    display: flex;
    flex-direction: column;
  }
}
</style>
