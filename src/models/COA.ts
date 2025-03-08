export interface COA {
  PARENT_ACCOUNT: string | null
  AC_CODE: string
  AC_NAME: string
  AC_TYPE: 'N' | 'T' // N for Node, T for Transaction
  STATEMENT_TYPE: 'A' | 'L' | 'E' | 'I' // Assets, Liabilities, Expenses, Income
  IS_ACTIVE: 'Y' | 'N'
  TRANSACTION_TYPE: string
  OPENING_BALANCE: number
  DATE_CREATED?: string
  USER_CREATED?: string
  PRINT_TRIAL_BALANCE?: string
  PRINT_BALANCE_SHEET?: string
  PRINT_PL_ACCOUNT?: string
  PRINT_BUDGETING?: string
  DESCRIPTION?: string
  USER_UPDATED?: string
  DATE_UPDATED?: string
  SORT?: number
  children?: COA[]
}
