import { defineStore } from 'pinia';
import axios from 'axios';
import { type Task } from '@/Interfaces';

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as Task[],
  }),

  actions: {
    async fetchTasks(projectId: number) {
      // Проверка наличия данных в localStorage
      const localData = localStorage.getItem('tasks');
      if (localData) {
        // Парсим все задачи
        const allTasks = JSON.parse(localData);
        // Фильтруем задачи конкретного проекта
        this.tasks = allTasks.filter((task: Task) => task.projectId === projectId);
      }

      // Если локальных данных нет, запрашиваем с бэкенда
      if (this.tasks.length === 0) {
        const response = await axios.get(`/tasks?projectId=${projectId}`);
        this.tasks = response.data;
      }

      // Синхронизация всех задач в localStorage
      this.syncAllTasksToLocalStorage();
    },

    async fetchTasksAll() {
      // Проверка наличия данных в localStorage
      const localData = localStorage.getItem('tasks');
      if (localData) {
        // Парсим все задачи из localStorage
        this.tasks = JSON.parse(localData);
      } else {
        // Если в localStorage нет, загружаем с бэкенда
        const response = await axios.get('/tasks');
        this.tasks = response.data;
        
        // Сохраняем в localStorage
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
      }

      // Возвращаем загруженные задачи
      return this.tasks;
    },

    // Геттер для получения всех задач
    getAllTasks() {
      return this.tasks;
    },

    async addTask(task: Omit<Task, 'id'>) {
      const newTask = {
        ...task,
        id: Date.now(), // Генерация временного ID
      };
      this.tasks.push(newTask);
      await axios.post('/tasks', newTask);
      
      // Сохраняем все задачи
      this.syncAllTasksToLocalStorage();
    },

    async updateTask(id: number, updatedFields: Partial<Task>) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        Object.assign(task, updatedFields);
        await axios.put(`/tasks/${id}`, task);
        
        // Сохраняем все задачи
        this.syncAllTasksToLocalStorage();
      }
    },

    async updateTaskStatus(taskId: number, newStatus: 'todo' | 'in_progress' | 'done') {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = newStatus;
        
        // Сохраняем все задачи
        this.syncAllTasksToLocalStorage();
      }
    },

    async deleteTask(id: number) {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        this.tasks = this.tasks.filter((t) => t.id !== id);
        await axios.delete(`/tasks/${id}`);
        
        // Сохраняем все задачи
        this.syncAllTasksToLocalStorage();
      }
    },

    syncAllTasksToLocalStorage() {
      // Сохраняем все задачи в localStorage
      localStorage.setItem('tasks', JSON.stringify(this.tasks));
    },
  },

  getters: {
    tasksByStatus: (state) => (status: Task['status']) =>
      state.tasks.filter((t) => t.status === status),

    tasksByProject: (state) => (projectId: number) =>
      state.tasks.filter((t) => t.projectId === projectId),
  },
});