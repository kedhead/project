import { PrismaClient, Project, TeamRole } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger.util.js';

const prisma = new PrismaClient();

// Validation schemas
export const createProjectSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(data: CreateProjectInput, creatorId: string): Promise<Project> {
    logger.info('Creating new project', { creatorId, projectName: data.name, teamId: data.teamId });

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: data.teamId,
          userId: creatorId,
        },
      },
    });

    if (!membership) {
      throw new Error('You must be a team member to create projects');
    }

    // Check if user has permission (OWNER or ADMIN)
    if (membership.role !== TeamRole.OWNER && membership.role !== TeamRole.ADMIN) {
      throw new Error('Only team owners and admins can create projects');
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        teamId: data.teamId,
        createdById: creatorId,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
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
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    logger.info('Project created successfully', { projectId: project.id });
    return project;
  }

  /**
   * Get all projects for a user (across all their teams)
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    logger.info('Fetching projects for user', { userId });

    // Get all teams the user is a member of
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    const teamIds = userTeams.map((membership) => membership.teamId);

    const projects = await prisma.project.findMany({
      where: {
        teamId: {
          in: teamIds,
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
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
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Projects fetched successfully', { userId, count: projects.length });
    return projects;
  }

  /**
   * Get all projects for a specific team
   */
  async getTeamProjects(teamId: string, userId: string): Promise<Project[]> {
    logger.info('Fetching projects for team', { teamId, userId });

    // Check if user is a member of the team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('Team not found or access denied');
    }

    const projects = await prisma.project.findMany({
      where: { teamId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
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
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Team projects fetched successfully', { teamId, count: projects.length });
    return projects;
  }

  /**
   * Get a single project by ID
   */
  async getProjectById(projectId: string, userId: string): Promise<Project> {
    logger.info('Fetching project by ID', { projectId, userId });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: {
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
          },
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            dependencies: {
              include: {
                dependsOn: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
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

    if (!project) {
      throw new Error('Project not found');
    }

    // Check if user is a member of the project's team
    const isMember = project.team.members.some((member) => member.userId === userId);
    if (!isMember) {
      throw new Error('Access denied');
    }

    logger.info('Project fetched successfully', { projectId });
    return project;
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string,
    data: UpdateProjectInput,
    userId: string
  ): Promise<Project> {
    logger.info('Updating project', { projectId, userId });

    // Get project and check permissions
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

    // Check if user is a member and has permission
    const membership = project.team.members.find((m) => m.userId === userId);
    if (!membership) {
      throw new Error('Access denied');
    }

    if (membership.role !== TeamRole.OWNER && membership.role !== TeamRole.ADMIN) {
      throw new Error('Only team owners and admins can update projects');
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
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
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    logger.info('Project updated successfully', { projectId });
    return updatedProject;
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    logger.info('Deleting project', { projectId, userId });

    // Get project and check permissions
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

    // Check if user is a member and has permission
    const membership = project.team.members.find((m) => m.userId === userId);
    if (!membership) {
      throw new Error('Access denied');
    }

    if (membership.role !== TeamRole.OWNER && membership.role !== TeamRole.ADMIN) {
      throw new Error('Only team owners and admins can delete projects');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    logger.info('Project deleted successfully', { projectId });
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string, userId: string) {
    logger.info('Fetching project statistics', { projectId, userId });

    const project = await this.getProjectById(projectId, userId);

    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
    });

    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where: { projectId },
      _count: true,
    });

    const stats = {
      totalTasks: project.tasks.length,
      tasksByStatus: taskStats.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      tasksByPriority: priorityStats.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
      teamMembersCount: project.team.members.length,
      startDate: project.startDate,
      endDate: project.endDate,
    };

    logger.info('Project statistics fetched successfully', { projectId });
    return stats;
  }
}
