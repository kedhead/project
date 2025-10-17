import { Request, Response } from 'express';
import { TeamService, createTeamSchema, updateTeamSchema, addMemberSchema, updateMemberRoleSchema } from '../services/team.service';
import { logger } from '../utils/logger.util';

const teamService = new TeamService();

export class TeamController {
  /**
   * Create a new team
   * POST /api/teams
   */
  async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const validatedData = createTeamSchema.parse(req.body);

      const team = await teamService.createTeam(validatedData, userId);

      res.status(201).json({
        success: true,
        data: team,
        message: 'Team created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating team', { error: error.message });

      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create team',
        error: error.message,
      });
    }
  }

  /**
   * Get all teams for the authenticated user
   * GET /api/teams
   */
  async getUserTeams(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const teams = await teamService.getUserTeams(userId);

      res.status(200).json({
        success: true,
        data: teams,
        count: teams.length,
      });
    } catch (error: any) {
      logger.error('Error fetching user teams', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teams',
        error: error.message,
      });
    }
  }

  /**
   * Get a single team by ID
   * GET /api/teams/:id
   */
  async getTeamById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const team = await teamService.getTeamById(id, userId);

      res.status(200).json({
        success: true,
        data: team,
      });
    } catch (error: any) {
      logger.error('Error fetching team', { error: error.message, teamId: req.params.id });

      if (error.message === 'Team not found or access denied') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch team',
        error: error.message,
      });
    }
  }

  /**
   * Update a team
   * PUT /api/teams/:id
   */
  async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const validatedData = updateTeamSchema.parse(req.body);

      const team = await teamService.updateTeam(id, validatedData, userId);

      res.status(200).json({
        success: true,
        data: team,
        message: 'Team updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating team', { error: error.message, teamId: req.params.id });

      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      if (error.message.includes('Only team owners')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update team',
        error: error.message,
      });
    }
  }

  /**
   * Delete a team
   * DELETE /api/teams/:id
   */
  async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await teamService.deleteTeam(id, userId);

      res.status(200).json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting team', { error: error.message, teamId: req.params.id });

      if (error.message.includes('Only team owners')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete team',
        error: error.message,
      });
    }
  }

  /**
   * Add a member to a team
   * POST /api/teams/:id/members
   */
  async addMember(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.user!.userId;
      const { id } = req.params;
      const validatedData = addMemberSchema.parse(req.body);

      const member = await teamService.addMember(id, validatedData, requesterId);

      res.status(201).json({
        success: true,
        data: member,
        message: 'Member added successfully',
      });
    } catch (error: any) {
      logger.error('Error adding team member', { error: error.message, teamId: req.params.id });

      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      if (error.message.includes('Only team owners') || error.message.includes('already a member')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add member',
        error: error.message,
      });
    }
  }

  /**
   * Remove a member from a team
   * DELETE /api/teams/:id/members/:userId
   */
  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.user!.userId;
      const { id, userId } = req.params;

      await teamService.removeMember(id, userId, requesterId);

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error: any) {
      logger.error('Error removing team member', { error: error.message, teamId: req.params.id });

      if (error.message.includes('Only team owners') || error.message.includes('cannot remove')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message === 'Member not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to remove member',
        error: error.message,
      });
    }
  }

  /**
   * Update member role
   * PUT /api/teams/:id/members/:userId
   */
  async updateMemberRole(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.user!.userId;
      const { id, userId } = req.params;
      const validatedData = updateMemberRoleSchema.parse(req.body);

      const member = await teamService.updateMemberRole(id, userId, validatedData, requesterId);

      res.status(200).json({
        success: true,
        data: member,
        message: 'Member role updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating member role', { error: error.message, teamId: req.params.id });

      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      if (error.message.includes('Only team owners')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message === 'Member not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update member role',
        error: error.message,
      });
    }
  }
}
