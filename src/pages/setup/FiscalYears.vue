<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md items-center justify-end" style="width: 100%">
      <q-select
        v-model="visibleColumns"
        multiple
        outlined
        dense
        options-dense
        :options="columns.map((col) => col.name)"
        :display-value="$q.lang.table.columns"
        emit-value
        map-options
        options-cover
        style="min-width: 200px"
        class="q-mr-sm"
      />
      <q-btn color="primary" icon="add" label="New Fiscal Year" @click="openModal()" />
    </div>

    <!-- Fiscals Table -->
    <q-table
      :rows="fiscals"
      :columns="columns"
      row-key="ID"
      :loading="loading"
      flat
      bordered
      :visible-columns="visibleColumns"
      :rows-per-page-options="[10]"
    >
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
      <q-card
        style="
          width: 50vw;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        "
      >
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingFiscal ? 'Edit Fiscal Year' : 'New Fiscal Year' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="col q-pa-md scroll custom-scrollbar">
          <q-form @submit="saveFiscal">
            <q-input
              outlined
              v-model="formData.NAME"
              label="Fiscal Year Name"
              :rules="[(val) => !!val || 'Name is required']"
              class="q-mb-none"
            />

            <q-input
              outlined
              v-model="formData.START_DATE"
              label="Start Date"
              :rules="[(val) => !!val || 'Start Date is required']"
              class="q-mb-none"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="formData.START_DATE" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input outlined v-model="formData.END_DATE" label="End Date" class="q-mb-none">
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="formData.END_DATE" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

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
          <span class="q-ml-sm">Are you sure you want to delete this fiscal year?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteFiscal" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import type { Fiscal } from 'src/models/Fiscal'
import { useAuthUser } from 'src/composables/useAuthUser'
import type { QTableColumn } from 'quasar'

const $q = useQuasar()
const { user } = useAuthUser()

// Table configuration
const columns: QTableColumn[] = [
  {
    name: 'NAME',
    label: 'Fiscal Year',
    field: 'NAME',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'START_DATE',
    label: 'Start Date',
    field: 'START_DATE',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'END_DATE',
    label: 'End Date',
    field: 'END_DATE',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'CREATED_AT',
    label: 'Created At',
    field: (row: Fiscal) => formatDate(row.CREATED_AT),
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
const visibleColumns = ref(['NAME', 'START_DATE', 'END_DATE', 'actions'])

// Data with proper typing
const fiscals = ref<Fiscal[]>([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteDialog = ref(false)
const editingFiscal = ref<null | Fiscal>(null)
const formData = ref<Omit<Fiscal, 'ID' | 'CREATED_AT' | 'USER_ID'>>({
  NAME: '',
  START_DATE: '',
  END_DATE: null,
})
const fiscalToDelete = ref<null | Fiscal>(null)

// Methods
const fetchFiscals = async () => {
  try {
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    loading.value = true
    const { data, error } = await supabase
      .from('FISCALS')
      .select('*')
      .eq('USER_ID', user.value.id)
      .order('CREATED_AT', { ascending: false })

    if (error) throw error
    fiscals.value = data
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error fetching fiscal years',
    })
  } finally {
    loading.value = false
  }
}

const openModal = (fiscal: null | Fiscal = null) => {
  editingFiscal.value = fiscal
  if (fiscal) {
    formData.value = {
      NAME: fiscal.NAME,
      START_DATE: fiscal.START_DATE,
      END_DATE: fiscal.END_DATE,
    }
  } else {
    formData.value = {
      NAME: '',
      START_DATE: '',
      END_DATE: null,
    }
  }
  showModal.value = true
}

const saveFiscal = async () => {
  try {
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    loading.value = true
    if (editingFiscal.value) {
      const { error } = await supabase
        .from('FISCALS')
        .update({
          NAME: formData.value.NAME,
          START_DATE: formData.value.START_DATE,
          END_DATE: formData.value.END_DATE,
        })
        .eq('ID', editingFiscal.value.ID)

      if (error) throw error
      $q.notify({ type: 'positive', message: 'Fiscal year updated successfully' })
    } else {
      const { error } = await supabase.from('FISCALS').insert({
        ...formData.value,
        USER_ID: user.value.id,
      })

      if (error) throw error
      $q.notify({ type: 'positive', message: 'Fiscal year created successfully' })
    }

    showModal.value = false
    await fetchFiscals()
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error saving fiscal year',
    })
  } finally {
    loading.value = false
  }
}

const confirmDelete = (fiscal: Fiscal) => {
  fiscalToDelete.value = fiscal
  showDeleteDialog.value = true
}

const deleteFiscal = async () => {
  try {
    loading.value = true
    if (!fiscalToDelete.value?.ID) return

    const { error } = await supabase.from('FISCALS').delete().eq('ID', fiscalToDelete.value.ID)

    if (error) throw error
    $q.notify({ type: 'positive', message: 'Fiscal year deleted successfully' })
    await fetchFiscals()
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error deleting fiscal year',
    })
  } finally {
    loading.value = false
    fiscalToDelete.value = null
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
  await fetchFiscals()
})
</script>

<style lang="scss">
.custom-scrollbar {
  // Hide scrollbar for Chrome, Safari and Opera
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

  // Hide scrollbar for Firefox
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 144, 144, 0.4) transparent;

  // Ensure content is scrollable
  overflow-y: auto;
}

// Add some padding to prevent content from being cut off
.q-dialog__inner > div {
  overflow: hidden !important;
}
</style>
