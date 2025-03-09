<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Search and Filters -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="row items-center q-col-gutter-md">
              <div class="col">
                <q-input
                  outlined
                  v-model="filters.search"
                  label="Search by Voucher No"
                  dense
                  clearable
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col">
                <q-select
                  outlined
                  v-model="filters.status"
                  :options="[
                    { label: 'All', value: 'all' },
                    { label: 'Pending Approval', value: 'pending' },
                    { label: 'Approved', value: 'approved' },
                  ]"
                  label="Status"
                  dense
                />
              </div>
              <div class="col">
                <q-input outlined v-model="filters.dateFrom" label="From Date" dense readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="filters.dateFrom" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col">
                <q-input outlined v-model="filters.dateTo" label="To Date" dense readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="filters.dateTo" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-auto">
                <q-btn color="primary" icon="add" label="New Entry" to="/accounting/journal/new" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Journals Table -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <q-table
              :rows="journals"
              :columns="columns"
              row-key="VOUCHER_NO"
              :loading="loading"
              :pagination="pagination"
              @update:pagination="onPaginationChange"
            >
              <template v-slot:body-cell-status="props">
                <q-td :props="props" class="text-center">
                  <q-icon
                    v-if="props.row.APPROVED_BY"
                    name="check_circle"
                    color="positive"
                    size="sm"
                  />
                  <q-icon v-else name="pending" color="warning" size="sm" />
                </q-td>
              </template>

              <template v-slot:body-cell-actions="props">
                <q-td :props="props" class="q-gutter-sm">
                  <q-btn
                    flat
                    round
                    dense
                    :color="props.row.APPROVED_BY ? 'info' : 'primary'"
                    :icon="props.row.APPROVED_BY ? 'visibility' : 'edit'"
                    :to="`/accounting/journal/${props.row.VOUCHER_NO}`"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Approval Dialog -->
    <q-dialog v-model="showApprovalDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">Approve Journal Voucher</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          Are you sure you want to approve voucher {{ selectedJournal?.VOUCHER_NO }}?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Approve" color="positive" @click="confirmApproval" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
// import { useRouter } from 'vue-router'
import { supabase } from 'src/boot/supabase'
import type { JV } from 'src/models/JV'
import { useAuthStore } from 'src/stores/auth'
import type { QTableColumn } from 'quasar'

const $q = useQuasar()
// const router = useRouter()
const authStore = useAuthStore()

// Table configuration
const columns: QTableColumn[] = [
  {
    name: 'VOUCHER_NO',
    label: 'Voucher No',
    field: 'VOUCHER_NO',
    align: 'left',
  },
  {
    name: 'TRANSACTION_DATE',
    label: 'Date',
    field: 'TRANSACTION_DATE',
    align: 'left',
  },
  {
    name: 'REMARKS',
    label: 'Remarks',
    field: 'REMARKS',
    align: 'left',
  },
  {
    name: 'status',
    label: 'Status',
    field: 'APPROVED_BY',
    align: 'center',
    format: (val) => (val ? 'Approved' : 'Pending'),
  },
  {
    name: 'actions',
    label: 'Actions',
    field: 'actions',
    align: 'center',
  },
]

// Data refs
const loading = ref(false)
const journals = ref<JV[]>([])
const filters = ref({
  search: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
})
const pagination = ref({
  sortBy: null as string | null,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})
const showApprovalDialog = ref(false)
const selectedJournal = ref<JV | null>(null)

// Methods
const loadJournals = async () => {
  try {
    if (!authStore.currentProject?.ID || !authStore.currentFiscalYear?.ID) {
      throw new Error('Project or Fiscal Year not selected')
    }

    loading.value = true

    let query = supabase
      .from('JV')
      .select('*', { count: 'exact' })
      .eq('PROJECT_ID', authStore.currentProject.ID)
      .eq('FISCAL_ID', authStore.currentFiscalYear.ID)

    // Apply filters
    if (filters.value.search?.trim()) {
      query = query.ilike('VOUCHER_NO', `%${filters.value.search.trim()}%`)
    }

    if (filters.value.status === 'pending') {
      query = query.is('APPROVED_BY', null)
    } else if (filters.value.status === 'approved') {
      query = query.not('APPROVED_BY', 'is', null)
    }

    if (filters.value.dateFrom && filters.value.dateTo) {
      query = query
        .gte('TRANSACTION_DATE', filters.value.dateFrom)
        .lte('TRANSACTION_DATE', filters.value.dateTo)
    }

    // Apply pagination and sorting
    const from = (pagination.value.page - 1) * pagination.value.rowsPerPage
    const to = from + pagination.value.rowsPerPage - 1
    query = query.range(from, to).order('TRANSACTION_DATE', { ascending: false })

    console.log('Query:', query) // Add this for debugging

    const { data, error, count } = await query

    if (error) throw error

    journals.value = data || []
    if (count !== null) {
      pagination.value.rowsNumber = count
    }
  } catch (err) {
    console.error('Error in loadJournals:', err)
    $q.notify({
      type: 'negative',
      message: 'Error loading journals',
    })
  } finally {
    loading.value = false
  }
}

const onPaginationChange = async (newPagination: {
  sortBy: string | null
  descending: boolean
  page: number
  rowsPerPage: number
  rowsNumber?: number
}) => {
  pagination.value = newPagination as typeof pagination.value
  await loadJournals()
}

// const editJournal = (journal: JV) => {
//   router.push(`/accounting/journal/${journal.VOUCHER_NO}`)
// }

// const approveJournal = (journal: JV) => {
//   selectedJournal.value = journal
//   showApprovalDialog.value = true
// }

const confirmApproval = async () => {
  try {
    if (!selectedJournal.value) return

    loading.value = true
    const { error } = await supabase
      .from('JV')
      .update({
        APPROVED_BY: authStore.user?.id,
        UPDATED_AT: new Date().toISOString(),
      })
      .eq('VOUCHER_NO', selectedJournal.value.VOUCHER_NO)

    if (error) throw error

    $q.notify({
      type: 'positive',
      message: 'Journal voucher approved successfully',
    })

    showApprovalDialog.value = false
    await loadJournals()
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error approving journal voucher',
    })
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loadJournals()
})

// Replace watchEffect with watch and handle the promise
watch(
  filters,
  async () => {
    pagination.value.page = 1
    await loadJournals()
  },
  { deep: true },
)
</script>
