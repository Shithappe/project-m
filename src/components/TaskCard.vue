<template>
  <v-card class="task-card">
    <v-card-title>{{ task.title }}</v-card-title>
    <v-card-subtitle>{{ task.assignee }}</v-card-subtitle>
    <v-card-text>{{ task.dueDate }}</v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    task: {
      type: Object,
      required: true,
    },
  },
});
</script>

<style scoped>
.task-card {
  margin-bottom: 10px;
}
</style>
