import { useAuthStore } from 'src/stores/auth'
import { storeToRefs } from 'pinia'

export const useAuthUser = () => {
  const authStore = useAuthStore()
  // Use storeToRefs to maintain reactivity when destructuring
  const { user, loading } = storeToRefs(authStore)

  return {
    user,
    loading,
    signIn: authStore.signIn,
    signOut: authStore.signOut,
    initialize: authStore.initialize,
  }
}
