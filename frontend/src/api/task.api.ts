import apiClient from './client';
import { Task, ApiResponse, TaskStatus, TaskPriority, DependencyType } from '../types';

export interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  parentId?: string;
  startDate: string;
  endDate: string;
  duration?: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  color?: string;
  isMilestone?: boolean;
  isLocked?: boolean;
  progress?: number;
  assigneeIds?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  color?: string;
  isMilestone?: boolean;
  isLocked?: boolean;
  progress?: number;
  assigneeIds?: string[];
}

export interface AddDependencyData {
  dependsOnId: string;
  type?: DependencyType;
  lagDays?: number;
}

export const taskApi = {
  /**
   * Create a new task
   */
  createTask: async (data: CreateTaskData): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data;
  },

  /**
   * Get all tasks for a project
   */
  getProjectTasks: async (projectId: string): Promise<Task[]> => {
    const response = await apiClient.get<ApiResponse<Task[]>>(`/projects/${projectId}/tasks`);
    return response.data.data;
  },

  /**
   * Get a single task by ID
   */
  getTaskById: async (taskId: string): Promise<Task> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${taskId}`);
    return response.data.data;
  },

  /**
   * Update a task
   */
  updateTask: async (taskId: string, data: UpdateTaskData): Promise<Task> => {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${taskId}`, data);
    return response.data.data;
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  /**
   * Add a dependency to a task
   */
  addDependency: async (taskId: string, data: AddDependencyData): Promise<void> => {
    await apiClient.post(`/tasks/${taskId}/dependencies`, data);
  },

  /**
   * Remove a dependency from a task
   */
  removeDependency: async (taskId: string, dependsOnId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/dependencies/${dependsOnId}`);
  },

  /**
   * Update task progress
   */
  updateProgress: async (taskId: string, progress: number): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${taskId}/progress`, { progress });
    return response.data.data;
  },
};
