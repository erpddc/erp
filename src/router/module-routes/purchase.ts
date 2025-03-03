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
    meta: { requiresAuth: true, module: moduleType, title: 'Vendoers & Suppliers' },
  },
]

export default purchaseRoutes
