<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="filters.search"
          label="Search by project name"
          variant="outlined"
          density="compact"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="filters.status"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          label="Filter by status"
          variant="outlined"
          density="compact"
          clearable
        ></v-select>
      </v-col>
      <v-col cols="12" md="4" class="d-flex align-center justify-end">
        <v-btn @click="openAddProjectModal" color="primary">
          Add Project
        </v-btn>
      </v-col>
    </v-row>

    <ag-grid-vue
      class="ag-theme-alpine"
      style="width: 100%; height: 200px;"
      :rowData="filteredProjects"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      @row-clicked="onRowClicked"
      :pagination="true"
      :paginationPageSize="10"
    ></ag-grid-vue>

    <v-dialog v-model="showAddProjectModal" max-width="500px">
      <v-card>
        <v-card-title>Add Project</v-card-title>
        <v-card-text>
          <v-form ref="addProjectForm" @submit.prevent="addProject">
            <v-text-field
              v-model="newProject.title"
              label="Project Title"
              variant="outlined"
              :rules="[v => !!v || 'Title is required']"
              required
            ></v-text-field>
            <v-textarea
              v-model="newProject.description"
              label="Project Description"
              variant="outlined"
              rows="3"
            ></v-textarea>
            <v-select
              v-model="newProject.status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="Project Status"
              variant="outlined"
              required
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="showAddProjectModal = false">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="addProject">
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- <ProjectsPieChart /> -->
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from 'ag-grid-vue3'
import { ColDef } from 'ag-grid-community'
import { useProjectsStore } from '@/stores/projects'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule } from 'ag-grid-community'
// import ProjectsPieChart from '@/components/ProjectsPieChart.vue'

// Register the necessary modules
ModuleRegistry.registerModules([ClientSideRowModelModule])

// Interfaces
interface Project {
  id: number
  title: string
  description?: string
  status: 'active' | 'archived'
  tasksCount: number
  createdAt: string
}

// Composables
const router = useRouter()
const projectsStore = useProjectsStore()

// Reactive State
const filters = ref({
  search: '',
  status: ''
})

const showAddProjectModal = ref(false)
const newProject = ref<Partial<Project>>({
  title: '',
  description: '',
  status: 'active'
})

// Column Definitions
const columnDefs = ref<ColDef[]>([
  {
    headerName: 'Project ID',
    field: 'id',
    sortable: true,
    filter: 'agNumberColumnFilter',
    resizable: true,
    width: 120
  },
  {
    headerName: 'Title',
    field: 'title',
    sortable: true,
    filter: 'agTextColumnFilter',
    resizable: true
  },
  {
    headerName: 'Task Count',
    field: 'tasksCount',
    sortable: true,
    filter: 'agNumberColumnFilter',
    resizable: true,
    width: 120
  },
  {
    headerName: 'Status',
    field: 'status',
    sortable: true,
    filter: 'agSetColumnFilter',
    resizable: true,
    width: 120,
    cellRenderer: (params: any) => {
      return params.value === 'active'
        ? '<span class="text-success">Active</span>'
        : '<span class="text-error">Archived</span>'
    }
  },
  {
    headerName: 'Created At',
    field: 'createdAt',
    sortable: true,
    filter: 'agDateColumnFilter',
    resizable: true,
    width: 150
  }
])

// Default Column Definition
const defaultColDef = {
  flex: 1,
  minWidth: 100,
  filter: true
}

// Status Options
const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Archived', value: 'archived' }
]

// Computed Properties
const filteredProjects = computed(() => {
  return projectsStore.projects.filter((project) => {
    const matchesSearch = !filters.value.search ||
      project.title.toLowerCase().includes(filters.value.search.toLowerCase())
    const matchesStatus = !filters.value.status ||
      project.status === filters.value.status
    return matchesSearch && matchesStatus
  })
})

// Methods
const openAddProjectModal = () => {
  newProject.value = {
    title: '',
    description: '',
    status: 'active'
  }
  showAddProjectModal.value = true
}

const addProject = async () => {
  if (!newProject.value.title) return

  await projectsStore.addProject(newProject.value as Project)
  showAddProjectModal.value = false
}

const onRowClicked = (event: any) => {
  const project = event.data
  router.push({ name: 'Tasks', params: { id: project.id } })
}

// Lifecycle Hooks
onMounted(async () => {
  await projectsStore.fetchProjects()
})
</script>

<style scoped lang="scss">
:deep(.ag-root-wrapper) {
  border-radius: 8px;
}
</style>
