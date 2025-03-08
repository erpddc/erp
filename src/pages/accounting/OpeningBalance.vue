<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md items-center justify-end" style="width: 100%">
      <q-select v-model="visibleColumns" multiple outlined dense options-dense :options="columns.map((col) => col.name)"
        :display-value="$q.lang.table.columns" emit-value map-options options-cover style="min-width: 200px"
        class="q-mr-sm" />
      <q-btn color="primary" icon="add" label="New Opening Balance" @click="openModal()" />
    </div>

    <!-- Opening Balance Table -->
    <q-table :rows="openingBalances" :columns="columns" row-key="ID" :loading="loading" flat bordered
      :visible-columns="visibleColumns" :rows-per-page-options="[10]">
      <!-- Custom actions column -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn-group flat>
            <q-btn flat round color="primary" icon="edit" @click="openModal(props.row)" />
            <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)" />
          </q-btn-group>
        </q-td>
      </template>
    </q-table>

    <!-- Modal for Add/Edit -->
    <q-dialog v-model="showModal" persistent>
      <q-card style="width: 50vw; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingOB ? 'Edit Opening Balance' : 'New Opening Balance' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="col q-pa-md scroll custom-scrollbar">
          <q-form @submit="saveOB">
            <q-select outlined v-model="selectedAccount" :options="accountsOptions" option-value="AC_CODE"
              :option-label="(item) => item ? `${item.AC_CODE} - ${item.AC_NAME}` : ''" label="Account" use-input
              input-debounce="0" @filter="filterAccounts" :rules="[(val) => !!val || 'Account is required']"
              class="q-mb-md">
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No results
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:selected-item="scope">
                <q-item>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.AC_CODE }} - {{ scope.opt.AC_NAME }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input outlined v-model.number="formData.AMOUNT" label="Amount" type="number"
              :rules="[(val) => !!val || 'Amount is required']" class="q-mb-md" />

            <q-input outlined v-model="formData.REMARKS" label="Remarks" type="textarea" class="q-mb-md" />

            <div class="row justify-end q-mt-md">
              <q-btn label="Cancel" flat v-close-popup />
              <q-btn label="Save" type="submit" color="primary" class="q-ml-sm" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">Are you sure you want to delete this opening balance?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteOB" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import type { OB } from 'src/models/OB'
import type { COA } from 'src/models/COA'
import { useAuthStore } from 'src/stores/auth'
import type { QTableColumn } from 'quasar'

const $q = useQuasar()
const authStore = useAuthStore()

// Table configuration
const columns: QTableColumn[] = [
  {
    name: 'AC_CODE',
    label: 'Account',
    field: (row: OB) => {
      const account = accounts.value.find(a => a.AC_CODE === row.AC_CODE)
      return account ? `${account.AC_CODE} - ${account.AC_NAME}` : row.AC_CODE
    },
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'AMOUNT',
    label: 'Amount',
    field: 'AMOUNT',
    sortable: true,
    align: 'right' as const,
  },
  {
    name: 'REMARKS',
    label: 'Remarks',
    field: 'REMARKS',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'CREATED_AT',
    label: 'Created At',
    field: (row: OB) => formatDate(row.CREATED_AT),
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center' as const,
  },
]

// Column visibility control
const visibleColumns = ref(['AC_CODE', 'AMOUNT', 'REMARKS', 'CREATED_AT', 'actions'])

// Data refs
const openingBalances = ref<OB[]>([])
const accounts = ref<COA[]>([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteDialog = ref(false)
const editingOB = ref<OB | null>(null)
const selectedAccount = ref<COA | null>(null)
const accountsOptions = ref<COA[]>([])
const formData = ref<Partial<OB>>({
  AMOUNT: 0,
  REMARKS: null,
})
const obToDelete = ref<OB | null>(null)

// Methods
const fetchAccounts = async () => {
  try {
    const { data, error } = await supabase
      .from('COA')
      .select('*')
      .eq('AC_TYPE', 'T')
      .eq('IS_ACTIVE', 'Y')
      .order('AC_NAME')

    if (error) throw error
    accounts.value = data
    accountsOptions.value = data  // Initialize options with all accounts
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error fetching accounts',
    })
  }
}

const fetchOpeningBalances = async () => {
  try {
    if (!authStore.currentFiscalYear?.ID) {
      throw new Error('No fiscal year selected')
    }

    loading.value = true
    const { data, error } = await supabase
      .from('OB')
      .select('*')
      .eq('FISCAL_ID', authStore.currentFiscalYear.ID)
      .order('CREATED_AT', { ascending: false })

    if (error) throw error
    openingBalances.value = data
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error fetching opening balances',
    })
  } finally {
    loading.value = false
  }
}

const openModal = (ob: OB | null = null) => {
  editingOB.value = ob
  if (ob) {
    formData.value = {
      AMOUNT: ob.AMOUNT,
      REMARKS: ob.REMARKS,
    }
    selectedAccount.value = accounts.value.find(a => a.AC_CODE === ob.AC_CODE) || null
  } else {
    formData.value = {
      AMOUNT: 0,
      REMARKS: null,
    }
    selectedAccount.value = null
  }
  showModal.value = true
}

const filterAccounts = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      accountsOptions.value = accounts.value
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    accountsOptions.value = accounts.value.filter(
      v => v.AC_NAME.toLowerCase().indexOf(needle) > -1 ||
        v.AC_CODE.toLowerCase().indexOf(needle) > -1
    )
  })
}

const saveOB = async () => {
  try {
    if (!authStore.currentFiscalYear?.ID) {
      throw new Error('No fiscal year selected')
    }
    if (!selectedAccount.value) {
      throw new Error('No account selected')
    }

    loading.value = true
    const saveData = {
      ...formData.value,
      AC_CODE: selectedAccount.value.AC_CODE,
      FISCAL_ID: authStore.currentFiscalYear.ID,
    }

    if (editingOB.value) {
      const { error } = await supabase
        .from('OB')
        .update(saveData)
        .eq('ID', editingOB.value.ID)

      if (error) throw error
      $q.notify({ type: 'positive', message: 'Opening balance updated successfully' })
    } else {
      const { error } = await supabase.from('OB').insert(saveData)

      if (error) throw error
      $q.notify({ type: 'positive', message: 'Opening balance created successfully' })
    }

    showModal.value = false
    await fetchOpeningBalances()
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error saving opening balance',
    })
  } finally {
    loading.value = false
  }
}

const confirmDelete = (ob: OB) => {
  obToDelete.value = ob
  showDeleteDialog.value = true
}

const deleteOB = async () => {
  try {
    loading.value = true
    if (!obToDelete.value?.ID) return

    const { error } = await supabase
      .from('OB')
      .delete()
      .eq('ID', obToDelete.value.ID)

    if (error) throw error
    $q.notify({ type: 'positive', message: 'Opening balance deleted successfully' })
    await fetchOpeningBalances()
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error deleting opening balance',
    })
  } finally {
    loading.value = false
    obToDelete.value = null
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Lifecycle
onMounted(async () => {
  await fetchAccounts()
  await fetchOpeningBalances()
})
</script>

<style lang="scss">
.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 4px;
    background: transparent;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(144, 144, 144, 0.4);
    border-radius: 4px;

    &:hover {
      background: rgba(144, 144, 144, 0.6);
    }
  }

  scrollbar-width: thin;
  scrollbar-color: rgba(144, 144, 144, 0.4) transparent;
  overflow-y: auto;
}

.q-dialog__inner>div {
  overflow: hidden !important;
}
</style>
