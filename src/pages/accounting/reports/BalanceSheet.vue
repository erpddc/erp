<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md q-mb-md">
      <!-- Date Filter -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-input outlined v-model="asOfDate" label="As of Date" type="date">
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="asOfDate">
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
          @click="loadBalanceSheet"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Balance Sheet -->
    <div class="row q-col-gutter-md">
      <!-- Assets -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Assets</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div v-for="group in assetGroups" :key="group.AC_CODE" class="q-mb-md">
              <div class="text-weight-bold q-mb-sm">{{ group.AC_NAME }}</div>
              <div v-for="account in group.children" :key="account.AC_CODE" class="row q-mb-xs">
                <div class="col">{{ account.AC_NAME }}</div>
                <div class="col-4 text-right">{{ formatAmount(account.balance) }}</div>
              </div>
              <div class="row q-mt-sm">
                <div class="col text-weight-bold">Total {{ group.AC_NAME }}</div>
                <div class="col-4 text-right text-weight-bold">{{ formatAmount(group.total) }}</div>
              </div>
            </div>
            <q-separator class="q-my-md" />
            <div class="row text-h6">
              <div class="col">Total Assets</div>
              <div class="col-4 text-right">{{ formatAmount(totals.assets) }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Liabilities and Equity -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Liabilities and Equity</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <!-- Liabilities -->
            <div v-for="group in liabilityGroups" :key="group.AC_CODE" class="q-mb-md">
              <div class="text-weight-bold q-mb-sm">{{ group.AC_NAME }}</div>
              <div v-for="account in group.children" :key="account.AC_CODE" class="row q-mb-xs">
                <div class="col">{{ account.AC_NAME }}</div>
                <div class="col-4 text-right">{{ formatAmount(account.balance) }}</div>
              </div>
              <div class="row q-mt-sm">
                <div class="col text-weight-bold">Total {{ group.AC_NAME }}</div>
                <div class="col-4 text-right text-weight-bold">{{ formatAmount(group.total) }}</div>
              </div>
            </div>
            <div class="row text-subtitle1 q-mt-md">
              <div class="col">Total Liabilities</div>
              <div class="col-4 text-right">{{ formatAmount(totals.liabilities) }}</div>
            </div>

            <q-separator class="q-my-md" />

            <!-- Equity -->
            <div v-for="group in equityGroups" :key="group.AC_CODE" class="q-mb-md">
              <div class="text-weight-bold q-mb-sm">{{ group.AC_NAME }}</div>
              <div v-for="account in group.children" :key="account.AC_CODE" class="row q-mb-xs">
                <div class="col">{{ account.AC_NAME }}</div>
                <div class="col-4 text-right">{{ formatAmount(account.balance) }}</div>
              </div>
              <div class="row q-mt-sm">
                <div class="col text-weight-bold">Total {{ group.AC_NAME }}</div>
                <div class="col-4 text-right text-weight-bold">{{ formatAmount(group.total) }}</div>
              </div>
            </div>
            <!-- Current Period Earnings -->
            <div class="row q-mb-md">
              <div class="col">Current Period Earnings</div>
              <div class="col-4 text-right">{{ formatAmount(totals.currentEarnings) }}</div>
            </div>
            <div class="row text-subtitle1">
              <div class="col">Total Equity</div>
              <div class="col-4 text-right">{{ formatAmount(totals.equity) }}</div>
            </div>

            <q-separator class="q-my-md" />

            <!-- Total Liabilities and Equity -->
            <div class="row text-h6">
              <div class="col">Total Liabilities and Equity</div>
              <div class="col-4 text-right">{{ formatAmount(totals.liabilitiesAndEquity) }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useAuthStore } from 'src/stores/auth'
import type { COA } from 'src/models/COA'

interface AccountGroup {
  AC_CODE: string
  AC_NAME: string
  children: Array<{
    AC_CODE: string
    AC_NAME: string
    balance: number
  }>
  total: number
}

const $q = useQuasar()
const authStore = useAuthStore()
const loading = ref(false)
const asOfDate = ref<string>('')

const assetGroups = ref<AccountGroup[]>([])
const liabilityGroups = ref<AccountGroup[]>([])
const equityGroups = ref<AccountGroup[]>([])

const totals = computed(() => {
  const assets = assetGroups.value.reduce((sum, group) => sum + group.total, 0)
  const liabilities = liabilityGroups.value.reduce((sum, group) => sum + group.total, 0)
  const equityBeforeEarnings = equityGroups.value.reduce((sum, group) => sum + group.total, 0)

  // Current period earnings = Assets - Liabilities - Equity
  const currentEarnings = assets - liabilities - equityBeforeEarnings
  const equity = equityBeforeEarnings + currentEarnings

  return {
    assets,
    liabilities,
    equity,
    currentEarnings,
    liabilitiesAndEquity: liabilities + equity,
  }
})

const formatAmount = (amount: number | null) => {
  if (amount === null) return '-'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const loadBalanceSheet = async () => {
  try {
    if (!authStore.currentFiscalYear?.ID) {
      throw new Error('Fiscal year not selected')
    }

    loading.value = true

    // 1. Get all accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('COA')
      .select('*')
      .eq('IS_ACTIVE', 'Y')

    if (accountsError) throw accountsError

    // 2. Get opening balances
    const { data: openingBalances, error: obError } = await supabase
      .from('OB')
      .select('*')
      .eq('FISCAL_ID', authStore.currentFiscalYear.ID)

    if (obError) throw obError

    // 3. Get transactions up to the selected date
    const { data: transactions, error: txError } = await supabase
      .from('JVD')
      .select('*, JV!inner(TRANSACTION_DATE, VOUCHER_NO, REMARKS)')
      .eq('JV.FISCAL_ID', authStore.currentFiscalYear.ID)
      .lte('JV.TRANSACTION_DATE', asOfDate.value || new Date().toISOString().split('T')[0])

    if (txError) throw txError

    // Process accounts and build groups
    const processAccounts = (accounts: COA[], type: 'A' | 'L' | 'E') => {
      const groups = accounts.filter((a) => a.AC_TYPE === 'N' && a.STATEMENT_TYPE === type)

      return groups.map((group) => {
        const children = accounts
          .filter(
            (a) =>
              a.PARENT_ACCOUNT === group.AC_CODE && a.AC_TYPE === 'T' && a.STATEMENT_TYPE === type,
          )
          .map((account) => {
            // Calculate balance
            const openingBalance =
              openingBalances?.find((ob) => ob.AC_CODE === account.AC_CODE)?.AMOUNT ||
              account.OPENING_BALANCE ||
              0

            const accountTx = transactions?.filter((tx) => tx.AC_CODE === account.AC_CODE) || []
            const totalDr = accountTx.reduce((sum, tx) => sum + (tx.DR || 0), 0)
            const totalCr = accountTx.reduce((sum, tx) => sum + (tx.CR || 0), 0)

            let balance = openingBalance + totalDr - totalCr
            // For liabilities and equity, we show them as positive when credit is more
            if (type !== 'A') {
              balance = -balance
            }

            return {
              AC_CODE: account.AC_CODE,
              AC_NAME: account.AC_NAME,
              balance,
            }
          })

        return {
          AC_CODE: group.AC_CODE,
          AC_NAME: group.AC_NAME,
          children,
          total: children.reduce((sum, child) => sum + child.balance, 0),
        }
      })
    }

    // Process each section
    assetGroups.value = processAccounts(accounts || [], 'A')
    liabilityGroups.value = processAccounts(accounts || [], 'L')
    equityGroups.value = processAccounts(accounts || [], 'E')
  } catch (err) {
    console.error('Error loading balance sheet:', err)
    $q.notify({
      type: 'negative',
      message: typeof err === 'string' ? err : 'Error loading balance sheet',
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const today = new Date()
  const dateStr =
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0')
  asOfDate.value = dateStr
  void loadBalanceSheet()
})
</script>
