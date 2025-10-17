import apiClient from './client';
import {
  Team,
  CreateTeamData,
  UpdateTeamData,
  AddMemberData,
  UpdateMemberRoleData,
  TeamMember,
  ApiResponse,
} from '../types';

export const teamApi = {
  /**
   * Create a new team
   * POST /api/teams
   */
  createTeam: async (data: CreateTeamData): Promise<Team> => {
    const response = await apiClient.post<ApiResponse<Team>>('/teams', data);
    return response.data.data;
  },

  /**
   * Get all teams for the authenticated user
   * GET /api/teams
   */
  getUserTeams: async (): Promise<Team[]> => {
    const response = await apiClient.get<ApiResponse<Team[]>>('/teams');
    return response.data.data;
  },

  /**
   * Get a single team by ID
   * GET /api/teams/:id
   */
  getTeamById: async (teamId: string): Promise<Team> => {
    const response = await apiClient.get<ApiResponse<Team>>(`/teams/${teamId}`);
    return response.data.data;
  },

  /**
   * Update a team
   * PUT /api/teams/:id
   */
  updateTeam: async (teamId: string, data: UpdateTeamData): Promise<Team> => {
    const response = await apiClient.put<ApiResponse<Team>>(`/teams/${teamId}`, data);
    return response.data.data;
  },

  /**
   * Delete a team
   * DELETE /api/teams/:id
   */
  deleteTeam: async (teamId: string): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}`);
  },

  /**
   * Add a member to a team
   * POST /api/teams/:id/members
   */
  addMember: async (teamId: string, data: AddMemberData): Promise<TeamMember> => {
    const response = await apiClient.post<ApiResponse<TeamMember>>(
      `/teams/${teamId}/members`,
      data
    );
    return response.data.data;
  },

  /**
   * Remove a member from a team
   * DELETE /api/teams/:id/members/:userId
   */
  removeMember: async (teamId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}/members/${userId}`);
  },

  /**
   * Update member role
   * PUT /api/teams/:id/members/:userId
   */
  updateMemberRole: async (
    teamId: string,
    userId: string,
    data: UpdateMemberRoleData
  ): Promise<TeamMember> => {
    const response = await apiClient.put<ApiResponse<TeamMember>>(
      `/teams/${teamId}/members/${userId}`,
      data
    );
    return response.data.data;
  },
};
