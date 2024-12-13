<script lang="ts">
import { defineComponent, ref, onMounted, watch } from "vue";
import { useTasksStore } from "@/stores/tasks";
import { useProjectsStore } from "@/stores/projects";
import Chart from "chart.js/auto";

export default defineComponent({
  name: "ProjectsPieChart",
  setup() {
    const tasksStore = useTasksStore();
    const projectsStore = useProjectsStore();
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    let chartInstance: Chart | null = null;

    // Функция создания диаграммы
    const createChart = () => {
      if (!chartCanvas.value) {
        console.warn("Canvas element not found");
        return;
      }

      if (chartInstance) {
        chartInstance.destroy(); // Уничтожаем предыдущую диаграмму
      }

      // Группировка задач по проектам
      const projectTaskCounts = projectsStore.projects.map((project) => {
        return {
          title: project.title,
          taskCount: tasksStore.tasks.filter((task) => task.projectId === Number(project.id)).length,
        };
      });

      console.log("Project task counts:", projectTaskCounts);

      const labels = projectTaskCounts.map((item) => item.title);
      const data = projectTaskCounts.map((item) => item.taskCount);

      // Проверяем, есть ли данные для отображения
      if (data.every((count) => count === 0)) {
        console.warn("No data to display in the chart");
        return;
      }

      // Создание диаграммы
      chartInstance = new Chart(chartCanvas.value, {
        type: "pie",
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: labels.map(
                (_, index) => `hsl(${(index * 360) / labels.length}, 70%, 70%)`
              ),
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });
    };

    // Загрузка данных
    const fetchData = async () => {
      await projectsStore.fetchProjects();
      await tasksStore.fetchTasks();
      console.log("Projects:", projectsStore.projects);
      console.log("Tasks:", tasksStore.tasks);
      createChart();
    };

    // Создаем диаграмму после загрузки данных
    onMounted(fetchData);

    // Обновляем диаграмму при изменении данных
    watch(
      () => [projectsStore.projects, tasksStore.tasks],
      () => createChart(),
      { deep: true }
    );

    return {
      chartCanvas,
    };
  },
});
</script>

<template>
  <div>
    <canvas ref="chartCanvas" style="max-width: 600px; margin: 0 auto;" />
  </div>
</template>
