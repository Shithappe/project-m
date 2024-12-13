<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="12" lg="10">
        <v-row>
          <v-col cols="12" class="d-flex mt-4 gap-4">
            <h1 class="text-h4 mr-4 text-center">{{ projectTitle }}</h1>

            <v-select
              v-model="selectedExecutor"
              :items="executors"
              item-title="name"
              item-value="id"
              label="Filter by Executor"
              clearable
              variant="outlined"
              density="compact"
              class="mr-4"
              style="max-width: 250px;"
            ></v-select>
            
            <v-select
              v-model="deadlineSort"
              :items="deadlineSortOptions"
              label="Sort by dueDate"
              clearable
              variant="outlined"
              density="compact"
              style="max-width: 250px;"
            ></v-select>
          </v-col>
        </v-row>
      </v-col>
      
      <v-col cols="12" md="12" lg="10">
        <div class="task-board">
          <div class="board-columns">
            <div
              v-for="(column, columnIndex) in filteredColumns"
              :key="column.status"
              class="board-column"
            >
              <div class="column-header d-flex mb-2 justify-space-between align-center">
                <h2>{{ getColumnTitle(column.status) }}</h2>
                <v-btn 
                  @click="openNewTaskModal(column.status)" 
                  density="compact"
                  variant="plain"
                >
                  Add
                </v-btn>
              </div>
              <draggable
                :list="column.tasks"
                :group="{ name: 'tasks', pull: true, put: true }"
                @change="(evt) => handleDragChange(evt, column.status)"
                item-key="id"
                class="draggable-list"
              >
                <template #item="{ element }">
                  <div 
                    class="task-card"
                    @click="openNewTaskModal('isEdit', element)"
                  >
                    <div class="task-title">{{ element.title }}</div>
                    <div class="task-details">
                      <div>Executor: {{ element.assignee?.name || 'Unassigned' }}</div>
                      <div v-if="element.dueDate" :class="getDeadlineClass(element.dueDate)">
                        {{ formatDeadlineInfo(element.dueDate) }}
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- New Task Modal -->
    <v-dialog v-model="newTaskModal" max-width="500px">
      <v-card>
        <v-card-title>{{ isEditMode ? 'Edit Task' : 'Create New Task' }}</v-card-title>
        <v-card-text>
          <v-form ref="newTaskForm">
            <v-text-field
              v-model="newTask.title"
              label="Task Title"
              variant="outlined"
              required
              class="mb-3"
            ></v-text-field>
            
            <v-textarea
              v-model="newTask.description"
              label="Description"
              variant="outlined"
              rows="3"
              class="mb-3"
            ></v-textarea>
            
            <v-select
              v-model="newTask.assignee"
              :items="executors"
              item-title="name"
              item-value="id"
              label="Assignee"
              variant="outlined"
              clearable
              class="mb-3"
            ></v-select>
            
            <v-text-field
              v-model="formattedDueDate"
              label="Due Date"
              variant="outlined"
              readonly
              @click="showDatePicker = true"
              append-inner-icon="mdi-calendar"
              class="mb-3"
            ></v-text-field>

            <v-dialog
              v-model="showDatePicker"
              width="290px"
            >
              <v-date-picker
                v-model="newTask.dueDate"
                @update:model-value="closeDatePicker"
              ></v-date-picker>
            </v-dialog>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeNewTaskModal" text>Cancel</v-btn>
          <v-btn v-if="isEditMode" @click="editTask" color="primary">Save</v-btn>
          <v-btn v-else @click="createNewTask" color="primary">Create Task</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import Draggable from 'vuedraggable'

// Types
import { type Task, type Executor, type Column } from '@/Interfaces';

// Hooks and Store
const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const route = useRoute()
const projectId = computed(() => parseInt(route.params.id as string, 10))
const projectTitle = computed(() => projectsStore.getTitleProject(projectId.value));

// Filters
const selectedExecutor = ref<number | null>(null)
const deadlineSort = ref<string | null>(null)

const deadlineSortOptions = [
  { title: 'Nearest', value: 'nearest' },
  { title: 'Latest', value: 'latest' }
]

// Executors derived from tasks
const executors = computed(() => {
  const uniqueExecutors = new Map<number, Executor>()
  tasksStore.tasks.forEach(task => {
    if (task.assignee && !uniqueExecutors.has(task.assignee.id)) {
      uniqueExecutors.set(task.assignee.id, task.assignee)
    }
  })
  return Array.from(uniqueExecutors.values())
})

// Columns Configuration
const columns = ref<Column[]>([
  {
    title: 'To Do',
    status: 'todo',
    tasks: []
  },
  {
    title: 'In Progress',
    status: 'in_progress',
    tasks: []
  },
  {
    title: 'Done',
    status: 'done',
    tasks: []
  }
])

// Computed filtered and sorted columns
const filteredColumns = computed(() => {
  return columns.value.map(column => {
    let filteredTasks = column.tasks

    // Filter by assignee
    if (selectedExecutor.value) {
      filteredTasks = filteredTasks.filter(
        task => task.assignee?.id === selectedExecutor.value
      )
    }

    // Sort by dueDate
    if (deadlineSort.value === 'nearest') {
      filteredTasks.sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    } else if (deadlineSort.value === 'latest') {
      filteredTasks.sort((a, b) => {
        if (!a.dueDate) return -1
        if (!b.dueDate) return 1
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      })
    }

    return {
      ...column,
      tasks: filteredTasks
    }
  })
})

// Column title mapping
const getColumnTitle = (status: Task['status']) => {
  const titles = {
    'todo': 'To Do',
    'in_progress': 'In Progress',
    'done': 'Done'
  }
  return titles[status]
}

// dueDate formatting and status
const formatDeadlineInfo = (dueDate: string) => {
  const deadlineDate = new Date(dueDate)
  const today = new Date()
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0) {
    return `dueDate in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
  } else if (diffDays === 0) {
    return 'dueDate today'
  } else {
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`
  }
}

// dueDate status class
const getDeadlineClass = (dueDate: string) => {
  const deadlineDate = new Date(dueDate)
  const today = new Date()
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 3) return 'dueDate-far'
  if (diffDays > 0) return 'dueDate-near'
  return 'dueDate-overdue'
}

// Populate columns with tasks
const fetchTasks = () => {
  columns.value.forEach(column => {
    column.tasks = tasksStore.tasks.filter(task => task.status === column.status)
  })
}
// Initialize Tasks
onMounted(async () => {
  await projectsStore.fetchProjects()
  await tasksStore.fetchTasks(projectId.value)
 
  fetchTasks()
})

// Drag and Drop Handler
const handleDragChange = (event: any, newStatus: Task['status']) => {
  if (event.added) {
    const movedTask = event.added.element
    // Update task status in store
    tasksStore.updateTaskStatus(movedTask.id, newStatus)
  } else if (event.moved) {
    const movedTask = event.moved.element
    // Optionally handle reordering within the same column
    console.log('Task reordered', movedTask)
  }
}

const newTaskModal = ref(false)
const newTask = ref({
  title: '',
  description: '',
  assignee: null,
  dueDate: null,
  status: 'todo' as 'todo' | 'in_progress' | 'done',
  projectId: projectId
})

const isEditMode = ref(false)
// Create/edit task
const openNewTaskModal = (status: 'todo' | 'in_progress' | 'done', task?: Task) => {
  if (task) {
    console.log(task);
    
    isEditMode.value = true
    newTask.value = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      assignee: task.assignee?.id || null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      status: task.status
    }
  }
  else {
    newTask.value = {
      title: '',
      description: '',
      assignee: null,
      dueDate: null,
      status: status
    }
  }
  newTaskModal.value = true
}

const closeNewTaskModal = () => {
  newTaskModal.value = false
  isEditMode.value = false
}

const createNewTask = async () => {
  if (!newTask.value.title) {
    // Простая валидация
    return
  }

  await tasksStore.addTask({
    title: newTask.value.title,
    description: newTask.value.description,
    status: newTask.value.status,
    dueDate: newTask.value.dueDate ? new Date(newTask.value.dueDate).toISOString() : undefined,
    assignee: newTask.value.assignee ? executors.value.find(e => e.id === newTask.value.assignee) : undefined,
    projectId: projectId.value
  })
  fetchTasks()
  closeNewTaskModal()
}

const editTask = async () => {
  if (!newTask.value.title) {
    // Простая валидация
    return
  }

  await tasksStore.updateTask(newTask.value.id, {
    title: newTask.value.title,
    description: newTask.value.description,
    status: newTask.value.status,
    dueDate: newTask.value.dueDate ? new Date(newTask.value.dueDate).toISOString() : undefined,
    assignee: newTask.value.assignee ? executors.value.find(e => e.id === newTask.value.assignee) : undefined,
    projectId: projectId.value
  })

  closeNewTaskModal()
}

const showDatePicker = ref(false)
const formattedDueDate = computed(() => {
  if (newTask.value.dueDate) {
    return new Date(newTask.value.dueDate).toLocaleDateString()
  }
  return ''
})

const closeDatePicker = () => {
  showDatePicker.value = false
}
</script>

<style scoped lang="scss">
.task-board {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.board-columns {
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.board-column {
  flex: 1;
  background-color: #f4f4f4;
  border-radius: 8px;
  padding: 15px;
  min-height: 400px;
}

.draggable-list {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  cursor: move;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-details {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #666;
}

.dueDate-far {
  color: green;
}

.dueDate-near {
  color: orange;
}

.dueDate-overdue {
  color: red;
  font-weight: bold;
}
</style>
