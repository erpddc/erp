<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Master Form -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="row items-center">
              <div class="text-h6">Payment Voucher</div>
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
                  @click="approvePayment"
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
                @click="savePayment"
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
              <div class="text-h6">Payment Details</div>
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
              <!-- Account Selection -->
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
                </q-select>
              </div>

              <!-- Payment Method -->
              <div class="col">
                <q-select
                  outlined
                  v-model="detailForm.PAYMENT_METHOD"
                  :options="paymentMethods"
                  label="Payment Method"
                  :rules="[(val) => !!val || 'Payment method is required']"
                />
              </div>

              <!-- Check Number (shown if payment method is CHECK) -->
              <div class="col" v-if="detailForm.PAYMENT_METHOD === 'CHECK'">
                <q-input
                  outlined
                  v-model="detailForm.CHECK"
                  label="Check Number"
                  :rules="
                    selectedAccount?.AC_CODE.startsWith(BANK_ACCOUNT_PREFIX)
                      ? [(val) => !!val || 'Check number is required']
                      : []
                  "
                />
              </div>

              <!-- Check Date (shown if payment method is CHECK) -->
              <div class="col" v-if="detailForm.PAYMENT_METHOD === 'CHECK'">
                <q-input
                  outlined
                  v-model="detailForm.CHECK_DATE"
                  label="Check Date"
                  :rules="
                    selectedAccount?.AC_CODE.startsWith(BANK_ACCOUNT_PREFIX)
                      ? [(val) => !!val || 'Check date is required']
                      : []
                  "
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="detailForm.CHECK_DATE" mask="YYYY-MM-DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <!-- Amount Fields -->
              <div class="col">
                <q-input outlined v-model.number="detailForm.DR" label="Debit" type="number" />
              </div>
              <div class="col">
                <q-input outlined v-model.number="detailForm.CR" label="Credit" type="number" />
              </div>

              <!-- Notes -->
              <div class="col">
                <q-input outlined v-model="detailForm.NOTES" label="Notes" />
              </div>

              <!-- Add Button -->
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
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'src/boot/supabase'
import type { JVD } from 'src/models/JVD'
import type { COA } from 'src/models/COA'
import { useAuthStore } from 'src/stores/auth'
import type { QTableColumn } from 'quasar'

// Constants
const BANK_ACCOUNT_PREFIX = 'A002002'
const paymentMethods = ['CASH', 'CHECK', 'TRANSFER']

// Component setup
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Interfaces
interface PaymentDetail extends JVD {
  PAYMENT_METHOD: (typeof paymentMethods)[number] | null
  CHECK?: string | null
  CHECK_DATE?: string | null
}

// Table configuration
const columns: QTableColumn[] = [
  {
    name: 'AC_CODE',
    label: 'Account',
    field: (row: PaymentDetail & { tempId: number }) => {
      const account = accounts.value.find((a) => a.AC_CODE === row.AC_CODE)
      return account ? `${account.AC_CODE} - ${account.AC_NAME}` : row.AC_CODE
    },
    align: 'left',
  },
  {
    name: 'PAYMENT_METHOD',
    label: 'Payment Method',
    field: 'PAYMENT_METHOD',
    align: 'left',
  },
  {
    name: 'CHECK',
    label: 'Check No',
    field: 'CHECK',
    align: 'left',
  },
  {
    name: 'CHECK_DATE',
    label: 'Check Date',
    field: 'CHECK_DATE',
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
const approvedByUser = ref('')

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

const detailForm = ref<Partial<PaymentDetail>>({
  DR: null,
  CR: null,
  NOTES: null,
  PAYMENT_METHOD: 'CHECK',
  CHECK: null,
  CHECK_DATE: null,
})

const details = ref<(PaymentDetail & { tempId: number })[]>([])

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
  const hasRequiredFields = selectedAccount.value && (detailForm.value.DR || detailForm.value.CR)
  const hasValidPaymentMethod = !!detailForm.value.PAYMENT_METHOD

  // Check details are only required for bank accounts
  const isBankAccount = selectedAccount.value?.AC_CODE.startsWith(BANK_ACCOUNT_PREFIX)
  const hasCheckDetails =
    detailForm.value.PAYMENT_METHOD === 'CHECK'
      ? isBankAccount
        ? !!detailForm.value.CHECK && !!detailForm.value.CHECK_DATE
        : true
      : true

  return hasRequiredFields && hasValidPaymentMethod && hasCheckDetails
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
    // If adding credit entry, only show bank accounts
    if (detailForm.value.CR) {
      accountsOptions.value = data.filter((acc) => acc.AC_CODE.startsWith(BANK_ACCOUNT_PREFIX))
    } else {
      accountsOptions.value = data
    }
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
      // If adding credit entry, only show bank accounts
      if (detailForm.value.CR) {
        accountsOptions.value = accounts.value.filter((acc) =>
          acc.AC_CODE.startsWith(BANK_ACCOUNT_PREFIX),
        )
      } else {
        accountsOptions.value = accounts.value
      }
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    let filtered = accounts.value.filter(
      (v) =>
        v.AC_NAME.toLowerCase().indexOf(needle) > -1 ||
        v.AC_CODE.toLowerCase().indexOf(needle) > -1,
    )
    // If adding credit entry, only show bank accounts
    if (detailForm.value.CR) {
      filtered = filtered.filter((acc) => acc.AC_CODE.startsWith(BANK_ACCOUNT_PREFIX))
    }
    accountsOptions.value = filtered
  })
}

const addDetail = () => {
  if (!selectedAccount.value || !detailForm.value.PAYMENT_METHOD) return

  details.value.push({
    tempId: tempId.value++,
    ID: 0,
    AC_CODE: selectedAccount.value.AC_CODE,
    DR: detailForm.value.DR || null,
    CR: detailForm.value.CR || null,
    NOTES: detailForm.value.NOTES || null,
    VOURCHER_NO: '',
    PAYMENT_METHOD: detailForm.value.PAYMENT_METHOD,
    CHECK: detailForm.value.CHECK || null,
    CHECK_DATE: detailForm.value.CHECK_DATE || null,
  })

  // Clear form
  selectedAccount.value = null
  detailForm.value = {
    DR: null,
    CR: null,
    NOTES: null,
    PAYMENT_METHOD: null,
    CHECK: null,
    CHECK_DATE: null,
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
    PAYMENT_METHOD: 'CHECK',
    CHECK: null,
    CHECK_DATE: null,
  }
}

const loadPayment = async () => {
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
    if (!masterData) throw new Error('Payment voucher not found')

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
        .from('users_view')
        .select('email, full_name')
        .eq('id', masterData.APPROVED_BY)
        .single()

      if (!userError && userData) {
        approvedByUser.value = userData.full_name || userData.email
      } else {
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
      message: 'Error loading payment voucher',
    })
    await router.push('/accounting/payments')
  } finally {
    loading.value = false
  }
}

const savePayment = async () => {
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

    // Use the same save_journal_voucher function but with payment details
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
        payment_method: d.PAYMENT_METHOD,
        check: d.CHECK,
        check_date: d.CHECK_DATE,
      })),
    })

    if (error) throw error

    $q.notify({
      type: 'positive',
      message: `Payment voucher ${isEditMode.value ? 'updated' : 'saved'} successfully`,
    })

    await router.push('/accounting/payments')
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: `Error ${isEditMode.value ? 'updating' : 'saving'} payment voucher`,
    })
  } finally {
    loading.value = false
  }
}

const approvePayment = async () => {
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
      message: 'Payment voucher approved successfully',
    })
  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Error approving payment voucher',
    })
  } finally {
    loading.value = false
  }
}

// Add watcher for CR field to update account options
watch(
  () => detailForm.value.CR,
  (newVal) => {
    if (newVal) {
      accountsOptions.value = accounts.value.filter((acc) =>
        acc.AC_CODE.startsWith(BANK_ACCOUNT_PREFIX),
      )
    } else {
      accountsOptions.value = accounts.value
    }
  },
)

// Lifecycle
onMounted(async () => {
  await fetchAccounts()
  if (isEditMode.value) {
    await loadPayment()
  }
})
</script>

<style lang="scss" scoped>
.q-table__bottom-row {
  font-weight: bold;
}
</style>
