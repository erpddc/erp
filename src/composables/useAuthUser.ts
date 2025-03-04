import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import type { User } from '@supabase/supabase-js'

const user = ref<User | null>(null)

export function useAuthUser() {
  const login = async () => {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    user.value = authUser
  }

  const initialize = async () => {
    try {
      // Get initial user
      await login()

      // Set up listener for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      user.value = null
    }
  }

  return {
    user,
    initialize,
    login,
  }
}
