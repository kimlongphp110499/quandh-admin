import type { RouteNamedMap, _RouterTyped } from 'unplugin-vue-router'
// eslint-disable-next-line import/no-unresolved
import { canNavigate } from '@layouts/plugins/casl'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useCookie } from '@/@core/utils/cookie'
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useAuthStore } from '@/store/modules/auth'

export const setupGuards = (router: _RouterTyped<RouteNamedMap & { [key: string]: any }>) => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(to => {
    /*
     * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
     * Examples of public routes are, 404, under maintenance, etc.
     */
    if (to.meta.public)
      return

    /**
     * Check if user is logged in by:
     * 1. authStore.isAuthenticated — reliable immediately after login (in-memory)
     * 2. accessToken cookie — reliable on page refresh
     * Note: userData cookie is NOT checked here as it may be too large and silently fail to persist.
     */
    const authStore = useAuthStore()
    const isLoggedIn = authStore.isAuthenticated || !!(useCookie('accessToken').value)

    /*
      If user is logged in and is trying to access login like page, redirect to home
      else allow visiting the page
      (WARN: Don't allow executing further by return statement because next code will check for permissions)
     */
    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn)
        return '/'
      else
        return undefined
    }

    if (!isLoggedIn) {
      return {
        name: 'login',
        query: {
          ...to.query,
          to: to.fullPath !== '/' ? to.path : undefined,
        },
      }
    }

    if (!canNavigate(to) && to.matched.length) {
      /* eslint-disable indent */
      return isLoggedIn
        ? { name: 'not-authorized' }
        : {
            name: 'login',
            query: {
              ...to.query,
              to: to.fullPath !== '/' ? to.path : undefined,
            },
          }
      /* eslint-enable indent */
    }
  })
}
