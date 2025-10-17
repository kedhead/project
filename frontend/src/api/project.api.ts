import apiClient from './client';
import {
  Project,
  CreateProjectData,
  UpdateProjectData,
  ProjectStats,
  ApiResponse,
} from '../types';

export const projectApi = {
  /**
   * Create a new project
   * POST /api/projects
   */
  createProject: async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<Project>>('/projects', data);
    return response.data.data;
  },

  /**
   * Get all projects for the authenticated user
   * GET /api/projects
   */
  getUserProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<ApiResponse<Project[]>>('/projects');
    return response.data.data;
  },

  /**
   * Get all projects for a specific team
   * GET /api/teams/:teamId/projects
   */
  getTeamProjects: async (teamId: string): Promise<Project[]> => {
    const response = await apiClient.get<ApiResponse<Project[]>>(`/teams/${teamId}/projects`);
    return response.data.data;
  },

  /**
   * Get a single project by ID
   * GET /api/projects/:id
   */
  getProjectById: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get<ApiResponse<Project>>(`/projects/${projectId}`);
    return response.data.data;
  },

  /**
   * Update a project
   * PUT /api/projects/:id
   */
  updateProject: async (projectId: string, data: UpdateProjectData): Promise<Project> => {
    const response = await apiClient.put<ApiResponse<Project>>(`/projects/${projectId}`, data);
    return response.data.data;
  },

  /**
   * Delete a project
   * DELETE /api/projects/:id
   */
  deleteProject: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}`);
  },

  /**
   * Get project statistics
   * GET /api/projects/:id/stats
   */
  getProjectStats: async (projectId: string): Promise<ProjectStats> => {
    const response = await apiClient.get<ApiResponse<ProjectStats>>(`/projects/${projectId}/stats`);
    return response.data.data;
  },
};
