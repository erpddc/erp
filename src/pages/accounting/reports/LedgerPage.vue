<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Account Selection -->
      <div class="col-12 col-sm-6 col-md-4">
        <q-select
          outlined
          v-model="selectedAccount"
          :options="accountOptions"
          option-value="AC_CODE"
          :option-label="(item) => (item ? `${item.AC_CODE} - ${item.AC_NAME}` : '')"
          label="Select Account"
          use-input
          input-debounce="0"
          @filter="filterAccounts"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">No results</q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- Date Range Filter -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-input outlined v-model="filters.dateFrom" label="From Date" type="date">
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="filters.dateFrom">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-input outlined v-model="filters.dateTo" label="To Date" type="date">
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="filters.dateTo">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-6 col-md-2">
        <q-btn
          color="primary"
          icon="refresh"
          label="Load"
          @click="loadLedger"
          :loading="loading"
          :disable="!selectedAccount"
        />
      </div>
    </div>

    <!-- Account Summary -->
    <q-card v-if="selectedAccount" class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="text-h6">{{ selectedAccount.AC_NAME }}</div>
            <div class="text-subtitle2">{{ selectedAccount.AC_CODE }}</div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="row q-col-gutter-md">
              <div class="col">
                <div class="text-subtitle2">Opening Balance</div>
                <div class="text-h6">{{ formatAmount(summary.openingBalance) }}</div>
              </div>
              <div class="col">
                <div class="text-subtitle2">Closing Balance</div>
                <div class="text-h6">{{ formatAmount(summary.closingBalance) }}</div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Ledger Table -->
    <q-table
      :rows="ledgerData"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      :pagination="{ rowsPerPage: 0 }"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="date" :props="props">
            {{ formatDate(props.row.date) }}
          </q-td>
          <q-td key="voucherNo" :props="props">
            {{ props.row.voucherNo }}
          </q-td>
          <q-td key="particulars" :props="props">
            {{ props.row.particulars }}
          </q-td>
          <q-td key="debit" :props="props" class="text-right">
            {{ formatAmount(props.row.debit) }}
          </q-td>
          <q-td key="credit" :props="props" class="text-right">
            {{ formatAmount(props.row.credit) }}
          </q-td>
          <q-td key="balance" :props="props" class="text-right">
            {{ formatAmount(props.row.balance) }}
          </q-td>
        </q-tr>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-td colspan="3" class="text-right text-weight-bold">Total:</q-td>
          <q-td class="text-right text-weight-bold">{{ formatAmount(summary.totalDebit) }}</q-td>
          <q-td class="text-right text-weight-bold">{{ formatAmount(summary.totalCredit) }}</q-td>
          <q-td class="text-right text-weight-bold">{{
            formatAmount(summary.closingBalance)
          }}</q-td>
        </q-tr>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useAuthStore } from 'src/stores/auth'
import type { COA } from 'src/models/COA'
import type { QTableColumn } from 'quasar'

const $q = useQuasar()
const authStore = useAuthStore()
const loading = ref(false)

interface LedgerEntry {
  id: number
  date: string
  voucherNo: string
  particulars: string
  debit: number
  credit: number
  balance: number
}

const selectedAccount = ref<COA | null>(null)
const accounts = ref<COA[]>([])
const accountOptions = ref<COA[]>([])
const ledgerData = ref<LedgerEntry[]>([])

const filters = ref({
  dateFrom: '',
  dateTo: '',
})

const columns: QTableColumn[] = [
  {
    name: 'date',
    label: 'Date',
    field: 'date',
    align: 'left',
    sortable: true,
  },
  {
    name: 'voucherNo',
    label: 'Voucher No',
    field: 'voucherNo',
    align: 'left',
    sortable: true,
  },
  {
    name: 'particulars',
    label: 'Particulars',
    field: 'particulars',
    align: 'left',
  },
  {
    name: 'debit',
    label: 'Debit',
    field: 'debit',
    align: 'right',
    sortable: true,
  },
  {
    name: 'credit',
    label: 'Credit',
    field: 'credit',
    align: 'right',
    sortable: true,
  },
  {
    name: 'balance',
    label: 'Balance',
    field: 'balance',
    align: 'right',
    sortable: true,
  },
]

const summary = computed(() => {
  return ledgerData.value.reduce(
    (acc, row) => {
      acc.totalDebit += row.debit || 0
      acc.totalCredit += row.credit || 0
      acc.closingBalance = acc.openingBalance + acc.totalDebit - acc.totalCredit
      return acc
    },
    { openingBalance: 0, totalDebit: 0, totalCredit: 0, closingBalance: 0 },
  )
})

const formatAmount = (amount: number | null) => {
  if (amount === null) return '-'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB') // DD/MM/YYYY format
}

const filterAccounts = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      accountOptions.value = accounts.value
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    accountOptions.value = accounts.value.filter(
      (v) =>
        v.AC_NAME.toLowerCase().indexOf(needle) > -1 ||
        v.AC_CODE.toLowerCase().indexOf(needle) > -1,
    )
  })
}

const getChildAccounts = (account: COA): string[] => {
  const childCodes: string[] = []

  const findChildren = (acc: COA) => {
    const children = accounts.value.filter((a) => a.PARENT_ACCOUNT === acc.AC_CODE)
    children.forEach((child) => {
      if (child.AC_TYPE === 'T') {
        childCodes.push(child.AC_CODE)
      }
      findChildren(child)
    })
  }

  findChildren(account)
  return childCodes
}

const loadLedger = async () => {
  try {
    if (!authStore.currentFiscalYear?.ID || !selectedAccount.value) {
      throw new Error('Fiscal year or account not selected')
    }

    loading.value = true

    // Get account codes to fetch (selected account if transaction type, or all child accounts if node)
    const accountCodes =
      selectedAccount.value.AC_TYPE === 'T'
        ? [selectedAccount.value.AC_CODE]
        : getChildAccounts(selectedAccount.value)

    if (accountCodes.length === 0) {
      throw new Error('No transaction accounts found')
    }

    // Get opening balances
    const { data: openingBalances, error: obError } = await supabase
      .from('OB')
      .select('*')
      .eq('FISCAL_ID', authStore.currentFiscalYear.ID)
      .in('AC_CODE', accountCodes)

    if (obError) throw obError

    // Get transactions
    let query = supabase
      .from('JVD')
      .select('*, JV!inner(TRANSACTION_DATE, VOUCHER_NO, REMARKS)')
      .eq('JV.FISCAL_ID', authStore.currentFiscalYear.ID)
      .in('AC_CODE', accountCodes)

    if (filters.value.dateFrom && filters.value.dateTo) {
      query = query
        .gte('JV.TRANSACTION_DATE', filters.value.dateFrom)
        .lte('JV.TRANSACTION_DATE', filters.value.dateTo)
    }

    const { data: transactions, error: txError } = await query

    if (txError) throw txError

    // Process the data
    let runningBalance = openingBalances?.reduce((sum, ob) => sum + (ob.AMOUNT || 0), 0) || 0
    summary.value.openingBalance = runningBalance

    const processedData: LedgerEntry[] = []

    // Add opening balance entry
    if (runningBalance !== 0) {
      processedData.push({
        id: 0,
        date: filters.value.dateFrom || authStore.currentFiscalYear.START_DATE,
        voucherNo: '',
        particulars: 'Opening Balance',
        debit: runningBalance > 0 ? runningBalance : 0,
        credit: runningBalance < 0 ? -runningBalance : 0,
        balance: runningBalance,
      })
    }

    // Process transactions
    const sortedTransactions = (transactions || []).sort(
      (a, b) =>
        new Date(a.JV.TRANSACTION_DATE).getTime() - new Date(b.JV.TRANSACTION_DATE).getTime(),
    )

    sortedTransactions.forEach((tx, index) => {
      const debit = tx.DR || 0
      const credit = tx.CR || 0
      runningBalance = runningBalance + debit - credit

      processedData.push({
        id: index + 1,
        date: tx.JV.TRANSACTION_DATE,
        voucherNo: tx.JV.VOUCHER_NO,
        particulars: tx.JV.REMARKS || '',
        debit,
        credit,
        balance: runningBalance,
      })
    })

    ledgerData.value = processedData
  } catch (err) {
    console.error('Error loading ledger:', err)
    $q.notify({
      type: 'negative',
      message: typeof err === 'string' ? err : 'Error loading ledger',
    })
  } finally {
    loading.value = false
  }
}

const fetchAccounts = async () => {
  try {
    const { data, error } = await supabase
      .from('COA')
      .select('*')
      .eq('IS_ACTIVE', 'Y')
      .order('AC_CODE')

    if (error) throw error
    accounts.value = data || []
    accountOptions.value = data || []
  } catch (err) {
    console.error('Error fetching accounts:', err)
    $q.notify({
      type: 'negative',
      message: 'Error fetching accounts',
    })
  }
}

onMounted(() => {
  void fetchAccounts()
})
</script>
