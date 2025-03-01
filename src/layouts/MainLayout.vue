<template>
  <q-layout view="hHh lpR fFf">

    <q-header reveal bordered class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          Title
        </q-toolbar-title>

        <q-btn dense flat round icon="apps" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <q-list>
        <q-item-label header>{{ moduleLabel }}</q-item-label>
        <EssentialLink v-for="link in filteredAllRoutes" :key="link.title" v-bind="link" />
      </q-list>
      <pre>{{ filteredAllRoutes }}</pre>
    </q-drawer>


    <q-drawer v-model="rightDrawerOpen" side="right" overlay bordered show-if-above :mini="miniState"
      @mouseenter="miniState = false" @mouseleave="miniState = true" :width="200" :breakpoint="500"
      class="bg-primary text-white" persistent>
      <q-list>
        <q-item v-for="moduleItem in modules" :key="moduleItem.name" clickable :to="moduleItem.path"
          :active="moduleItem.path === '/' ? $route.path === '/' : $route.path.startsWith(moduleItem.path)"
          active-class="bg-secondary"
          @click="changeMenu(moduleItem.path, moduleItem.label, moduleItem.name as ModuleName)">
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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
}

const miniState = ref(true);

const route = useRoute()

// Initialize with current route
const getCurrentModule = (): Module | undefined => {
  if (route.path === '/') {
    return modules[0] // home module
  }
  // Find the module with the longest matching path
  const matchedModules = modules
    .filter(m => m.path !== '/' && route.path.startsWith(m.path))
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
  }
)

const filteredAllRoutes = computed(() => {
  return allRoutes.filter(item => item.meta.module === module.value)
})

function changeMenu(path: string, label: string, name: ModuleName) {
  moduleLabel.value = label;
  module.value = name;
}
</script>
