import { boot } from 'quasar/wrappers'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default boot(({ app }) => {
  // Make supabase available in all components
  app.config.globalProperties.$supabase = supabase
})
