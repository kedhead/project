import { PrismaClient, Task, TaskStatus, TaskPriority, DependencyType, TeamRole } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger.util';

const prisma = new PrismaClient();

// Validation schemas
export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  parentId: z.string().uuid().optional().or(z.literal('')),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  duration: z.number().int().min(1, 'Duration must be at least 1 day').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']).optional(),
  color: z.string().max(7).optional().or(z.literal('')),
  isMilestone: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  duration: z.number().int().min(1).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']).optional(),
  color: z.string().max(7).optional().or(z.literal('')),
  isMilestone: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
});

export const addDependencySchema = z.object({
  dependsOnId: z.string().uuid('Invalid task ID'),
  type: z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH']).optional(),
  lagDays: z.number().int().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AddDependencyInput = z.infer<typeof addDependencySchema>;

export class TaskService {
  /**
   * Calculate duration in days between two dates (excluding weekends)
   */
  private calculateDuration(startDate: Date, endDate: Date): number {
    let days = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    return Math.max(1, days);
  }

  /**
   * Add working days to a date (excluding weekends)
   */
  private addWorkingDays(startDate: Date, days: number): Date {
    const result = new Date(startDate);
    let remainingDays = days;

    while (remainingDays > 0) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        remainingDays--;
      }
    }

    return result;
  }

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskInput, creatorId: string): Promise<Task> {
    logger.info('Creating new task', { creatorId, taskTitle: data.title, projectId: data.projectId });

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Check if user is a member of the project's team
    const isMember = project.team.members.some((member) => member.userId === creatorId);
    if (!isMember) {
      throw new Error('You must be a team member to create tasks');
    }

    // Calculate duration if not provided
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const duration = data.duration || this.calculateDuration(startDate, endDate);

    // Verify parent task exists if parentId provided
    if (data.parentId && data.parentId !== '') {
      const parentTask = await prisma.task.findUnique({
        where: { id: data.parentId },
      });
      if (!parentTask) {
        throw new Error('Parent task not found');
      }
      if (parentTask.projectId !== data.projectId) {
        throw new Error('Parent task must belong to the same project');
      }
    }

    // Create task with assignees in a transaction
    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          title: data.title,
          description: data.description || undefined,
          projectId: data.projectId,
          parentId: data.parentId && data.parentId !== '' ? data.parentId : undefined,
          startDate,
          endDate,
          duration,
          priority: (data.priority as TaskPriority) || TaskPriority.MEDIUM,
          status: (data.status as TaskStatus) || TaskStatus.TODO,
          color: data.color || undefined,
          isMilestone: data.isMilestone || false,
          isLocked: data.isLocked || false,
          progress: data.progress || 0,
          createdById: creatorId,
        },
      });

      // Add assignees if provided
      if (data.assigneeIds && data.assigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: data.assigneeIds.map((userId) => ({
            taskId: newTask.id,
            userId,
          })),
        });
      }

      return newTask;
    });

    logger.info('Task created successfully', { taskId: task.id });

    // Fetch complete task with relations
    return this.getTaskById(task.id, creatorId);
  }

  /**
   * Get all tasks for a project
   */
  async getProjectTasks(projectId: string, userId: string): Promise<Task[]> {
    logger.info('Fetching tasks for project', { projectId, userId });

    // Verify user has access to project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const isMember = project.team.members.some((member) => member.userId === userId);
    if (!isMember) {
      throw new Error('Access denied');
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    logger.info('Tasks fetched successfully', { projectId, count: tasks.length });
    return tasks;
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: string, userId: string): Promise<Task> {
    logger.info('Fetching task by ID', { taskId, userId });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
        dependents: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Check if user has access
    const isMember = task.project.team.members.some((member) => member.userId === userId);
    if (!isMember) {
      throw new Error('Access denied');
    }

    logger.info('Task fetched successfully', { taskId });
    return task;
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, data: UpdateTaskInput, userId: string): Promise<Task> {
    logger.info('Updating task', { taskId, userId });

    // Get task and verify permissions
    const task = await this.getTaskById(taskId, userId);

    // Calculate new duration if dates changed
    let duration = task.duration;
    if (data.startDate && data.endDate) {
      duration = data.duration || this.calculateDuration(new Date(data.startDate), new Date(data.endDate));
    }

    // Update task in transaction
    const updatedTask = await prisma.$transaction(async (tx) => {
      // Update task
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          title: data.title,
          description: data.description || undefined,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          duration,
          priority: data.priority as TaskPriority | undefined,
          status: data.status as TaskStatus | undefined,
          color: data.color || undefined,
          isMilestone: data.isMilestone,
          isLocked: data.isLocked,
          progress: data.progress,
        },
      });

      // Update assignees if provided
      if (data.assigneeIds !== undefined) {
        // Remove all existing assignees
        await tx.taskAssignee.deleteMany({
          where: { taskId },
        });

        // Add new assignees
        if (data.assigneeIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: data.assigneeIds.map((uid) => ({
              taskId,
              userId: uid,
            })),
          });
        }
      }

      return updated;
    });

    logger.info('Task updated successfully', { taskId });

    // If dates changed and task is not locked, trigger auto-scheduling
    if ((data.startDate || data.endDate) && !updatedTask.isLocked) {
      await this.autoScheduleDependentTasks(taskId);
    }

    return this.getTaskById(taskId, userId);
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    logger.info('Deleting task', { taskId, userId });

    // Get task and verify permissions
    const task = await this.getTaskById(taskId, userId);

    // Check if user is team owner or admin
    const membership = task.project.team.members.find((m) => m.userId === userId);
    if (!membership || (membership.role !== TeamRole.OWNER && membership.role !== TeamRole.ADMIN)) {
      throw new Error('Only team owners and admins can delete tasks');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    logger.info('Task deleted successfully', { taskId });
  }

  /**
   * Add a dependency to a task
   */
  async addDependency(taskId: string, data: AddDependencyInput, userId: string): Promise<void> {
    logger.info('Adding dependency to task', { taskId, dependsOnId: data.dependsOnId, userId });

    // Verify both tasks exist and user has access
    const task = await this.getTaskById(taskId, userId);
    const dependsOnTask = await this.getTaskById(data.dependsOnId, userId);

    // Verify both tasks belong to the same project
    if (task.projectId !== dependsOnTask.projectId) {
      throw new Error('Tasks must belong to the same project');
    }

    // Check for circular dependencies
    const wouldCreateCircular = await this.wouldCreateCircularDependency(taskId, data.dependsOnId);
    if (wouldCreateCircular) {
      throw new Error('This dependency would create a circular reference');
    }

    await prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnId: data.dependsOnId,
        type: (data.type as DependencyType) || DependencyType.FINISH_TO_START,
        lagDays: data.lagDays || 0,
      },
    });

    logger.info('Dependency added successfully', { taskId, dependsOnId: data.dependsOnId });

    // Trigger auto-scheduling
    if (!task.isLocked) {
      await this.autoScheduleDependentTasks(data.dependsOnId);
    }
  }

  /**
   * Remove a dependency from a task
   */
  async removeDependency(taskId: string, dependsOnId: string, userId: string): Promise<void> {
    logger.info('Removing dependency from task', { taskId, dependsOnId, userId });

    // Verify user has access
    await this.getTaskById(taskId, userId);

    await prisma.taskDependency.deleteMany({
      where: {
        taskId,
        dependsOnId,
      },
    });

    logger.info('Dependency removed successfully', { taskId, dependsOnId });
  }

  /**
   * Check if adding a dependency would create a circular reference
   */
  private async wouldCreateCircularDependency(taskId: string, dependsOnId: string): Promise<boolean> {
    // If a task depends on itself, that's circular
    if (taskId === dependsOnId) {
      return true;
    }

    // Get all dependencies of the task we're trying to depend on
    const visited = new Set<string>();
    const queue: string[] = [dependsOnId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      // If we encounter the original task, we have a circle
      if (currentId === taskId) {
        return true;
      }

      // Get dependencies of current task
      const dependencies = await prisma.taskDependency.findMany({
        where: { taskId: currentId },
        select: { dependsOnId: true },
      });

      queue.push(...dependencies.map((d) => d.dependsOnId));
    }

    return false;
  }

  /**
   * Auto-schedule dependent tasks when a task's dates change
   */
  private async autoScheduleDependentTasks(taskId: string): Promise<void> {
    logger.info('Auto-scheduling dependent tasks', { taskId });

    // Get all tasks that depend on this task
    const dependents = await prisma.taskDependency.findMany({
      where: { dependsOnId: taskId },
      include: {
        task: {
          include: {
            dependencies: {
              include: {
                dependsOn: true,
              },
            },
          },
        },
      },
    });

    for (const dependent of dependents) {
      const task = dependent.task;

      // Skip locked tasks
      if (task.isLocked) {
        continue;
      }

      // Calculate new start date based on dependency type
      let newStartDate = new Date(task.startDate);

      for (const dep of task.dependencies) {
        const depTask = dep.dependsOn;
        let proposedStart: Date;

        switch (dep.type) {
          case DependencyType.FINISH_TO_START:
            // Task starts after dependency finishes
            proposedStart = this.addWorkingDays(new Date(depTask.endDate), dep.lagDays + 1);
            break;

          case DependencyType.START_TO_START:
            // Task starts when dependency starts
            proposedStart = this.addWorkingDays(new Date(depTask.startDate), dep.lagDays);
            break;

          case DependencyType.FINISH_TO_FINISH:
            // Task finishes when dependency finishes
            const ffEndDate = this.addWorkingDays(new Date(depTask.endDate), dep.lagDays);
            proposedStart = this.addWorkingDays(ffEndDate, -task.duration + 1);
            break;

          case DependencyType.START_TO_FINISH:
            // Task finishes when dependency starts
            const sfEndDate = this.addWorkingDays(new Date(depTask.startDate), dep.lagDays);
            proposedStart = this.addWorkingDays(sfEndDate, -task.duration + 1);
            break;

          default:
            continue;
        }

        // Use the latest proposed start date
        if (proposedStart > newStartDate) {
          newStartDate = proposedStart;
        }
      }

      // Calculate new end date
      const newEndDate = this.addWorkingDays(newStartDate, task.duration - 1);

      // Update the task
      await prisma.task.update({
        where: { id: task.id },
        data: {
          startDate: newStartDate,
          endDate: newEndDate,
        },
      });

      logger.info('Task auto-scheduled', {
        taskId: task.id,
        newStartDate: newStartDate.toISOString(),
        newEndDate: newEndDate.toISOString(),
      });

      // Recursively schedule tasks that depend on this one
      await this.autoScheduleDependentTasks(task.id);
    }
  }

  /**
   * Update task progress
   */
  async updateProgress(taskId: string, progress: number, userId: string): Promise<Task> {
    logger.info('Updating task progress', { taskId, progress, userId });

    const task = await this.getTaskById(taskId, userId);

    // Auto-update status based on progress
    let status = task.status;
    if (progress === 0 && status !== TaskStatus.BLOCKED) {
      status = TaskStatus.TODO;
    } else if (progress > 0 && progress < 100) {
      status = TaskStatus.IN_PROGRESS;
    } else if (progress === 100) {
      status = TaskStatus.COMPLETED;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { progress, status },
    });

    logger.info('Task progress updated', { taskId, progress, status });
    return this.getTaskById(taskId, userId);
  }
}
