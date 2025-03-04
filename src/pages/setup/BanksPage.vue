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
      <q-btn color="primary" icon="add" label="New Bank" @click="openModal()" />
    </div>

    <!-- Banks Table -->
    <q-table
      :rows="banks"
      :columns="columns"
      row-key="BANK_CODE"
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

      <!-- Custom boolean column -->
      <template v-slot:body-cell-IS_ACTIVE="props">
        <q-td :props="props">
          <q-chip :color="props.row.IS_ACTIVE ? 'positive' : 'negative'" text-color="white" dense>
            {{ props.row.IS_ACTIVE ? 'Active' : 'Inactive' }}
          </q-chip>
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
          <div class="text-h6">{{ editingBank ? 'Edit Bank' : 'New Bank' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="col q-pa-md scroll custom-scrollbar">
          <q-form @submit="saveBank">
            <q-input
              outlined
              v-model="formData.BANK_CODE"
              label="Bank Code"
              :rules="[(val) => !!val || 'Bank Code is required']"
              class="q-mb-none"
              :disable="!!editingBank"
            />
            <q-input
              outlined
              v-model="formData.BANK_NAME"
              label="Bank Name"
              :rules="[(val) => !!val || 'Bank Name is required']"
              class="q-mb-none"
            />
            <q-input outlined v-model="formData.AC_CODE" label="Account Code" class="q-mb-none" />
            <q-toggle v-model="formData.IS_ACTIVE" label="Active" class="q-mb-none" />
            <q-input
              outlined
              v-model="formData.REMARKS"
              label="Remarks"
              type="textarea"
              rows="2"
              autogrow
              class="q-mb-md remarks-input"
            />
            <q-select
              outlined
              v-model="selectedProject"
              :options="availableProjects"
              option-label="NAME"
              option-value="ID"
              label="Assign to Project"
              clearable
              class="q-mb-none"
            />
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
          <span class="q-ml-sm">Are you sure you want to delete this bank?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteBank" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import type { Bank } from 'src/models/Bank'
import { useAuthUser } from 'src/composables/useAuthUser'
import type { QTableColumn } from 'quasar'
import type { Project } from 'src/models/Project'

const $q = useQuasar()
const { user } = useAuthUser()

// Table configuration
const columns: QTableColumn[] = [
  {
    name: 'BANK_CODE',
    label: 'Code',
    field: 'BANK_CODE',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'BANK_NAME',
    label: 'Name',
    field: 'BANK_NAME',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'AC_CODE',
    label: 'Account Code',
    field: 'AC_CODE',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'IS_ACTIVE',
    label: 'Status',
    field: 'IS_ACTIVE',
    sortable: true,
    align: 'center' as const,
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
    field: (row: Bank) => formatDate(row.CREATED_AT),
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
const visibleColumns = ref(['BANK_CODE', 'BANK_NAME', 'IS_ACTIVE', 'actions'])

// Data with proper typing
const banks = ref<Bank[]>([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteDialog = ref(false)
const editingBank = ref<null | Bank>(null)
const formData = ref<Omit<Bank, 'CREATED_AT' | 'USER_ID'>>({
  BANK_CODE: '',
  BANK_NAME: '',
  AC_CODE: null,
  IS_ACTIVE: true,
  REMARKS: null,
  PROJECT_ID: null,
})
const bankToDelete = ref<null | Bank>(null)

// New refs for projects
const availableProjects = ref<Project[]>([])
const selectedProject = ref<Project | null>(null)

// Methods
const fetchBanks = async () => {
  try {
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    loading.value = true
    const { data, error } = await supabase
      .from('BANKS')
      .select('*')
      .eq('USER_ID', user.value.id)
      .order('CREATED_AT', { ascending: false })

    if (error) throw error
    banks.value = data
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error fetching banks',
    })
  } finally {
    loading.value = false
  }
}

const fetchAvailableProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('PROJECTS')
      .select('*')
      .eq('USER_ID', user.value?.id)

    if (error) throw error
    availableProjects.value = data
  } catch (err) {
    console.error(err)
  }
}

const openModal = async (bank: null | Bank = null) => {
  editingBank.value = bank
  if (bank) {
    formData.value = {
      BANK_CODE: bank.BANK_CODE,
      BANK_NAME: bank.BANK_NAME,
      AC_CODE: bank.AC_CODE,
      IS_ACTIVE: bank.IS_ACTIVE,
      REMARKS: bank.REMARKS,
      PROJECT_ID: bank.PROJECT_ID,
    }
    selectedProject.value = bank.PROJECT_ID
      ? availableProjects.value.find((p) => p.ID === bank.PROJECT_ID) || null
      : null
  } else {
    formData.value = {
      BANK_CODE: '',
      BANK_NAME: '',
      AC_CODE: null,
      IS_ACTIVE: true,
      REMARKS: null,
      PROJECT_ID: null,
    }
    selectedProject.value = null
  }
  await fetchAvailableProjects()
  showModal.value = true
}

const saveBank = async () => {
  try {
    if (!user.value?.id) {
      throw new Error('User not authenticated')
    }

    loading.value = true
    const bankData = {
      ...formData.value,
      PROJECT_ID: selectedProject.value?.ID || null,
    }

    if (editingBank.value) {
      const { error } = await supabase
        .from('BANKS')
        .update(bankData)
        .eq('BANK_CODE', editingBank.value.BANK_CODE)

      if (error) throw error
      $q.notify({ type: 'positive', message: 'Bank updated successfully' })
    } else {
      const { error } = await supabase.from('BANKS').insert({
        ...bankData,
        USER_ID: user.value.id,
      })

      if (error) throw error
      $q.notify({ type: 'positive', message: 'Bank created successfully' })
    }

    showModal.value = false
    await fetchBanks()
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error saving bank',
    })
  } finally {
    loading.value = false
  }
}

const confirmDelete = (bank: Bank) => {
  bankToDelete.value = bank
  showDeleteDialog.value = true
}

const deleteBank = async () => {
  try {
    loading.value = true
    if (!bankToDelete.value?.BANK_CODE) return

    const { error } = await supabase
      .from('BANKS')
      .delete()
      .eq('BANK_CODE', bankToDelete.value.BANK_CODE)

    if (error) throw error
    $q.notify({ type: 'positive', message: 'Bank deleted successfully' })
    await fetchBanks()
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error deleting bank',
    })
  } finally {
    loading.value = false
    bankToDelete.value = null
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
  await fetchBanks()
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

.remarks-input {
  .q-field__native {
    max-height: 150px; // Adjust this value as needed
  }
}
</style>
