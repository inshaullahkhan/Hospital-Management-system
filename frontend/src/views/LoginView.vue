<template>
  <v-container fluid class="login-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="login-card">
          <v-card-title class="text-center pa-6">
            <div class="text-center">
              <v-icon size="80" color="primary" class="mb-4">mdi-hospital-building</v-icon>
              <h1 class="text-h4 font-weight-bold">Hospital Management</h1>
              <p class="text-subtitle-1 text-medium-emphasis">Sign in to your account</p>
            </div>
          </v-card-title>

          <v-card-text class="pa-6">
            <v-form @submit.prevent="handleLogin" ref="loginForm">
              <v-text-field
                v-model="credentials.email"
                label="Email"
                type="email"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                :rules="emailRules"
                required
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="credentials.password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                :rules="passwordRules"
                required
                class="mb-4"
              ></v-text-field>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                class="mb-4"
              >
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text class="pa-4">
            <div class="text-center">
              <h4 class="text-h6 mb-3">Demo Accounts</h4>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-btn
                    variant="outlined"
                    size="small"
                    block
                    @click="fillCredentials('admin')"
                    class="mb-2"
                  >
                    Admin Login
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-btn
                    variant="outlined"
                    size="small"
                    block
                    @click="fillCredentials('receptionist')"
                    class="mb-2"
                  >
                    Receptionist
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const loginForm = ref(null)
const showPassword = ref(false)
const credentials = ref({
  email: '',
  password: ''
})

const loading = computed(() => appStore.loading)

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters'
]

const handleLogin = async () => {
  const { valid } = await loginForm.value.validate()
  
  if (valid) {
    const result = await userStore.login(credentials.value)
    if (result.success) {
      router.push('/dashboard')
    }
  }
}

const fillCredentials = (role) => {
  switch (role) {
    case 'admin':
      credentials.value = {
        email: 'admin@hospital.com',
        password: 'admin123'
      }
      break
    case 'receptionist':
      credentials.value = {
        email: 'receptionist@hospital.com',
        password: 'receptionist123'
      }
      break
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
}

.fill-height {
  min-height: 100vh;
}
</style>
