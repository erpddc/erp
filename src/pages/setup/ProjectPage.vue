<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md flex justify-end" style="width: 100%">
      <q-btn color="primary" icon="add" label="New Project" @click="openModal()" />
    </div>

    <!-- Projects Table -->
    <q-table
      :rows="projects"
      :columns="columns"
      row-key="ID"
      :loading="loading"
      flat
      bordered
      :rows-per-page-options="[10]"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.value }}
          </q-td>
          <q-td auto-width>
            <q-btn-group flat>
              <q-btn flat round color="primary" icon="edit" @click="openModal(props.row)" />
              <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)" />
            </q-btn-group>
          </q-td>
        </q-tr>
        <q-tr v-if="props.row.banks?.length" :props="props">
          <q-td colspan="100%">
            <div class="text-left">
              <q-table
                :rows="props.row.banks"
                :columns="bankColumns"
                row-key="BANK_CODE"
                flat
                bordered
                dense
                hide-bottom
                :pagination="{ rowsPerPage: 0 }"
                class="q-mx-sm"
              />
            </div>
          </q-td>
        </q-tr>
      </template>

      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
          <q-th auto-width>Actions</q-th>
        </q-tr>
      </template>
    </q-table>

    <!-- Modal for Add/Edit -->
    <q-dialog v-model="showModal" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingProject ? 'Edit Project' : 'New Project' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveProject">
            <q-input
              outlined
              v-model="formData.NAME"
              label="Project Name"
              :rules="[(val) => !!val || 'Name is required']"
              class="q-mb-sm"
            />
            <q-input outlined v-model="formData.ADDRESS" label="Address" class="q-mb-md" />
            <div class="row justify-end">
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
          <span class="q-ml-sm">Are you sure you want to delete this project?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteProject" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import type { Project } from 'src/models/Project'
import { useAuthUser } from 'src/composables/useAuthUser'
import type { QTableColumn } from 'quasar'
import type { Bank } from 'src/models/Bank'

const $q = useQuasar()
const { user } = useAuthUser()

// Bank columns for nested table
const bankColumns: QTableColumn[] = [
  {
    name: 'BANK_CODE',
    label: 'Code',
    field: 'BANK_CODE',
    align: 'left' as const,
  },
  {
    name: 'BANK_NAME',
    label: 'Name',
    field: 'BANK_NAME',
    align: 'left' as const,
  },
  {
    name: 'AC_CODE',
    label: 'Account Code',
    field: 'AC_CODE',
    align: 'left' as const,
  },
]

// Project table columns
const columns: QTableColumn[] = [
  {
    name: 'NAME',
    label: 'Project Name',
    field: 'NAME',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'ADDRESS',
    label: 'Address',
    field: 'ADDRESS',
    sortable: true,
    align: 'left' as const,
  },
  {
    name: 'CREATED_AT',
    label: 'Created At',
    field: (row: Project) => formatDate(row.CREATED_AT),
    sortable: true,
    align: 'left' as const,
  },
]

// Data
const projects = ref<(Project & { banks: Bank[] })[]>([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteDialog = ref(false)
const editingProject = ref<null | Project>(null)
const formData = ref<Omit<Project, 'ID' | 'CREATED_AT' | 'USER_ID'>>({
  NAME: '',
  ADDRESS: '',
})
const projectToDelete = ref<null | Project>(null)

// Methods
const fetchProjects = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('PROJECTS')
      .select(
        `
        *,
        banks:BANKS!PROJECT_ID(*)
      `,
      )
      .order('CREATED_AT', { ascending: false })

    if (error) throw error
    projects.value = data
    console.log('projects', projects.value)
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error fetching projects',
    })
  } finally {
    loading.value = false
  }
}

const openModal = (project: null | Project = null) => {
  editingProject.value = project
  if (project) {
    formData.value = {
      NAME: project.NAME,
      ADDRESS: project.ADDRESS,
    }
  } else {
    formData.value = { NAME: '', ADDRESS: '' }
  }
  showModal.value = true
}

const saveProject = async () => {
  try {
    loading.value = true
    if (editingProject.value) {
      const { error } = await supabase
        .from('PROJECTS')
        .update(formData.value)
        .eq('ID', editingProject.value.ID)

      if (error) throw error
      $q.notify({ type: 'positive', message: 'Project updated successfully' })
    } else {
      const { error } = await supabase.from('PROJECTS').insert({
        ...formData.value,
        USER_ID: user.value?.id,
      })

      if (error) throw error
      $q.notify({ type: 'positive', message: 'Project created successfully' })
    }

    showModal.value = false
    await fetchProjects()
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error saving project',
    })
  } finally {
    loading.value = false
  }
}

const confirmDelete = (project: Project) => {
  projectToDelete.value = project
  showDeleteDialog.value = true
}

const deleteProject = async () => {
  try {
    loading.value = true
    if (!projectToDelete.value?.ID) return

    const { error } = await supabase.from('PROJECTS').delete().eq('ID', projectToDelete.value.ID)

    if (error) throw error
    $q.notify({ type: 'positive', message: 'Project deleted successfully' })
    await fetchProjects()
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error deleting project',
    })
  } finally {
    loading.value = false
    projectToDelete.value = null
  }
}

// Add this date formatting function
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  await fetchProjects()
})
</script>

<style lang="scss">
.q-table__card {
  width: 100%;
}
</style>
