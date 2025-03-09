<template>
  <q-layout view="hHh lpR fFf">
    <q-header reveal bordered class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <img src="/ddc_white.png" style="width: 50px; height: auto; margin-right: 30px" />
          <span
            style="
              color: #f4ebd0;
              font-size: 14px;
              text-transform: uppercase;
              font-weight: bold;
              letter-spacing: 2px;
            "
            >{{ route.meta.title || APP_NAME }}</span
          >
        </q-toolbar-title>

        <q-btn flat dense class="bg-secondary q-px-sm text-white rounded-borders q-mr-md">
          <div class="row items-center">
            <q-icon name="event" class="q-mr-xs" />
            <span>{{ authStore.currentFiscalYear?.NAME || 'No FY Selected' }}</span>
          </div>
        </q-btn>

        <q-btn flat dense class="bg-secondary q-px-sm text-white rounded-borders q-mr-md">
          <div class="row items-center">
            <q-icon name="business" class="q-mr-xs" />
            <span>{{ authStore.currentProject?.NAME || 'No Project Selected' }}</span>
          </div>
        </q-btn>

        <q-btn-dropdown flat dense class="bg-secondary q-px-sm text-white rounded-borders q-mr-md">
          <template v-slot:label>
            <q-avatar size="20px" color="accent" text-color="white">
              {{ userInitial }}
            </q-avatar>
          </template>

          <q-list>
            <q-item clickable v-close-popup @click="navigateToProfile">
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>Profile</q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-close-popup @click="handleLogout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>Logout</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>

        <q-btn dense flat round icon="apps" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer
      show-if-above
      v-model="leftDrawerOpen"
      side="left"
      bordered
      :width="200"
      class="custom-drawer q-pb-lg"
    >
      <q-list dense separator class="q-py-none">
        <q-item-label header class="q-py-sm">{{ moduleLabel }}</q-item-label>
        <EssentialLink v-for="link in filteredAllRoutes" :key="link.title" v-bind="link" />
      </q-list>
      <!-- {{ filteredAllRoutes }} -->
    </q-drawer>

    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      bordered
      show-if-above
      :mini="miniState"
      @mouseenter="miniState = false"
      @mouseleave="miniState = true"
      :width="200"
      :breakpoint="500"
      class="bg-primary text-white"
      persistent
    >
      <q-list>
        <q-item
          v-for="moduleItem in modules"
          :key="moduleItem.name"
          clickable
          :to="moduleItem.path"
          :active="
            moduleItem.path === '/' ? $route.path === '/' : $route.path.startsWith(moduleItem.path)
          "
          active-class="bg-secondary text-white"
          @click="changeMenu(moduleItem.path, moduleItem.label, moduleItem.name as ModuleName)"
        >
          <q-item-section avatar>
            <q-icon :name="moduleItem.icon" />
          </q-item-section>
          <q-item-section>
            {{ moduleItem.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import EssentialLink from 'src/components/EssentialLink.vue'
import allRoutes from 'src/router/module-routes/all'
import { modules } from 'src/config/modules'
import type { ModuleName, Module } from 'src/config/modules'
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useMeta } from 'quasar'

const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)
const authStore = useAuthStore()

// Initialize auth store when component is mounted
onMounted(async () => {
  await authStore.initialize()
})

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}

const miniState = ref(true)

const route = useRoute()
const router = useRouter()

// Initialize with current route
const getCurrentModule = (): Module | undefined => {
  if (route.path === '/') {
    return modules[0] // home module
  }
  // Find the module with the longest matching path
  const matchedModules = modules
    .filter((m) => m.path !== '/' && route.path.startsWith(m.path))
    .sort((a, b) => b.path.length - a.path.length)

  return matchedModules.length > 0 ? matchedModules[0] : modules[0]
}

const currentModule = getCurrentModule()
const moduleLabel = ref(currentModule?.label ?? 'Home / Setup')
const module = ref<ModuleName>(currentModule?.name ?? 'home')

// Watch for route changes
watch(
  () => route.path,
  () => {
    const newModule = getCurrentModule()
    moduleLabel.value = newModule?.label ?? 'Home / Setup'
    module.value = newModule?.name ?? 'home'
  },
)

const filteredAllRoutes = computed(() => {
  return allRoutes.filter(
    (item) => item.meta.module === module.value && item.meta.display !== false,
  )
})

function changeMenu(path: string, label: string, name: ModuleName) {
  moduleLabel.value = label
  module.value = name
}

const userInitial = computed(() => {
  return authStore.user?.email?.substring(0, 2).toUpperCase() || '?'
})

const navigateToProfile = async () => {
  await router.push('/profile')
}

const handleLogout = async () => {
  try {
    await authStore.signOut()
    await router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const APP_NAME = 'ERP.DDC'

// Setup meta
useMeta(() => {
  const title = route.meta.title as string
  return {
    // If there's a title in route meta, append it to app name, otherwise just use app name
    title: title ? `${title} - ${APP_NAME}` : APP_NAME,
  }
})
</script>

<style>
.custom-drawer {
  /* Hide scrollbar completely by default */
  &::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }

  /* Show thin scrollbar only on hover */
  &:hover {
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(144, 144, 144, 0.4);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: rgba(144, 144, 144, 0.6);
    }
  }

  /* For Firefox */
  scrollbar-width: none;

  &:hover {
    scrollbar-width: thin;
  }
}
</style>
