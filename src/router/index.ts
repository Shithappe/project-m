import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Projects.vue'),
    },
    {
      path: '/project/:id',
      name: 'Tasks',
      component: () => import('@/views/Tasks.vue'),
    }
  ],
})

export default router
