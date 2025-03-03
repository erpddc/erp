<template>
  <q-item :to="path" exact clickable dense v-ripple>
    <q-item-section v-if="icon" side class="q-pr-sm" style="min-width: 24px">
      <q-icon :name="icon" size="xs" />
    </q-item-section>
    <q-item-section>
      <q-item-label style="font-size: 13px">{{ title }}</q-item-label>
      <q-item-label v-if="caption" caption style="font-size: 11px">{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
export interface EssentialLinkProps {
  title: string
  caption?: string
  path?: string
  icon?: string
}

withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  path: '#',
  icon: '',
})
</script>
