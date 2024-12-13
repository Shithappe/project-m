<template>
  <v-card class="task-card">
    <v-card-title>{{ task.title }}</v-card-title>
    <v-card-subtitle>{{ task.assignee }}</v-card-subtitle>
    <v-card-text>Due: {{ task.dueDate }}</v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    task: {
      type: Object as PropType<{ title: string; assignee: string; dueDate: string; status: string }>,
      required: true,
    },
  },
});
</script>

<style scoped>
.task-card {
  margin: 8px;
}
</style>
