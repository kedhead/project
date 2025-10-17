import { Response } from 'express';
import { TaskService, createTaskSchema, updateTaskSchema, addDependencySchema } from '../services/task.service';
import { logger } from '../utils/logger.util';
import { AuthRequest } from '../middleware/authenticate';

const taskService = new TaskService();

export class TaskController {
  /**
   * Create a new task
   * POST /api/tasks
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const validated = createTaskSchema.parse(req.body);
      const task = await taskService.createTask(validated, req.user!.userId);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error: any) {
      logger.error('Task creation failed', { error: error.message, userId: req.user?.userId });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: error.errors,
        });
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create task',
        code: 'TASK_CREATE_FAILED',
      });
    }
  }

  /**
   * Get all tasks for a project
   * GET /api/projects/:projectId/tasks
   */
  async getProjectTasks(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Project ID is required',
          code: 'MISSING_PROJECT_ID',
        });
      }

      const tasks = await taskService.getProjectTasks(projectId, req.user!.userId);

      res.json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error: any) {
      logger.error('Failed to fetch project tasks', {
        error: error.message,
        projectId: req.params.projectId,
        userId: req.user?.userId,
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch tasks',
        code: 'TASKS_FETCH_FAILED',
      });
    }
  }

  /**
   * Get a single task by ID
   * GET /api/tasks/:id
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Task ID is required',
          code: 'MISSING_TASK_ID',
        });
      }

      const task = await taskService.getTaskById(id, req.user!.userId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error: any) {
      logger.error('Failed to fetch task', {
        error: error.message,
        taskId: req.params.id,
        userId: req.user?.userId,
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch task',
        code: 'TASK_FETCH_FAILED',
      });
    }
  }

  /**
   * Update a task
   * PUT /api/tasks/:id
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Task ID is required',
          code: 'MISSING_TASK_ID',
        });
      }

      const validated = updateTaskSchema.parse(req.body);
      const task = await taskService.updateTask(id, validated, req.user!.userId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error: any) {
      logger.error('Task update failed', {
        error: error.message,
        taskId: req.params.id,
        userId: req.user?.userId,
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: error.errors,
        });
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update task',
        code: 'TASK_UPDATE_FAILED',
      });
    }
  }

  /**
   * Delete a task
   * DELETE /api/tasks/:id
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Task ID is required',
          code: 'MISSING_TASK_ID',
        });
      }

      await taskService.deleteTask(id, req.user!.userId);

      res.json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error: any) {
      logger.error('Task deletion failed', {
        error: error.message,
        taskId: req.params.id,
        userId: req.user?.userId,
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete task',
        code: 'TASK_DELETE_FAILED',
      });
    }
  }

  /**
   * Add a dependency to a task
   * POST /api/tasks/:id/dependencies
   */
  async addDependency(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Task ID is required',
          code: 'MISSING_TASK_ID',
        });
      }

      const validated = addDependencySchema.parse(req.body);
      await taskService.addDependency(id, validated, req.user!.userId);

      res.status(201).json({
        success: true,
        message: 'Dependency added successfully',
      });
    } catch (error: any) {
      logger.error('Failed to add dependency', {
        error: error.message,
        taskId: req.params.id,
        userId: req.user?.userId,
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: error.errors,
        });
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to add dependency',
        code: 'DEPENDENCY_ADD_FAILED',
      });
    }
  }

  /**
   * Remove a dependency from a task
   * DELETE /api/tasks/:id/dependencies/:dependsOnId
   */
  async removeDependency(req: AuthRequest, res: Response) {
    try {
      const { id, dependsOnId } = req.params;

      if (!id || !dependsOnId) {
        return res.status(400).json({
          success: false,
          error: 'Task ID and dependency ID are required',
          code: 'MISSING_IDS',
        });
      }

      await taskService.removeDependency(id, dependsOnId, req.user!.userId);

      res.json({
        success: true,
        message: 'Dependency removed successfully',
      });
    } catch (error: any) {
      logger.error('Failed to remove dependency', {
        error: error.message,
        taskId: req.params.id,
        dependsOnId: req.params.dependsOnId,
        userId: req.user?.userId,
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to remove dependency',
        code: 'DEPENDENCY_REMOVE_FAILED',
      });
    }
  }

  /**
   * Update task progress
   * PATCH /api/tasks/:id/progress
   */
  async updateProgress(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { progress } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Task ID is required',
          code: 'MISSING_TASK_ID',
        });
      }

      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({
          success: false,
          error: 'Progress must be a number between 0 and 100',
          code: 'INVALID_PROGRESS',
        });
      }

      const task = await taskService.updateProgress(id, progress, req.user!.userId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error: any) {
      logger.error('Failed to update progress', {
        error: error.message,
        taskId: req.params.id,
        userId: req.user?.userId,
      });

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update progress',
        code: 'PROGRESS_UPDATE_FAILED',
      });
    }
  }
}

export const taskController = new TaskController();
