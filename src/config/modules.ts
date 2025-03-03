export type ModuleName =
  | 'home'
  | 'accounting'
  | 'purchase'
  | 'sales'
  | 'store'
  | 'hr'
  | 'collection'
  | 'production'

export type Module = {
  name: ModuleName
  label: string
  path: string
  icon: string
}

export const modules: Module[] = [
  { name: 'home', label: 'Home / Setup', path: '/', icon: 'tune' },
  { name: 'accounting', label: 'Accounting', path: '/accounting', icon: 'account_balance' },
  { name: 'purchase', label: 'Purchase', path: '/purchase', icon: 'receipt_long' },
  { name: 'sales', label: 'Sales', path: '/sales', icon: 'point_of_sale' },
  { name: 'store', label: 'Store', path: '/store', icon: 'shelves' },
  { name: 'hr', label: 'HR', path: '/hr', icon: 'groups' },
  { name: 'collection', label: 'Collection', path: '/collection', icon: 'local_shipping' },
  { name: 'production', label: 'Production', path: '/production', icon: 'factory' },
]
