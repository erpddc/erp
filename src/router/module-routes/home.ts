import type { ModuleName } from 'src/config/modules'

const moduleType: ModuleName = 'home'

const homeRoutes = [
  {
    path: '/',
    name: 'home',
    title: 'Main Dashboard',
    icon: 'dashboard',
    component: () => import('src/pages/IndexPage.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Home' },
  },
  {
    path: 'projects',
    name: 'projects',
    title: 'DDC Projects',
    icon: 'factory',
    component: () => import('src/pages/setup/ProjectPage.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'DDC Projects' },
  },
  {
    path: 'banks',
    name: 'banks',
    title: 'Banks',
    icon: 'savings',
    component: () => import('src/pages/setup/BanksPage.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Banks used By DDC' },
  },
  {
    path: 'fiscals',
    name: 'fiscals',
    title: 'Fiscal Years',
    icon: 'calendar_month',
    component: () => import('src/pages/setup/SettingPage.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Fiscal Years' },
  },
  {
    path: 'settings',
    name: 'settings',
    title: 'Settings',
    icon: 'tune',
    component: () => import('src/pages/setup/SettingPage.vue'),
    meta: { requiresAuth: true, module: moduleType, title: 'Settings' },
  },
]

export default homeRoutes
