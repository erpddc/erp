// export type TRouterItem = {
//   path: string
//   name: string
//   title: string
//   icon?: string
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   component: any
//   meta?: {
//     requiresAuth: boolean
//     module: string
//   }
// }

// export type TMenuItem = Omit<TRouterItem, 'component'>

import type { ModuleName } from 'src/config/modules'

type RouteMeta = {
  requiresAuth: boolean
  module: ModuleName
  title?: string
  display?: boolean
}

export type TRoute = {
  path: string
  name: string
  title: string
  icon: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: () => Promise<any> // Vue component import returns a Promise
  meta: RouteMeta
}
