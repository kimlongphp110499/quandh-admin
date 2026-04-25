import { parse, serialize } from 'cookie-es'

/**
 * Cookie utility using cookie-es
 * Provides ref-like interface for cookie management
 */
export function useCookie<T = string>(key: string, options?: any) {
  return {
    get value(): T | null {
      if (typeof document === 'undefined')
        return null
      const cookies = parse(document.cookie)
      const value = cookies[key]
      if (!value)
        return null

      try {
        return JSON.parse(value) as T
      }
      catch {
        return value as T
      }
    },
    set value(val: T | null) {
      if (typeof document === 'undefined')
        return

      if (val === null || val === undefined) {
        // Remove cookie
        document.cookie = serialize(key, '', {
          ...options,
          maxAge: -1,
          path: '/',
        })
      }
      else {
        // Set cookie
        const stringValue = typeof val === 'string' ? val : JSON.stringify(val)

        document.cookie = serialize(key, stringValue, {
          ...options,
          path: '/',
          maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
        })
      }
    },
  }
}

/**
 * Set cookie value
 */
export function setCookie(key: string, value: any, options?: any) {
  const cookie = useCookie(key, options)

  cookie.value = value
}

/**
 * Get cookie value
 */
export function getCookie<T = string>(key: string): T | null {
  const cookie = useCookie<T>(key)

  return cookie.value
}

/**
 * Remove cookie
 */
export function removeCookie(key: string) {
  const cookie = useCookie(key)

  cookie.value = null
}
