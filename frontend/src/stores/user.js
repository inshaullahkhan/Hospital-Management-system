import { defineStore } from 'pinia'
import axios from 'axios'
import { useAppStore } from './app'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

// Configure axios defaults
axios.defaults.baseURL = API_BASE

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('hospital_token') || null,
    isAuthenticated: false
  }),

  getters: {
    userRole: (state) => state.user?.role,
    userFullName: (state) => state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
    isAdmin: (state) => state.user?.role === 'admin',
    isReceptionist: (state) => state.user?.role === 'receptionist',
    isDoctor: (state) => state.user?.role === 'doctor',
    isPatient: (state) => state.user?.role === 'patient'
  },

  actions: {
    async login(credentials) {
      const appStore = useAppStore()
      appStore.setLoading(true)

      try {
        const response = await axios.post('/auth/login', credentials)
        const { token, user } = response.data
        
        this.token = token
        this.user = user
        this.isAuthenticated = true
        
        localStorage.setItem('hospital_token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        appStore.showSnackbar('Login successful!', 'success')
        return { success: true }
      } catch (error) {
        const message = error.response?.data?.message || 'Login failed'
        appStore.showSnackbar(message, 'error')
        return { success: false, message }
      } finally {
        appStore.setLoading(false)
      }
    },

    async logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      
      localStorage.removeItem('hospital_token')
      delete axios.defaults.headers.common['Authorization']
    },

    async loadProfile() {
      if (!this.token) return

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        const response = await axios.get('/auth/profile')
        this.user = response.data.user
        this.isAuthenticated = true
      } catch (error) {
        console.error('Failed to load profile:', error)
        this.logout()
      }
    },

    async changePassword(passwords) {
      const appStore = useAppStore()
      appStore.setLoading(true)

      try {
        await axios.put('/auth/change-password', passwords)
        appStore.showSnackbar('Password changed successfully!', 'success')
        return { success: true }
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to change password'
        appStore.showSnackbar(message, 'error')
        return { success: false, message }
      } finally {
        appStore.setLoading(false)
      }
    },

    async updateProfile(profileData) {
      const appStore = useAppStore()
      appStore.setLoading(true)

      try {
        const response = await axios.put(`/users/${this.user.id}`, profileData)
        this.user = { ...this.user, ...response.data.user }
        appStore.showSnackbar('Profile updated successfully!', 'success')
        return { success: true }
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to update profile'
        appStore.showSnackbar(message, 'error')
        return { success: false, message }
      } finally {
        appStore.setLoading(false)
      }
    }
  }
})
