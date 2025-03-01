import type { ModuleName } from 'src/config/modules'

const moduleType: ModuleName = 'accounting'

const accountingRoutes = [
  {
    path: '/accounting',
    name: 'accounting-dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    component: () => import('src/pages/accounting/AccountingDashboard.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Accounting Dashboard' },
  },
  {
    path: '/accounting/coa',
    name: 'chart-of-accounts',
    title: 'Chart of Accounts',
    icon: 'list_alt',
    component: () => import('src/pages/accounting/ChartOfAccounts.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Chart of Accounts' },
  },
]

export default accountingRoutes
