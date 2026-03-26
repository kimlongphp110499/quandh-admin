import { createMongoAbility } from '@casl/ability'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'

// ex: Meeting, Document, Post, User, etc.
export type Subjects = 'Meeting' | 'Document' | 'Post' | 'User' | 'Role' | 'Permission' | 'all'

export interface Rule { action: Actions; subject: Subjects }

export const ability = createMongoAbility<[Actions, Subjects]>()
