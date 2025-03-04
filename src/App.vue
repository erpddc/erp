<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthUser } from 'src/composables/useAuthUser'

const { initialize } = useAuthUser()

onMounted(async () => {
  await initialize()
})
</script>
