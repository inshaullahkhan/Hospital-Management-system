<template>
  <v-app>
    <v-navigation-drawer
      v-if="userStore.isAuthenticated"
      v-model="drawer"
      app
      clipped
      :width="280"
    >
      <v-list nav>
        <v-list-item class="pa-4">
          <div class="text-center">
            <v-avatar size="80" class="mb-3">
              <v-icon size="50">mdi-account-circle</v-icon>
            </v-avatar>
            <div class="text-h6">{{ userStore.user?.firstName }} {{ userStore.user?.lastName }}</div>
            <div class="text-caption text-medium-emphasis">{{ userStore.user?.role?.toUpperCase() }}</div>
          </div>
        </v-list-item>

        <v-divider class="mx-3 mb-3"></v-divider>

        <!-- Admin Menu -->
        <template v-if="userStore.user?.role === 'admin'">
          <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard">
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>
          <v-list-item to="/users" prepend-icon="mdi-account-group">
            <v-list-item-title>Manage Users</v-list-item-title>
          </v-list-item>
          <v-list-item to="/doctors" prepend-icon="mdi-doctor">
            <v-list-item-title>Doctors</v-list-item-title>
          </v-list-item>
          <v-list-item to="/patients" prepend-icon="mdi-account-heart">
            <v-list-item-title>Patients</v-list-item-title>
          </v-list-item>
          <v-list-item to="/appointments" prepend-icon="mdi-calendar-clock">
            <v-list-item-title>Appointments</v-list-item-title>
          </v-list-item>
          <v-list-item to="/reports" prepend-icon="mdi-chart-box">
            <v-list-item-title>Reports</v-list-item-title>
          </v-list-item>
        </template>

        <!-- Receptionist Menu -->
        <template v-if="userStore.user?.role === 'receptionist'">
          <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard">
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>
          <v-list-item to="/appointments" prepend-icon="mdi-calendar-clock">
            <v-list-item-title>Appointments</v-list-item-title>
          </v-list-item>
          <v-list-item to="/patients" prepend-icon="mdi-account-heart">
            <v-list-item-title>Patients</v-list-item-title>
          </v-list-item>
          <v-list-item to="/doctors" prepend-icon="mdi-doctor">
            <v-list-item-title>Doctors</v-list-item-title>
          </v-list-item>
          <v-list-item to="/invoices" prepend-icon="mdi-receipt">
            <v-list-item-title>Invoices</v-list-item-title>
          </v-list-item>
        </template>

        <!-- Doctor Menu -->
        <template v-if="userStore.user?.role === 'doctor'">
          <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard">
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>
          <v-list-item to="/appointments" prepend-icon="mdi-calendar-clock">
            <v-list-item-title>My Appointments</v-list-item-title>
          </v-list-item>
          <v-list-item to="/patients" prepend-icon="mdi-account-heart">
            <v-list-item-title>My Patients</v-list-item-title>
          </v-list-item>
          <v-list-item to="/profile" prepend-icon="mdi-account-edit">
            <v-list-item-title>My Profile</v-list-item-title>
          </v-list-item>
        </template>

        <!-- Patient Menu -->
        <template v-if="userStore.user?.role === 'patient'">
          <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard">
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>
          <v-list-item to="/appointments" prepend-icon="mdi-calendar-clock">
            <v-list-item-title>My Appointments</v-list-item-title>
          </v-list-item>
          <v-list-item to="/medical-records" prepend-icon="mdi-file-document">
            <v-list-item-title>Medical Records</v-list-item-title>
          </v-list-item>
          <v-list-item to="/invoices" prepend-icon="mdi-receipt">
            <v-list-item-title>My Invoices</v-list-item-title>
          </v-list-item>
          <v-list-item to="/profile" prepend-icon="mdi-account-edit">
            <v-list-item-title>My Profile</v-list-item-title>
          </v-list-item>
        </template>

        <v-divider class="my-3"></v-divider>

        <v-list-item @click="logout" prepend-icon="mdi-logout" class="text-error">
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar 
      v-if="userStore.isAuthenticated"
      app 
      clipped-left 
      color="primary"
      dark
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-hospital-building</v-icon>
        Hospital Management System
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <!-- Global Loading -->
    <v-overlay v-model="loading" class="align-center justify-center">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
    </v-overlay>

    <!-- Global Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarType"
      timeout="4000"
      location="top right"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="showSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useUserStore } from './stores/user'
import { useAppStore } from './stores/app'

const router = useRouter()
const theme = useTheme()
const userStore = useUserStore()
const appStore = useAppStore()

const drawer = ref(true)

const isDark = computed(() => theme.global.current.value.dark)
const loading = computed(() => appStore.loading)
const showSnackbar = computed(() => appStore.snackbar.show)
const snackbarMessage = computed(() => appStore.snackbar.message)
const snackbarType = computed(() => appStore.snackbar.type)

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const logout = async () => {
  await userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  if (userStore.token) {
    await userStore.loadProfile()
  }
})
</script>

<style>
.v-application {
  font-family: 'Roboto', sans-serif;
}

.v-navigation-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
</style>
