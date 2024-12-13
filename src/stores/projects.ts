import { defineStore } from 'pinia';
import axios from 'axios';
import { type Project } from '@/Interfaces';

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [] as Project[],
  }),

  actions: {
    async fetchProjects() {
      // Проверка наличия данных в localStorage
      const localData = localStorage.getItem('projects');
      if (localData) {
        this.projects = JSON.parse(localData);
      } else {
        const response = await axios.get('/projects');
        this.projects = response.data;
        // Сохранение данных в localStorage
        localStorage.setItem('projects', JSON.stringify(this.projects));
      }
    },

    getTitleProject(id: number) {
      const project = this.projects.find((p) => p.id === id.toString());
      return project ? project.title : 'Unknown Project';
    },

    async addProject(project: Omit<Project, 'id' | 'tasksCount' | 'createdAt'>) {
      const newProject = {
        ...project,
        id: Date.now(), // Генерация временного ID
        tasksCount: 0,
        createdAt: new Date().toISOString(),
      };
      const response = await axios.post('/projects', newProject);
      this.projects.push(response.data);
      // Сохранение обновленного списка в localStorage
      localStorage.setItem('projects', JSON.stringify(this.projects));
    },

    async updateProject(id: number, updatedFields: Partial<Project>) {
      const project = this.projects.find((p) => p.id === id);
      if (project) {
        Object.assign(project, updatedFields);
        await axios.put(`/projects/${id}`, project);
        // Сохранение обновленного списка в localStorage
        localStorage.setItem('projects', JSON.stringify(this.projects));
      }
    },

    async deleteProject(id: number) {
      this.projects = this.projects.filter((p) => p.id !== id);
      await axios.delete(`/projects/${id}`);
      // Сохранение обновленного списка в localStorage
      localStorage.setItem('projects', JSON.stringify(this.projects));
    },
  },

  getters: {
    activeProjects(state): Project[] {
      return state.projects.filter((p) => p.status === 'active');
    },
  },

  watch: {
    // Слежение за изменениями массива projects
    projects: {
      handler(newProjects) {
        // Автоматическое сохранение данных в localStorage при изменении
        localStorage.setItem('projects', JSON.stringify(newProjects));
      },
      deep: true,
    },
  },
});
