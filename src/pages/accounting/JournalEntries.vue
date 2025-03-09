<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Master Form -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="row items-center">
              <div class="text-h6">Journal Voucher</div>
              <q-space />
              <template v-if="formData.APPROVED_BY">
                <div class="text-positive q-mr-md">
                  <q-icon name="check_circle" class="q-mr-xs" />
                  Approved by {{ approvedByUser }}
                </div>
              </template>
              <template v-else>
                <q-btn
                  label="Approve"
                  color="positive"
                  :loading="loading"
                  @click="approveJournal"
                  class="q-mr-sm"
                  :disable="!canApprove"
                  :tooltip="approvalTooltip"
                />
              </template>
              <q-btn
                label="Clear"
                flat
                class="q-mr-sm"
                @click="clearForm"
                v-if="!formData.APPROVED_BY"
              />
              <q-btn
                label="Save"
                color="primary"
                :loading="loading"
                @click="saveJournal"
                :disable="!!formData.APPROVED_BY"
                v-if="!formData.APPROVED_BY"
              />
            </div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent class="row q-col-gutter-md">
              <!-- Left Column -->
              <div class="col-12 col-md-6">
                <q-input
                  outlined
                  v-model="formData.VOUCHER_NO"
                  label="Voucher No"
                  :rules="[(val) => !!val || 'Voucher No is required']"
                  class="q-mb-md"
                  :readonly="isEditMode || !!formData.APPROVED_BY"
                />

                <q-input
                  outlined
                  v-model="formData.TRANSACTION_DATE"
                  label="Transaction Date"
                  :rules="[(val) => !!val || 'Transaction Date is required']"
                  :readonly="!!formData.APPROVED_BY"
                  class="q-mb-md"
                >
                  <template v-slot:append>
                    <q-icon
                      name="event"
                      :class="{ 'cursor-pointer': !formData.APPROVED_BY }"
                      v-if="!formData.APPROVED_BY"
                    >
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="formData.TRANSACTION_DATE" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <!-- Right Column -->
              <div class="col-12 col-md-6">
                <q-input
                  outlined
                  v-model="formData.REMARKS"
                  label="Remarks"
                  type="textarea"
                  autogrow
                  :readonly="!!formData.APPROVED_BY"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- Detail Form -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="row items-center">
              <div class="text-h6">Journal Details</div>
              <q-space />
              <div class="text-subtitle1 q-mr-sm">
                Total Dr: {{ totalDr }} | Total Cr: {{ totalCr }}
                <q-chip v-if="!isBalanced" color="negative" text-color="white" dense>
                  Not Balanced
                </q-chip>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md q-mb-md" v-if="!formData.APPROVED_BY">
              <div class="col">
                <q-select
                  outlined
                  v-model="selectedAccount"
                  :options="accountsOptions"
                  option-value="AC_CODE"
                  :option-label="(item) => (item ? `${item.AC_CODE} - ${item.AC_NAME}` : '')"
                  label="Account"
                  use-input
                  input-debounce="0"
                  @filter="filterAccounts"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey"> No results </q-item-section>
                    </q-item>
                  </template>
                  <template v-slot:selected-item="scope">
                    <q-item>
                      <q-item-section>
                        <q-item-label
                          >{{ scope.opt.AC_CODE }} - {{ scope.opt.AC_NAME }}</q-item-label
                        >
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col">
                <q-input outlined v-model.number="detailForm.DR" label="Debit" type="number" />
              </div>
              <div class="col">
                <q-input outlined v-model.number="detailForm.CR" label="Credit" type="number" />
              </div>
              <div class="col">
                <q-input outlined v-model="detailForm.NOTES" label="Notes" />
              </div>
              <div class="col-auto">
                <q-btn
                  color="primary"
                  icon="add"
                  label="Add"
                  @click="addDetail"
                  :disable="!canAddDetail"
                />
              </div>
            </div>

            <!-- Details Table -->
            <q-table
              :rows="details"
              :columns="columns"
              row-key="tempId"
              :loading="loading"
              class="q-mb-md"
              flat
              bordered
            >
              <template v-slot:body-cell-actions="props">
                <q-td :props="props" class="q-gutter-sm">
                  <q-btn
                    v-if="!formData.APPROVED_BY"
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    @click="removeDetail(props.row.tempId)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'src/boot/supabase'
import type { JVD } from 'src/models/JVD'
import type { COA } from 'src/models/COA'
import { useAuthStore } from 'src/stores/auth'
import type { QTableColumn } from 'quasar'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Table configuration
const columns: QTableColumn[] = [
  {
    name: 'AC_CODE',
    label: 'Account',
    field: (row: JVD & { tempId: number }) => {
      const account = accounts.value.find((a) => a.AC_CODE === row.AC_CODE)
      return account ? `${account.AC_CODE} - ${account.AC_NAME}` : row.AC_CODE
    },
    align: 'left',
  },
  {
    name: 'DR',
    label: 'Debit',
    field: 'DR',
    align: 'right',
  },
  {
    name: 'CR',
    label: 'Credit',
    field: 'CR',
    align: 'right',
  },
  {
    name: 'NOTES',
    label: 'Notes',
    field: 'NOTES',
    align: 'left',
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
const accounts = ref<COA[]>([])
const accountsOptions = ref<COA[]>([])
const selectedAccount = ref<COA | null>(null)
const tempId = ref(1)

const formData = ref<{
  VOUCHER_NO: string
  TRANSACTION_DATE: string
  REMARKS: string | null
  ENTERED_BY: string | null
  APPROVED_BY: string | null
}>({
  VOUCHER_NO: '',
  TRANSACTION_DATE: new Date().toISOString().slice(0, 10),
  REMARKS: null,
  ENTERED_BY: null,
  APPROVED_BY: null,
})

const detailForm = ref<Partial<JVD>>({
  DR: null,
  CR: null,
  NOTES: null,
})

const details = ref<(JVD & { tempId: number })[]>([])

// Computed properties
const totalDr = computed(() => {
  return details.value.reduce((sum, detail) => sum + (detail.DR || 0), 0)
})

const totalCr = computed(() => {
  return details.value.reduce((sum, detail) => sum + (detail.CR || 0), 0)
})

const isBalanced = computed(() => {
  return Math.abs(totalDr.value - totalCr.value) < 0.01
})

const canAddDetail = computed(() => {
  return selectedAccount.value && (detailForm.value.DR || detailForm.value.CR)
})

const isEditMode = computed(() => !!route.params.voucherNo)

const canApprove = computed(() => {
  if (!isEditMode.value || !formData.value.ENTERED_BY) return false
  if (formData.value.APPROVED_BY) return false
  if (formData.value.ENTERED_BY === authStore.user?.id) return false
  return true
})

const approvalTooltip = computed(() => {
  if (!isEditMode.value) return 'Can only approve existing entries'
  if (!formData.value.ENTERED_BY) return 'Entry information not loaded'
  if (formData.value.APPROVED_BY) return 'Already approved'
  if (formData.value.ENTERED_BY === authStore.user?.id) return 'Cannot approve your own entry'
  return 'Click to approve'
})

const approvedByUser = ref('')

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
    accountsOptions.value = data
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error fetching accounts',
    })
  }
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
      (v) =>
        v.AC_NAME.toLowerCase().indexOf(needle) > -1 ||
        v.AC_CODE.toLowerCase().indexOf(needle) > -1,
    )
  })
}

const addDetail = () => {
  if (!selectedAccount.value) return

  details.value.push({
    tempId: tempId.value++,
    ID: 0, // Temporary ID for new records
    AC_CODE: selectedAccount.value.AC_CODE,
    DR: detailForm.value.DR || null,
    CR: detailForm.value.CR || null,
    NOTES: detailForm.value.NOTES || null,
    VOURCHER_NO: '', // Will be set when saving
  })

  // Clear form
  selectedAccount.value = null
  detailForm.value = {
    DR: null,
    CR: null,
    NOTES: null,
  }
}

const removeDetail = (id: number) => {
  details.value = details.value.filter((d) => d.tempId !== id)
}

const clearForm = () => {
  formData.value = {
    VOUCHER_NO: '',
    TRANSACTION_DATE: new Date().toISOString().slice(0, 10),
    REMARKS: null,
    ENTERED_BY: null,
    APPROVED_BY: null,
  }
  details.value = []
  selectedAccount.value = null
  detailForm.value = {
    DR: null,
    CR: null,
    NOTES: null,
  }
}

const loadJournal = async () => {
  try {
    if (!isEditMode.value) return

    loading.value = true
    const voucherNo = route.params.voucherNo as string

    // Load master record
    const { data: masterData, error: masterError } = await supabase
      .from('JV')
      .select('*')
      .eq('VOUCHER_NO', voucherNo)
      .single()

    if (masterError) throw masterError
    if (!masterData) throw new Error('Journal voucher not found')

    formData.value = {
      VOUCHER_NO: masterData.VOUCHER_NO,
      TRANSACTION_DATE: masterData.TRANSACTION_DATE,
      REMARKS: masterData.REMARKS,
      ENTERED_BY: masterData.ENTERED_BY,
      APPROVED_BY: masterData.APPROVED_BY,
    }

    // Fetch approver's email if voucher is approved
    if (masterData.APPROVED_BY) {
      const { data: userData, error: userError } = await supabase
        .from('users_view') // Using a view that exposes limited user info
        .select('email, full_name')
        .eq('id', masterData.APPROVED_BY)
        .single()

      if (!userError && userData) {
        approvedByUser.value = userData.full_name || userData.email
      } else {
        // Fallback to just showing the ID if we can't get the user info
        approvedByUser.value = `User ${masterData.APPROVED_BY}`
      }
    }

    // Load detail records
    const { data: detailData, error: detailError } = await supabase
      .from('JVD')
      .select('*')
      .eq('VOURCHER_NO', voucherNo)

    if (detailError) throw detailError

    details.value = (detailData || []).map((detail) => ({
      ...detail,
      tempId: tempId.value++,
    }))
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error loading journal voucher',
    })
    await router.push('/accounting/journal')
  } finally {
    loading.value = false
  }
}

const saveJournal = async () => {
  try {
    if (!authStore.currentProject?.ID || !authStore.currentFiscalYear?.ID) {
      throw new Error('Project or Fiscal Year not selected')
    }

    if (!isBalanced.value) {
      $q.notify({
        type: 'negative',
        message: 'Debit and Credit amounts must be equal',
      })
      return
    }

    if (details.value.length === 0) {
      $q.notify({
        type: 'negative',
        message: 'At least one detail entry is required',
      })
      return
    }

    loading.value = true

    if (isEditMode.value) {
      // Update existing journal
      const { error: masterError } = await supabase
        .from('JV')
        .update({
          TRANSACTION_DATE: formData.value.TRANSACTION_DATE,
          REMARKS: formData.value.REMARKS,
          UPDATED_AT: new Date().toISOString(),
          LAST_UPDATED_BY: authStore.user?.id,
        })
        .eq('VOUCHER_NO', formData.value.VOUCHER_NO)

      if (masterError) throw masterError

      // Delete existing details
      const { error: deleteError } = await supabase
        .from('JVD')
        .delete()
        .eq('VOURCHER_NO', formData.value.VOUCHER_NO)

      if (deleteError) throw deleteError

      // Insert new details
      const { error: detailError } = await supabase.from('JVD').insert(
        details.value.map((d) => ({
          VOURCHER_NO: formData.value.VOUCHER_NO,
          AC_CODE: d.AC_CODE,
          DR: d.DR,
          CR: d.CR,
          NOTES: d.NOTES,
        })),
      )

      if (detailError) throw detailError
    } else {
      // Create new journal
      const { error } = await supabase.rpc('save_journal_voucher', {
        p_voucher_no: formData.value.VOUCHER_NO,
        p_project_id: authStore.currentProject.ID,
        p_fiscal_id: authStore.currentFiscalYear.ID,
        p_transaction_date: formData.value.TRANSACTION_DATE,
        p_remarks: formData.value.REMARKS,
        p_details: details.value.map((d) => ({
          ac_code: d.AC_CODE,
          dr: d.DR,
          cr: d.CR,
          notes: d.NOTES,
        })),
      })

      if (error) throw error
    }

    $q.notify({
      type: 'positive',
      message: `Journal voucher ${isEditMode.value ? 'updated' : 'saved'} successfully`,
    })

    await router.push('/accounting/journal')
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: `Error ${isEditMode.value ? 'updating' : 'saving'} journal voucher`,
    })
  } finally {
    loading.value = false
  }
}

const approveJournal = async () => {
  try {
    if (!authStore.user?.id) return

    loading.value = true
    const { error } = await supabase
      .from('JV')
      .update({
        APPROVED_BY: authStore.user.id,
        UPDATED_AT: new Date().toISOString(),
      })
      .eq('VOUCHER_NO', formData.value.VOUCHER_NO)

    if (error) throw error

    // Update local state
    formData.value.APPROVED_BY = authStore.user.id

    $q.notify({
      type: 'positive',
      message: 'Journal voucher approved successfully',
    })
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
  await fetchAccounts()
  if (isEditMode.value) {
    await loadJournal()
  }
})
</script>

<style lang="scss" scoped>
.q-table__bottom-row {
  font-weight: bold;
}
</style>
