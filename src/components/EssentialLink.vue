<template>
  <q-separator v-if="subheader" style="height: 5px" />
  <q-item-label
    v-if="subheader"
    header
    class="q-pb-xs q-pt-md"
    style="font-size: 10px; text-transform: uppercase; font-weight: bold"
    >{{ subheader }}</q-item-label
  >
  <q-item
    :to="{ name: name || '', path: path || '' }"
    :active-class="link ? 'text-primary' : ''"
    clickable
    dense
    v-ripple
  >
    <q-item-section v-if="icon" side> <q-icon :name="icon" style="width: 12px" /> </q-item-section>
    <q-item-section>
      <q-item-label style="font-size: 13px">{{ title }}</q-item-label>
      <q-item-label v-if="caption" caption style="font-size: 11px">{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'

interface RouteMeta {
  title?: string
  icon?: string
  requiresAuth?: boolean
  [key: string]: unknown
}

interface Props {
  title: string
  caption?: string | undefined
  link?: string | undefined
  icon?: string | undefined
  path?: string | undefined
  name?: string | undefined
  component?: RouteRecordRaw['component'] | undefined
  meta?: RouteMeta | undefined
  subheader?: string | undefined
}

withDefaults(defineProps<Props>(), {
  caption: '',
  link: '#',
  icon: '',
  path: '',
  name: '',
  component: () => undefined,
  meta: () => ({}),
  subheader: '',
})
</script>
