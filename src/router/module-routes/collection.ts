import type { ModuleName } from 'src/config/modules'

const moduleType: ModuleName = 'collection'

const collectionRoutes = [
  {
    path: '/collection',
    name: 'collection-dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    component: () => import('src/pages/collection/CollectionDashboard.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Collection Dashboard' },
  },
]

export default collectionRoutes
