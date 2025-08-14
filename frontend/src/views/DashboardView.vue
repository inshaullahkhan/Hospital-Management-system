<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">
          Welcome back, {{ userStore.userFullName }}!
        </h1>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3" v-for="stat in statistics" :key="stat.title">
        <v-card class="stat-card" :color="stat.color" dark>
          <v-card-text>
            <div class="d-flex align-center">
              <div>
                <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
                <div class="text-subtitle-1">{{ stat.title }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-icon size="48" class="opacity-75">{{ stat.icon }}</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Role-specific content -->
    <v-row class="mt-6">
      <!-- Admin Dashboard -->
      <template v-if="userStore.isAdmin">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-chart-line</v-icon>
              System Overview
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item>
                  <v-list-item-title>Total Users</v-list-item-title>
                  <v-list-item-subtitle>{{ dashboardData.totalUsers }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Active Doctors</v-list-item-title>
                  <v-list-item-subtitle>{{ dashboardData.activeDoctors }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Registered Patients</v-list-item-title>
                  <v-list-item-subtitle>{{ dashboardData.totalPatients }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-account-multiple</v-icon>
              Quick Actions
            </v-card-title>
            <v-card-text>
              <v-btn
                color="primary"
                block
                class="mb-3"
                to="/users"
                prepend-icon="mdi-account-plus"
              >
                Manage Users
              </v-btn>
              <v-btn
                color="secondary"
                block
                class="mb-3"
                to="/appointments"
                prepend-icon="mdi-calendar-plus"
              >
                View All Appointments
              </v-btn>
              <v-btn
                color="success"
                block
                to="/reports"
                prepend-icon="mdi-chart-box"
              >
                Generate Reports
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </template>

      <!-- Receptionist Dashboard -->
      <template v-if="userStore.isReceptionist">
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-calendar-today</v-icon>
              Today's Appointments
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="appointmentHeaders"
                :items="todaysAppointments"
                :loading="loadingAppointments"
                no-data-text="No appointments for today"
                class="appointment-table"
              >
                <template v-slot:item.time="{ item }">
                  {{ formatTime(item.appointment_time) }}
                </template>
                <template v-slot:item.patient="{ item }">
                  {{ item.patient_first_name }} {{ item.patient_last_name }}
                </template>
                <template v-slot:item.doctor="{ item }">
                  Dr. {{ item.doctor_first_name }} {{ item.doctor_last_name }}
                </template>
                <template v-slot:item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    size="small"
                    variant="flat"
                  >
                    {{ item.status }}
                  </v-chip>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-plus-circle</v-icon>
              Quick Actions
            </v-card-title>
            <v-card-text>
              <v-btn
                color="primary"
                block
                class="mb-3"
                to="/appointments"
                prepend-icon="mdi-calendar-plus"
              >
                New Appointment
              </v-btn>
              <v-btn
                color="secondary"
                block
                class="mb-3"
                to="/patients"
                prepend-icon="mdi-account-plus"
              >
                Add Patient
              </v-btn>
              <v-btn
                color="success"
                block
                to="/invoices"
                prepend-icon="mdi-receipt"
              >
                View Invoices
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </template>

      <!-- Doctor Dashboard -->
      <template v-if="userStore.isDoctor">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-calendar-today</v-icon>
              My Appointments Today
            </v-card-title>
            <v-card-text>
              <v-data-table
                :headers="doctorAppointmentHeaders"
                :items="myAppointments"
                :loading="loadingAppointments"
                no-data-text="No appointments scheduled for today"
              >
                <template v-slot:item.time="{ item }">
                  {{ formatTime(item.appointment_time) }}
                </template>
                <template v-slot:item.patient="{ item }">
                  {{ item.patient_first_name }} {{ item.patient_last_name }}
                </template>
                <template v-slot:item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    size="small"
                    variant="flat"
                  >
                    {{ item.status }}
                  </v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn
                    v-if="item.status === 'scheduled'"
                    size="small"
                    color="primary"
                    @click="markCompleted(item)"
                  >
                    Mark Complete
                  </v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </template>

      <!-- Patient Dashboard -->
      <template v-if="userStore.isPatient">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-calendar-clock</v-icon>
              Upcoming Appointments
            </v-card-title>
            <v-card-text>
              <v-list v-if="upcomingAppointments.length">
                <v-list-item
                  v-for="appointment in upcomingAppointments"
                  :key="appointment.id"
                >
                  <v-list-item-title>
                    Dr. {{ appointment.doctor_first_name }} {{ appointment.doctor_last_name }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(appointment.appointment_date) }} at {{ formatTime(appointment.appointment_time) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              <div v-else class="text-center text-medium-emphasis">
                No upcoming appointments
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-receipt</v-icon>
              Recent Invoices
            </v-card-title>
            <v-card-text>
              <v-list v-if="recentInvoices.length">
                <v-list-item
                  v-for="invoice in recentInvoices"
                  :key="invoice.id"
                >
                  <v-list-item-title>{{ invoice.invoice_number }}</v-list-item-title>
                  <v-list-item-subtitle>
                    ${{ invoice.total_amount }} - {{ invoice.payment_status }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              <div v-else class="text-center text-medium-emphasis">
                No recent invoices
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </template>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const dashboardData = ref({
  totalUsers: 0,
  activeDoctors: 0,
  totalPatients: 0,
  todaysAppointments: 0
})

const todaysAppointments = ref([])
const myAppointments = ref([])
const upcomingAppointments = ref([])
const recentInvoices = ref([])
const loadingAppointments = ref(false)

const statistics = computed(() => {
  const role = userStore.userRole
  
  if (role === 'admin') {
    return [
      { title: 'Total Users', value: dashboardData.value.totalUsers, icon: 'mdi-account-group', color: 'primary' },
      { title: 'Active Doctors', value: dashboardData.value.activeDoctors, icon: 'mdi-doctor', color: 'success' },
      { title: 'Total Patients', value: dashboardData.value.totalPatients, icon: 'mdi-account-heart', color: 'info' },
      { title: "Today's Appointments", value: dashboardData.value.todaysAppointments, icon: 'mdi-calendar-today', color: 'warning' }
    ]
  } else if (role === 'receptionist') {
    return [
      { title: "Today's Appointments", value: todaysAppointments.value.length, icon: 'mdi-calendar-today', color: 'primary' },
      { title: 'Pending Invoices', value: 0, icon: 'mdi-receipt', color: 'warning' },
      { title: 'Total Patients', value: dashboardData.value.totalPatients, icon: 'mdi-account-heart', color: 'info' },
      { title: 'Active Doctors', value: dashboardData.value.activeDoctors, icon: 'mdi-doctor', color: 'success' }
    ]
  } else if (role === 'doctor') {
    return [
      { title: "Today's Appointments", value: myAppointments.value.length, icon: 'mdi-calendar-today', color: 'primary' },
      { title: 'My Patients', value: 0, icon: 'mdi-account-heart', color: 'info' },
      { title: 'Completed Today', value: myAppointments.value.filter(a => a.status === 'completed').length, icon: 'mdi-check-circle', color: 'success' },
      { title: 'Pending', value: myAppointments.value.filter(a => a.status === 'scheduled').length, icon: 'mdi-clock', color: 'warning' }
    ]
  } else {
    return [
      { title: 'Upcoming Appointments', value: upcomingAppointments.value.length, icon: 'mdi-calendar-clock', color: 'primary' },
      { title: 'Medical Records', value: 0, icon: 'mdi-file-document', color: 'info' },
      { title: 'Pending Invoices', value: recentInvoices.value.filter(i => i.payment_status === 'pending').length, icon: 'mdi-receipt', color: 'warning' },
      { title: 'Paid Invoices', value: recentInvoices.value.filter(i => i.payment_status === 'paid').length, icon: 'mdi-check-circle', color: 'success' }
    ]
  }
})

const appointmentHeaders = [
  { title: 'Time', key: 'time' },
  { title: 'Patient', key: 'patient' },
  { title: 'Doctor', key: 'doctor' },
  { title: 'Status', key: 'status' }
]

const doctorAppointmentHeaders = [
  { title: 'Time', key: 'time' },
  { title: 'Patient', key: 'patient' },
  { title: 'Phone', key: 'patient_phone' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' }
]

const formatTime = (time) => {
  return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'scheduled': return 'primary'
    case 'completed': return 'success'
    case 'cancelled': return 'error'
    case 'no_show': return 'warning'
    default: return 'gray'
  }
}

const loadDashboardData = async () => {
  try {
    loadingAppointments.value = true
    
    // Load different data based on user role
    const role = userStore.userRole
    const today = new Date().toISOString().split('T')[0]
    
    if (role === 'admin' || role === 'receptionist') {
      // Load today's appointments
      const appointmentsResponse = await axios.get('/appointments', {
        params: { date: today }
      })
      todaysAppointments.value = appointmentsResponse.data.appointments
      
      // Load basic statistics
      const [usersResponse, doctorsResponse, patientsResponse] = await Promise.all([
        axios.get('/users?limit=1'),
        axios.get('/doctors'),
        axios.get('/patients?limit=1')
      ])
      
      dashboardData.value = {
        totalUsers: usersResponse.data.pagination?.totalUsers || 0,
        activeDoctors: doctorsResponse.data.doctors?.length || 0,
        totalPatients: patientsResponse.data.pagination?.totalPatients || 0,
        todaysAppointments: todaysAppointments.value.length
      }
    }
    
    if (role === 'doctor') {
      // Load my appointments for today
      const response = await axios.get('/appointments', {
        params: { date: today }
      })
      myAppointments.value = response.data.appointments
    }
    
    if (role === 'patient') {
      // Load upcoming appointments and recent invoices
      const [appointmentsResponse, invoicesResponse] = await Promise.all([
        axios.get('/appointments'),
        axios.get('/invoices')
      ])
      
      upcomingAppointments.value = appointmentsResponse.data.appointments
        .filter(a => new Date(a.appointment_date) >= new Date())
        .slice(0, 5)
      
      recentInvoices.value = invoicesResponse.data.invoices.slice(0, 5)
    }
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loadingAppointments.value = false
  }
}

const markCompleted = async (appointment) => {
  try {
    await axios.put(`/appointments/${appointment.id}`, {
      status: 'completed'
    })
    appointment.status = 'completed'
  } catch (error) {
    console.error('Failed to update appointment:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.appointment-table {
  font-size: 0.875rem;
}
</style>
