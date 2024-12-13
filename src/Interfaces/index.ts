export interface Project {
  id: number;
  title: string;
  description: string;
  tasksCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string;
  assignee?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Executor {
  id: number
  name: string
}

export interface Column {
  title: string
  status: Task['status']
  tasks: Task[]
}