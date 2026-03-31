<script lang="ts" setup>
import { computed } from 'vue'
import navItems from '@/navigation/vertical'
import { themeConfig } from '@themeConfig'
import { layoutConfig } from '@themeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'

// @layouts plugin
import { VerticalNavLayout } from '@layouts'
import { useLayoutConfigStore } from '@layouts/stores/config'

// eslint-disable-next-line import/extensions
import { useSettingStore } from '@/store/modules/setting'

const settingStore = useSettingStore()
const configStore = useLayoutConfigStore()

const logoUrl = computed(() => settingStore.settings.general?.logo || '')
const appTitle = computed(() => settingStore.settings.admin_page?.admin_logo_title || settingStore.settings.admin_page?.admin_app_name || themeConfig.app.title)
</script>

<template>
  <VerticalNavLayout :nav-items="navItems">
    <!-- 👉 nav header: logo + title + pin actions -->
    <template #vertical-nav-header>
      <RouterLink
        to="/dashboard"
        class="app-logo app-title-wrapper"
      >
        <img
          v-if="logoUrl"
          :src="logoUrl"
          :alt="appTitle"
          style="block-size:28px;inline-size:auto;object-fit:contain;"
        >
        <span
          v-else
          style="color:rgb(var(--v-global-theme-primary));line-height:0;"
        >
          <VIcon
            icon="tabler-building-community"
            size="28"
          />
        </span>

        <Transition name="vertical-nav-app-title">
          <h1 class="app-logo-title">
            {{ appTitle }}
          </h1>
        </Transition>
      </RouterLink>

      <!-- Pin/Unpin/Close buttons -->
      <div class="header-action">
        <Component
          :is="layoutConfig.app.iconRenderer || 'div'"
          v-show="configStore.isVerticalNavCollapsed"
          class="d-none nav-unpin"
          :class="configStore.isVerticalNavCollapsed && 'd-lg-block'"
          v-bind="layoutConfig.icons.verticalNavUnPinned"
          @click="configStore.isVerticalNavCollapsed = !configStore.isVerticalNavCollapsed"
        />
        <Component
          :is="layoutConfig.app.iconRenderer || 'div'"
          v-show="!configStore.isVerticalNavCollapsed"
          class="d-none nav-pin"
          :class="!configStore.isVerticalNavCollapsed && 'd-lg-block'"
          v-bind="layoutConfig.icons.verticalNavPinned"
          @click="configStore.isVerticalNavCollapsed = !configStore.isVerticalNavCollapsed"
        />
      </div>
    </template>
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon
            size="26"
            icon="tabler-menu-2"
          />
        </IconBtn>

        <NavbarThemeSwitcher />

        <VSpacer />

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <UserProfile />
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <!-- <TheCustomizer /> -->
  </VerticalNavLayout>
</template>
