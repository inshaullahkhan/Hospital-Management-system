import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    loading: false,
    snackbar: {
      show: false,
      message: '',
      type: 'info'
    }
  }),

  actions: {
    setLoading(loading) {
      this.loading = loading
    },

    showSnackbar(message, type = 'info') {
      this.snackbar = {
        show: true,
        message,
        type
      }
    },

    hideSnackbar() {
      this.snackbar.show = false
    }
  }
})
