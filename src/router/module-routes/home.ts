import type { ModuleName } from 'src/config/modules'

const moduleType: ModuleName = 'home'

const homeRoutes = [
  {
    path: '/',
    name: 'home',
    title: 'Main Dashboard',
    icon: 'home',
    component: () => import('src/pages/IndexPage.vue'),
    meta: { requiresAuth: true, module: moduleType },
  },
  {
    path: 'settings',
    name: 'settings',
    title: 'Settings',
    icon: 'settings',
    component: () => import('src/pages/setup/SettingPage.vue'),
    meta: { requiresAuth: true, module: moduleType },
  },
]

export default homeRoutes
