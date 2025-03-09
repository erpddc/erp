<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md q-mb-md">
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
      <div class="col-12 col-sm-6 col-md-3">
        <q-input v-model="filters.search" label="Search Accounts" outlined dense clearable>
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-6 col-md-3 flex items-center">
        <q-toggle v-model="filters.showSummaryOnly" label="Show Summary Only" />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-btn
          color="primary"
          icon="refresh"
          label="Refresh"
          @click="loadTrialBalance"
          :loading="loading"
          class="q-mr-sm"
        />
        <q-btn
          outline
          color="primary"
          icon="unfold_more"
          label="Expand All"
          @click="expandAll"
          :disable="loading"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md justify-between">
      <div class="col-auto">
        <q-btn color="secondary" icon="download" label="Export to Excel" @click="exportToExcel" />
      </div>
    </div>

    <!-- Trial Balance Table -->
    <q-table
      :rows="filteredData"
      :columns="columns"
      row-key="AC_CODE"
      :loading="loading"
      flat
      bordered
      :pagination="{ rowsPerPage: 0 }"
      v-model:expanded="expanded"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="AC_CODE" :props="props">
            <div class="row items-center">
              <q-btn
                v-if="props.row.isParent"
                flat
                dense
                round
                :icon="props.expand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
                @click="props.expand = !props.expand"
                class="q-mr-sm"
              />
              <span :class="{ 'text-weight-bold': props.row.isParent }">{{
                props.row.AC_CODE
              }}</span>
            </div>
          </q-td>
          <q-td key="AC_NAME" :props="props">
            <span :class="{ 'text-weight-bold': props.row.isParent }">{{ props.row.AC_NAME }}</span>
          </q-td>
          <q-td key="OPENING_BALANCE" :props="props" class="text-right">
            <span :class="{ 'text-weight-bold': props.row.isParent }">
              {{ formatAmount(props.row.OPENING_BALANCE) }}
            </span>
          </q-td>
          <q-td key="TOTAL_DR" :props="props" class="text-right">
            <span :class="{ 'text-weight-bold': props.row.isParent }">
              {{ formatAmount(props.row.TOTAL_DR) }}
            </span>
          </q-td>
          <q-td key="TOTAL_CR" :props="props" class="text-right">
            <span :class="{ 'text-weight-bold': props.row.isParent }">
              {{ formatAmount(props.row.TOTAL_CR) }}
            </span>
          </q-td>
          <q-td key="CLOSING_BALANCE" :props="props" class="text-right">
            <span :class="{ 'text-weight-bold': props.row.isParent }">
              {{ formatAmount(props.row.CLOSING_BALANCE) }}
            </span>
          </q-td>
        </q-tr>
        <template v-if="props.row.isParent && props.expand">
          <q-tr v-for="child in props.row.children" :key="child.AC_CODE">
            <q-td key="AC_CODE" class="pl-xl">
              {{ child.AC_CODE }}
            </q-td>
            <q-td key="AC_NAME">
              {{ child.AC_NAME }}
            </q-td>
            <q-td key="OPENING_BALANCE" class="text-right">
              {{ formatAmount(child.OPENING_BALANCE) }}
            </q-td>
            <q-td key="TOTAL_DR" class="text-right">
              {{ formatAmount(child.TOTAL_DR) }}
            </q-td>
            <q-td key="TOTAL_CR" class="text-right">
              {{ formatAmount(child.TOTAL_CR) }}
            </q-td>
            <q-td key="CLOSING_BALANCE" class="text-right">
              {{ formatAmount(child.CLOSING_BALANCE) }}
            </q-td>
          </q-tr>
        </template>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-td colspan="2" class="text-right text-weight-bold">Total:</q-td>
          <q-td class="text-right text-weight-bold">{{ formatAmount(totals.openingBalance) }}</q-td>
          <q-td class="text-right text-weight-bold">{{ formatAmount(totals.totalDr) }}</q-td>
          <q-td class="text-right text-weight-bold">{{ formatAmount(totals.totalCr) }}</q-td>
          <q-td class="text-right text-weight-bold">{{ formatAmount(totals.closingBalance) }}</q-td>
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

interface TrialBalanceRow extends COA {
  TOTAL_DR: number
  TOTAL_CR: number
  CLOSING_BALANCE: number
  children?: TrialBalanceRow[]
  isParent?: boolean
}

const trialBalanceData = ref<TrialBalanceRow[]>([])
const expanded = ref<string[]>([])

const filters = ref({
  dateFrom: '',
  dateTo: '',
  search: '',
  showSummaryOnly: false,
})

const buildTree = (accounts: TrialBalanceRow[]): TrialBalanceRow[] => {
  const nodeMap = new Map<string, TrialBalanceRow>()
  const tree: TrialBalanceRow[] = []

  // First pass: Create all nodes and store in map
  accounts.forEach((account) => {
    nodeMap.set(account.AC_CODE, {
      ...account,
      children: [],
      isParent: false,
      TOTAL_DR: account.TOTAL_DR || 0,
      TOTAL_CR: account.TOTAL_CR || 0,
      OPENING_BALANCE: account.OPENING_BALANCE || 0,
      CLOSING_BALANCE: account.CLOSING_BALANCE || 0,
    })
  })

  // Second pass: Build the tree and aggregate totals bottom-up
  accounts.forEach((account) => {
    const node = nodeMap.get(account.AC_CODE)
    if (node) {
      if (account.PARENT_ACCOUNT && nodeMap.has(account.PARENT_ACCOUNT)) {
        const parent = nodeMap.get(account.PARENT_ACCOUNT)
        if (parent) {
          // Add this node as child
          parent.children?.push(node)
          parent.isParent = true
        }
      } else {
        tree.push(node)
      }
    }
  })

  // Third pass: Aggregate totals from bottom up
  const aggregateTotals = (node: TrialBalanceRow) => {
    if (!node.children?.length) {
      return {
        TOTAL_DR: node.TOTAL_DR || 0,
        TOTAL_CR: node.TOTAL_CR || 0,
        OPENING_BALANCE: node.OPENING_BALANCE || 0,
        CLOSING_BALANCE: node.CLOSING_BALANCE || 0,
      }
    }

    const childTotals = node.children.map((child) => aggregateTotals(child))

    node.TOTAL_DR = childTotals.reduce((sum, child) => sum + child.TOTAL_DR, 0)
    node.TOTAL_CR = childTotals.reduce((sum, child) => sum + child.TOTAL_CR, 0)
    node.OPENING_BALANCE = childTotals.reduce((sum, child) => sum + child.OPENING_BALANCE, 0)
    node.CLOSING_BALANCE = childTotals.reduce((sum, child) => sum + child.CLOSING_BALANCE, 0)

    return {
      TOTAL_DR: node.TOTAL_DR,
      TOTAL_CR: node.TOTAL_CR,
      OPENING_BALANCE: node.OPENING_BALANCE,
      CLOSING_BALANCE: node.CLOSING_BALANCE,
    }
  }

  // Aggregate totals for each root node
  tree.forEach((node) => {
    aggregateTotals(node)
  })

  return tree
}

const columns: QTableColumn[] = [
  {
    name: 'AC_CODE',
    label: 'Account Code',
    field: 'AC_CODE',
    align: 'left',
    sortable: true,
  },
  {
    name: 'AC_NAME',
    label: 'Account Name',
    field: (row) => row.AC_NAME,
    format: (val, row) => {
      if (row.isParent) {
        return `${row.AC_NAME} (Group)`
      }
      return val
    },
    align: 'left',
    sortable: true,
  },
  {
    name: 'OPENING_BALANCE',
    label: 'Opening Balance',
    field: 'OPENING_BALANCE',
    align: 'right',
    sortable: true,
  },
  {
    name: 'TOTAL_DR',
    label: 'Total Debit',
    field: 'TOTAL_DR',
    align: 'right',
    sortable: true,
  },
  {
    name: 'TOTAL_CR',
    label: 'Total Credit',
    field: 'TOTAL_CR',
    align: 'right',
    sortable: true,
  },
  {
    name: 'CLOSING_BALANCE',
    label: 'Closing Balance',
    field: 'CLOSING_BALANCE',
    align: 'right',
    sortable: true,
  },
]

const totals = computed(() => {
  return trialBalanceData.value.reduce(
    (acc, row) => {
      acc.openingBalance += row.OPENING_BALANCE || 0
      acc.totalDr += row.TOTAL_DR || 0
      acc.totalCr += row.TOTAL_CR || 0
      acc.closingBalance += row.CLOSING_BALANCE || 0
      return acc
    },
    { openingBalance: 0, totalDr: 0, totalCr: 0, closingBalance: 0 },
  )
})

const formatAmount = (amount: number | null) => {
  if (amount === null) return '-'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const loadTrialBalance = async () => {
  try {
    if (!authStore.currentFiscalYear?.ID) {
      throw new Error('No fiscal year selected')
    }

    loading.value = true

    // 1. Get all accounts (both nodes and transactions)
    const { data: accounts, error: accountsError } = await supabase
      .from('COA')
      .select('*')
      .eq('IS_ACTIVE', 'Y')

    if (accountsError) throw accountsError

    // 2. Get opening balances from OB table
    const { data: openingBalances, error: obError } = await supabase
      .from('OB')
      .select('*')
      .eq('FISCAL_ID', authStore.currentFiscalYear.ID)

    if (obError) throw obError

    // 3. If no opening balance found, get previous fiscal year's closing balance
    const { data: prevFiscalYear, error: prevFyError } = await supabase
      .from('FISCALS')
      .select('*')
      .lt('START_DATE', authStore.currentFiscalYear.START_DATE)
      .order('START_DATE', { ascending: false })
      .limit(1)

    if (prevFyError) throw prevFyError

    let prevClosingBalances: Record<string, number> = {}

    if (prevFiscalYear?.[0]) {
      // Get all transactions from previous fiscal year
      const { data: prevTransactions, error: prevTxError } = await supabase
        .from('JVD')
        .select('*, JV!inner(*)')
        .eq('JV.FISCAL_ID', prevFiscalYear[0].ID)

      if (prevTxError) throw prevTxError

      // Get previous fiscal year's opening balances
      const { data: prevOpeningBalances, error: prevObError } = await supabase
        .from('OB')
        .select('*')
        .eq('FISCAL_ID', prevFiscalYear[0].ID)

      if (prevObError) throw prevObError

      // Calculate previous year's closing balances
      prevClosingBalances = (accounts || []).reduce(
        (acc, account) => {
          const prevOpening =
            prevOpeningBalances?.find((ob) => ob.AC_CODE === account.AC_CODE)?.AMOUNT ||
            account.OPENING_BALANCE ||
            0

          const prevAccountTx =
            prevTransactions?.filter((tx) => tx.AC_CODE === account.AC_CODE) || []
          const prevTotalDr = prevAccountTx.reduce((sum, tx) => sum + (tx.DR || 0), 0)
          const prevTotalCr = prevAccountTx.reduce((sum, tx) => sum + (tx.CR || 0), 0)

          acc[account.AC_CODE] = prevOpening + prevTotalDr - prevTotalCr
          return acc
        },
        {} as Record<string, number>,
      )
    }

    // 4. Get current fiscal year's journal voucher details
    let query = supabase
      .from('JVD')
      .select('*, JV!inner(*)')
      .eq('JV.FISCAL_ID', authStore.currentFiscalYear.ID)

    if (filters.value.dateFrom && filters.value.dateTo) {
      query = query
        .gte('JV.TRANSACTION_DATE', filters.value.dateFrom)
        .lte('JV.TRANSACTION_DATE', filters.value.dateTo)
    }

    const { data: transactions, error: txError } = await query

    if (txError) throw txError

    // Process the data
    const processedData = (accounts || []).map((account) => {
      const openingBalance =
        openingBalances?.find((ob) => ob.AC_CODE === account.AC_CODE)?.AMOUNT ??
        prevClosingBalances[account.AC_CODE] ??
        (!prevFiscalYear?.length ? account.OPENING_BALANCE : 0) ??
        0

      const accountTransactions = transactions?.filter((tx) => tx.AC_CODE === account.AC_CODE) || []

      const totalDr = accountTransactions.reduce((sum, tx) => sum + (tx.DR || 0), 0)
      const totalCr = accountTransactions.reduce((sum, tx) => sum + (tx.CR || 0), 0)

      const closingBalance = openingBalance + totalDr - totalCr

      // Log for debugging
      if (account.AC_CODE === 'A000000000000' || account.AC_CODE === 'A002000000000') {
        console.log('Processing account:', {
          AC_CODE: account.AC_CODE,
          AC_NAME: account.AC_NAME,
          openingBalance,
          totalDr,
          totalCr,
          closingBalance,
          transactionCount: accountTransactions.length,
        })
      }

      return {
        ...account,
        OPENING_BALANCE: openingBalance,
        TOTAL_DR: totalDr,
        TOTAL_CR: totalCr,
        CLOSING_BALANCE: closingBalance,
      }
    })

    // Build the tree structure
    trialBalanceData.value = buildTree(processedData)

    // Log the final tree structure for debugging
    console.log(
      'Final tree structure:',
      trialBalanceData.value
        .filter((node) => node.AC_CODE === 'A000000000000' || node.AC_CODE === 'A002000000000')
        .map((node) => ({
          AC_CODE: node.AC_CODE,
          AC_NAME: node.AC_NAME,
          TOTAL_DR: node.TOTAL_DR,
          TOTAL_CR: node.TOTAL_CR,
          OPENING_BALANCE: node.OPENING_BALANCE,
          CLOSING_BALANCE: node.CLOSING_BALANCE,
          childCount: node.children?.length,
        })),
    )
  } catch (err) {
    console.error('Error loading trial balance:', err)
    $q.notify({
      type: 'negative',
      message: 'Error loading trial balance',
    })
  } finally {
    loading.value = false
  }
}

const expandAll = () => {
  const allParentCodes = trialBalanceData.value
    .filter((account) => account.isParent)
    .map((account) => account.AC_CODE)
  expanded.value = allParentCodes
}

const filteredData = computed(() => {
  let data = trialBalanceData.value

  // Apply search filter
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    data = data.filter((account) => {
      const matchesSearch =
        account.AC_CODE.toLowerCase().includes(searchTerm) ||
        account.AC_NAME.toLowerCase().includes(searchTerm)

      // If parent matches search, include it and all children
      if (matchesSearch) return true

      // If any child matches search, include parent and matching child
      if (
        account.children?.some(
          (child) =>
            child.AC_CODE.toLowerCase().includes(searchTerm) ||
            child.AC_NAME.toLowerCase().includes(searchTerm),
        )
      ) {
        return true
      }

      return false
    })
  }

  // Apply summary filter
  if (filters.value.showSummaryOnly) {
    data = data.filter((account) => account.isParent)
  }

  return data
})

const exportToExcel = () => {
  type RowType = {
    'Account Code': string
    'Account Name': string
    'Opening Balance': number
    'Total Debit': number
    'Total Credit': number
    'Closing Balance': number
  }

  const rows: RowType[] = []

  // Helper function to add rows recursively
  const addRow = (account: TrialBalanceRow, level = 0) => {
    const row: RowType = {
      'Account Code': account.AC_CODE,
      'Account Name': '    '.repeat(level) + account.AC_NAME + (account.isParent ? ' (Group)' : ''),
      'Opening Balance': account.OPENING_BALANCE || 0,
      'Total Debit': account.TOTAL_DR || 0,
      'Total Credit': account.TOTAL_CR || 0,
      'Closing Balance': account.CLOSING_BALANCE || 0,
    }
    rows.push(row)

    if (account.children) {
      account.children.forEach((child) => addRow(child, level + 1))
    }
  }

  // Add all accounts
  filteredData.value.forEach((account) => addRow(account))

  // Add totals row
  const totalRow: RowType = {
    'Account Code': '',
    'Account Name': 'Total',
    'Opening Balance': totals.value.openingBalance,
    'Total Debit': totals.value.totalDr,
    'Total Credit': totals.value.totalCr,
    'Closing Balance': totals.value.closingBalance,
  }
  rows.push(totalRow)

  if (rows.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'No data to export',
    })
    return
  }

  // Define headers explicitly to maintain type safety
  const headers = [
    'Account Code',
    'Account Name',
    'Opening Balance',
    'Total Debit',
    'Total Credit',
    'Closing Balance',
  ] as const

  // Convert to CSV
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    headers.join(',') +
    '\n' +
    rows.map((row) => headers.map((header) => row[header].toString()).join(',')).join('\n')

  // Create download link
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute(
    'download',
    `trial_balance_${filters.value.dateFrom}_${filters.value.dateTo}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  void loadTrialBalance()
})
</script>
