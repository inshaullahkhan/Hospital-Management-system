import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// Views
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'
import DoctorsView from '../views/DoctorsView.vue'
import PatientsView from '../views/PatientsView.vue'
import AppointmentsView from '../views/AppointmentsView.vue'
import InvoicesView from '../views/InvoicesView.vue'
import MedicalRecordsView from '../views/MedicalRecordsView.vue'
import ProfileView from '../views/ProfileView.vue'
import ReportsView from '../views/ReportsView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: UsersView,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/doctors',
    name: 'Doctors',
    component: DoctorsView,
    meta: { requiresAuth: true, roles: ['admin', 'receptionist'] }
  },
  {
    path: '/patients',
    name: 'Patients',
    component: PatientsView,
    meta: { requiresAuth: true, roles: ['admin', 'receptionist', 'doctor'] }
  },
  {
    path: '/appointments',
    name: 'Appointments',
    component: AppointmentsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/invoices',
    name: 'Invoices',
    component: InvoicesView,
    meta: { requiresAuth: true, roles: ['admin', 'receptionist', 'patient'] }
  },
  {
    path: '/medical-records',
    name: 'MedicalRecords',
    component: MedicalRecordsView,
    meta: { requiresAuth: true, roles: ['patient', 'doctor'] }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: ReportsView,
    meta: { requiresAuth: true, roles: ['admin'] }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/login')
    return
  }
  
  if (to.path === '/login' && userStore.isAuthenticated) {
    next('/dashboard')
    return
  }
  
  if (to.meta.roles && !to.meta.roles.includes(userStore.user?.role)) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router
