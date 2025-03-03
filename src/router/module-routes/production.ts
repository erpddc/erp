import type { ModuleName } from 'src/config/modules'

const moduleType: ModuleName = 'production'

const productionRoutes = [
  {
    path: '/production',
    name: 'production-dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    component: () => import('src/pages/production/ProductionDashboard.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Production Dashboard' },
  },
]

export default productionRoutes
