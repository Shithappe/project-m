<template>
  <div class="task-column">
    <h3>{{ title }}</h3>
    <draggable
      :list="tasks"
      group="tasks"
      @change="onTaskMoved"
      class="task-list"
      :data-status="status"
    >
      <TaskCard v-for="task in tasks" :key="task.id" :task="task" />
    </draggable>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import draggable from 'vuedraggable';
import TaskCard from './TaskCard.vue';

export default defineComponent({
  components: { draggable, TaskCard },
  props: {
    title: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    tasks: {
      type: Array,
      required: true,
    },
  },
  setup(props, { emit }) {
    const onTaskMoved = (event: any) => {
      if (event.added) {
        const task = event.added.element;
        const newStatus = event.to.getAttribute('data-status');
        emit('taskMoved', { taskId: task.id, newStatus });
      }
    };

    return {
      onTaskMoved,
    };
  },
});
</script>

<style scoped>
.task-column {
  flex: 1;
  margin: 10px;
}

.task-list {
  min-height: 200px;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
}
</style>
