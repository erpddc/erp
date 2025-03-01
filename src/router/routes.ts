import type { RouteRecordRaw } from 'vue-router'
import allRoutes from './module-routes/all'

// const APP_NAME = 'ERP.DDC'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: {
      requiresAuth: true,
      title: 'Home',
    },
    children: [
      ...allRoutes,
      {
        path: 'profile',
        component: () => import('src/pages/ProfilePage.vue'),
        meta: {
          requiresAuth: true,
          title: 'Profile',
        },
      },
    ],
  },
  {
    path: '/login',
    component: () => import('layouts/LoginLayout.vue'),
    meta: {
      requiresAuth: false,
      title: 'Login',
    },
    children: [
      {
        path: '',
        component: () => import('src/pages/login/LoginPage.vue'),
        meta: {
          requiresAuth: false,
          title: 'Login',
        },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
    meta: {
      title: 'Page Not Found',
    },
  },
]

export default routes
