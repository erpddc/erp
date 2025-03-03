import type { ModuleName } from 'src/config/modules'

const moduleType: ModuleName = 'hr'

const hrRoutes = [
  {
    path: '/hr',
    name: 'hr-dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    component: () => import('src/pages/hr/HrDashboard.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'hr Dashboard' },
  },
  {
    path: '/hr/employees',
    name: 'employees',
    title: 'Employees',
    icon: 'group',
    component: () => import('src/pages/hr/EmployeesPage.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'employees' },
  },
]

export default hrRoutes
