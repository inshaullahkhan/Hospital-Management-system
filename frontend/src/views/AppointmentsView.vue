<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">Appointments Management</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-calendar-clock</v-icon>
            Appointments
            <v-spacer></v-spacer>
            <v-btn
              v-if="canCreateAppointment"
              color="primary"
              @click="showCreateDialog = true"
              prepend-icon="mdi-plus"
            >
              New Appointment
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Filters -->
            <v-row class="mb-4">
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="dateFilter"
                  type="date"
                  label="Filter by Date"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="statusFilter"
                  :items="statusOptions"
                  label="Filter by Status"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn @click="loadAppointments" color="primary">
                  <v-icon class="mr-2">mdi-magnify</v-icon>
                  Search
                </v-btn>
              </v-col>
            </v-row>

            <!-- Appointments Table -->
            <v-data-table
              :headers="headers"
              :items="appointments"
              :loading="loading"
              class="appointments-table"
            >
              <template v-slot:item.appointment_date="{ item }">
                {{ formatDate(item.appointment_date) }}
              </template>
              <template v-slot:item.appointment_time="{ item }">
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
              <template v-slot:item.consultation_fee="{ item }">
                ${{ item.consultation_fee }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create Appointment Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600px">
      <v-card>
        <v-card-title>Create New Appointment</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createAppointment">
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="newAppointment.patientId"
                  :items="patients"
                  item-title="full_name"
                  item-value="id"
                  label="Select Patient"
                  variant="outlined"
                  required
                ></v-autocomplete>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="newAppointment.doctorId"
                  :items="doctors"
                  item-title="full_name"
                  item-value="id"
                  label="Select Doctor"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newAppointment.appointmentDate"
                  type="date"
                  label="Appointment Date"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newAppointment.appointmentTime"
                  type="time"
                  label="Appointment Time"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="newAppointment.consultationFee"
                  type="number"
                  label="Consultation Fee"
                  variant="outlined"
                  prefix="$"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="newAppointment.notes"
                  label="Notes (Optional)"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showCreateDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createAppointment" :loading="creating">
            Create Appointment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'

const userStore = useUserStore()
const appStore = useAppStore()

const appointments = ref([])
const patients = ref([])
const doctors = ref([])
const loading = ref(false)
const creating = ref(false)
const showCreateDialog = ref(false)

const dateFilter = ref('')
const statusFilter = ref('')

const newAppointment = ref({
  patientId: null,
  doctorId: null,
  appointmentDate: '',
  appointmentTime: '',
  consultationFee: 50,
  notes: ''
})

const canCreateAppointment = computed(() => {
  return ['admin', 'receptionist'].includes(userStore.userRole)
})

const statusOptions = [
  { title: 'Scheduled', value: 'scheduled' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' },
  { title: 'No Show', value: 'no_show' }
]

const headers = [
  { title: 'Date', key: 'appointment_date' },
  { title: 'Time', key: 'appointment_time' },
  { title: 'Patient', key: 'patient' },
  { title: 'Doctor', key: 'doctor' },
  { title: 'Fee', key: 'consultation_fee' },
  { title: 'Status', key: 'status' }
]

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (time) => {
  return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
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

const loadAppointments = async () => {
  loading.value = true
  try {
    const params = {}
    if (dateFilter.value) params.date = dateFilter.value
    if (statusFilter.value) params.status = statusFilter.value

    const response = await axios.get('/appointments', { params })
    appointments.value = response.data.appointments
  } catch (error) {
    console.error('Failed to load appointments:', error)
    appStore.showSnackbar('Failed to load appointments', 'error')
  } finally {
    loading.value = false
  }
}

const loadPatientsAndDoctors = async () => {
  try {
    const [patientsResponse, doctorsResponse] = await Promise.all([
      axios.get('/patients'),
      axios.get('/doctors')
    ])

    patients.value = patientsResponse.data.patients.map(p => ({
      id: p.id,
      full_name: `${p.first_name} ${p.last_name} (${p.id_card_number})`
    }))

    doctors.value = doctorsResponse.data.doctors.map(d => ({
      id: d.id,
      full_name: `Dr. ${d.first_name} ${d.last_name} - ${d.specialization}`
    }))
  } catch (error) {
    console.error('Failed to load patients/doctors:', error)
  }
}

const createAppointment = async () => {
  creating.value = true
  try {
    await axios.post('/appointments', newAppointment.value)
    appStore.showSnackbar('Appointment created successfully!', 'success')
    showCreateDialog.value = false
    loadAppointments()
    
    // Reset form
    newAppointment.value = {
      patientId: null,
      doctorId: null,
      appointmentDate: '',
      appointmentTime: '',
      consultationFee: 50,
      notes: ''
    }
  } catch (error) {
    console.error('Failed to create appointment:', error)
    appStore.showSnackbar(error.response?.data?.message || 'Failed to create appointment', 'error')
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadAppointments()
  if (canCreateAppointment.value) {
    loadPatientsAndDoctors()
  }
})
</script>

<style scoped>
.appointments-table {
  font-size: 0.875rem;
}
</style>
