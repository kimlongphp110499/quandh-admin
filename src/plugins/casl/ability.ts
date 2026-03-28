import { createMongoAbility } from '@casl/ability'

// CRUD-style actions + Laravel resource actions (index, store, show, update, destroy)
export type Actions =
  | 'create' | 'read' | 'update' | 'delete' | 'manage'
  | 'index' | 'store' | 'show' | 'destroy'

export type Subjects = string

export interface Rule { action: Actions; subject: Subjects }

export const ability = createMongoAbility<[Actions, Subjects]>()
