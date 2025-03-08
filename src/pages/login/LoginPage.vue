<template>
  <div class="erp" :style="`transform: translate(-50%, ${yt});`">ERP</div>
  <div class="login-container">
    <form @submit.prevent="handleLogin" class="login-form text-center bg-white">

      <img src="/public/ddc.svg" alt="DDC Logo" style="width: 75%; margin: 30px auto;">
      <div class="form-group text-left">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group left">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <div class="form-group left">
        <label for="fiscalYear">Fiscal Year</label>
        <select id="fiscalYear" v-model="selectedFiscalYear" required class="fiscal-select">
          <option v-for="fy in fiscalYears" :key="fy.ID" :value="fy">
            {{ fy.NAME }}
          </option>
        </select>
      </div>
      <button type="submit" :disabled="authStore.loading || !selectedFiscalYear">
        {{ authStore.loading ? 'Loading...' : 'Login' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { Notify, useMeta } from 'quasar'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import type { Fiscal } from 'src/models/Fiscal'

const $q = useQuasar()
console.log($q)

const yt = ref('-25%');
if ($q.screen.lg) yt.value = '0%'

useMeta({
  title: 'Login | ERP.DDC'
})

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const fiscalYears = ref<Fiscal[]>([])
const selectedFiscalYear = ref<Fiscal | null>(null)

onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('FISCALS')
      .select('*')
      .order('START_DATE', { ascending: false })

    if (error) throw error
    fiscalYears.value = data

    // Select the active fiscal year by default (you might need to adjust this based on your actual data structure)
    const activeFY = data[0] // or implement your own logic to determine active fiscal year
    if (activeFY) {
      selectedFiscalYear.value = activeFY
    }
  } catch (error) {
    console.error('Error fetching fiscal years:', error)
    Notify.create({
      type: 'negative',
      message: 'Failed to load fiscal years',
      position: 'top'
    })
  }
})

const handleLogin = async () => {
  if (!selectedFiscalYear.value) {
    Notify.create({
      type: 'negative',
      message: 'Please select a fiscal year',
      position: 'top'
    })
    return
  }

  try {
    await authStore.signIn(email.value, password.value, selectedFiscalYear.value)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed'
    Notify.create({
      type: 'negative',
      message: errorMessage,
      position: 'top'
    })
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login-form {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
}

.erp {
  position: absolute;
  z-index: -1;
  color: #efefef;
  font-size: 300px;
  left: 50%;
  transform: translate(-50%, -25%);
  font-weight: 900;
}

.fiscal-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}
</style>
