import type { ModuleName } from 'src/config/modules'

const moduleType: ModuleName = 'sales'

const salesRoutes = [
  {
    path: '/sales',
    name: 'sales-dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    component: () => import('src/pages/sales/SalesDashboard.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'sales Dashboard' },
  },
  {
    path: '/sales/customers',
    name: 'customers',
    title: 'Customers',
    icon: 'group',
    component: () => import('src/pages/sales/CustomersPage.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Customers' },
  },
]

export default salesRoutes
