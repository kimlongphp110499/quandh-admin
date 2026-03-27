import type { App } from 'vue'

import { abilitiesPlugin } from '@casl/vue'
import { ability, type Rule } from './ability'

export default function (app: App) {
  // Đọc từ localStorage khi reload trang (cookie bị truncate do vượt 4KB)
  try {
    const raw = localStorage.getItem('userAbilityRules')
    const rules: Rule[] = raw ? JSON.parse(raw) : []
    if (rules.length)
      ability.update(rules)
  }
  catch {
    // ignore parse errors
    localStorage.removeItem('userAbilityRules')
  }

  app.use(abilitiesPlugin, ability, {
    useGlobalProperties: true,
  })
}
