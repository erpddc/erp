import type { ModuleName } from 'src/config/modules'

const moduleType: ModuleName = 'purchase'

const purchaseRoutes = [
  {
    path: '/purchase',
    name: 'purchase-dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    component: () => import('src/pages/purchase/PurchaseDashboard.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Purchase Dashboard' },
  },
  {
    path: '/purchase/vendors',
    name: 'purchase-vendors',
    title: 'Vendors & Suppliers',
    icon: 'groups',
    component: () => import('src/pages/purchase/VendorsSuppliers.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Vendors & Suppliers' },
  },
  {
    path: '/purchase/demand-form',
    name: 'purchase-demand-form',
    title: 'Demand Form',
    icon: 'groups',
    component: () => import('src/pages/purchase/ComingSoon.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Demand Form' },
  },
  {
    path: '/purchase/order',
    name: 'purchase-order',
    title: 'Purchase Order',
    icon: 'groups',
    component: () => import('src/pages/purchase/ComingSoon.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Purchase Order' },
  },
]

export default purchaseRoutes
