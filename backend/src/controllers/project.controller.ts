import { Request, Response } from 'express';
import { ProjectService, createProjectSchema, updateProjectSchema } from '../services/project.service.js';
import { logger } from '../utils/logger.util.js';

const projectService = new ProjectService();

export class ProjectController {
  /**
   * Create a new project
   * POST /api/projects
   */
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const validatedData = createProjectSchema.parse(req.body);

      const project = await projectService.createProject(validatedData, userId);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating project', { error: error.message });

      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      if (error.message.includes('must be a team member') || error.message.includes('Only team owners')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create project',
        error: error.message,
      });
    }
  }

  /**
   * Get all projects for the authenticated user
   * GET /api/projects
   */
  async getUserProjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const projects = await projectService.getUserProjects(userId);

      res.status(200).json({
        success: true,
        data: projects,
        count: projects.length,
      });
    } catch (error: any) {
      logger.error('Error fetching user projects', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
        error: error.message,
      });
    }
  }

  /**
   * Get all projects for a specific team
   * GET /api/teams/:teamId/projects
   */
  async getTeamProjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { teamId } = req.params;

      const projects = await projectService.getTeamProjects(teamId, userId);

      res.status(200).json({
        success: true,
        data: projects,
        count: projects.length,
      });
    } catch (error: any) {
      logger.error('Error fetching team projects', { error: error.message, teamId: req.params.teamId });

      if (error.message === 'Team not found or access denied') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch projects',
        error: error.message,
      });
    }
  }

  /**
   * Get a single project by ID
   * GET /api/projects/:id
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const project = await projectService.getProjectById(id, userId);

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error: any) {
      logger.error('Error fetching project', { error: error.message, projectId: req.params.id });

      if (error.message === 'Project not found' || error.message === 'Access denied') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch project',
        error: error.message,
      });
    }
  }

  /**
   * Update a project
   * PUT /api/projects/:id
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const validatedData = updateProjectSchema.parse(req.body);

      const project = await projectService.updateProject(id, validatedData, userId);

      res.status(200).json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating project', { error: error.message, projectId: req.params.id });

      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      if (error.message === 'Project not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes('Only team owners') || error.message === 'Access denied') {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update project',
        error: error.message,
      });
    }
  }

  /**
   * Delete a project
   * DELETE /api/projects/:id
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await projectService.deleteProject(id, userId);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting project', { error: error.message, projectId: req.params.id });

      if (error.message === 'Project not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes('Only team owners') || error.message === 'Access denied') {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete project',
        error: error.message,
      });
    }
  }

  /**
   * Get project statistics
   * GET /api/projects/:id/stats
   */
  async getProjectStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const stats = await projectService.getProjectStats(id, userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error fetching project stats', { error: error.message, projectId: req.params.id });

      if (error.message === 'Project not found' || error.message === 'Access denied') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch project statistics',
        error: error.message,
      });
    }
  }
}
