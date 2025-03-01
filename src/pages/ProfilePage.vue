<template>
  <q-page padding>
    <div class="row justify-center">
      <div class="col-12 col-md-6">
        <q-card class="profile-card">
          <q-card-section>
            <div class="text-h6">Profile</div>
          </q-card-section>

          <q-card-section>
            <div class="row q-mb-md">
              <div class="col-12">
                <q-avatar size="100px" color="secondary" text-color="white">
                  {{ userInitial }}
                </q-avatar>
              </div>
            </div>

            <div class="row q-mb-md">
              <div class="col-12">
                <div class="text-subtitle2">Email</div>
                <div>{{ authStore.user?.email }}</div>
              </div>
            </div>

            <div class="row q-mb-md">
              <div class="col-12">
                <div class="text-subtitle2">User ID</div>
                <div>{{ authStore.user?.id }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useMeta } from 'quasar'

const authStore = useAuthStore()

useMeta({
  title: 'Profile | My App'
})

const userInitial = computed(() => {
  return authStore.user?.email?.charAt(0).toUpperCase() || '?'
})
</script>

<style scoped>
.profile-card {
  margin-top: 2rem;
}
</style>
