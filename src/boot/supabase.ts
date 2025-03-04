import { boot } from 'quasar/wrappers'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'auth',
    storage: localStorage,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// Add session recovery on page load
const recoverSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.expires_at) {
    const expirationDate = new Date(session.expires_at * 1000)
    const now = new Date()
    if (expirationDate > now) {
      await supabase.auth.setSession(session)
    }
  }
}

// Handle the promise properly
void recoverSession().catch((error) => {
  console.error('Error recovering session:', error)
})

export default boot(({ app }) => {
  // Make supabase available in all components
  app.config.globalProperties.$supabase = supabase
})
