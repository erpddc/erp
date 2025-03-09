import { defineStore } from 'pinia'
import { supabase } from 'src/boot/supabase'
import type { User, AuthError, Session } from '@supabase/supabase-js'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Fiscal } from 'src/models/Fiscal'
import type { Project } from 'src/models/Project'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const router = useRouter()
  const isInitialized = ref(false)
  const currentFiscalYear = ref<Fiscal | null>(null)
  const currentProject = ref<Project | null>(null)

  const initialize = async () => {
    if (isInitialized.value) return

    try {
      // Get initial session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error

      user.value = session?.user ?? null

      // Restore fiscal year from localStorage if exists
      const savedFiscalYear = localStorage.getItem('currentFiscalYear')
      if (savedFiscalYear) {
        currentFiscalYear.value = JSON.parse(savedFiscalYear)
      }

      // Restore project from localStorage if exists
      const savedProject = localStorage.getItem('currentProject')
      if (savedProject) {
        currentProject.value = JSON.parse(savedProject)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
        user.value = session?.user ?? null
      })

      isInitialized.value = true
    } catch (error) {
      console.error('Auth initialization error:', error)
    }
  }

  const signIn = async (email: string, password: string, fiscalYear: Fiscal, project: Project) => {
    try {
      loading.value = true
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        user.value = data.user
        currentFiscalYear.value = fiscalYear
        currentProject.value = project
        // Save fiscal year and project to localStorage
        localStorage.setItem('currentFiscalYear', JSON.stringify(fiscalYear))
        localStorage.setItem('currentProject', JSON.stringify(project))
        await router.push('/') // await the navigation
      }
    } catch (error) {
      console.error('Error:', error)
      throw error as AuthError
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      loading.value = true
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      user.value = null
      currentFiscalYear.value = null
      currentProject.value = null
      localStorage.removeItem('currentFiscalYear')
      localStorage.removeItem('currentProject')
      await router.push('/login')
    } catch (error) {
      console.error('Error:', error)
      throw error as AuthError
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    initialize,
    signIn,
    signOut,
    currentFiscalYear,
    currentProject,
  }
})
