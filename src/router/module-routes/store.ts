import type { ModuleName } from 'src/config/modules'

const moduleType: ModuleName = 'store'

const storeRoutes = [
  {
    path: '/store',
    name: 'store-dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    component: () => import('src/pages/store/StoreDashboard.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Store Dashboard' },
  },
]

export default storeRoutes
