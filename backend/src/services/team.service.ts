import { PrismaClient, Team, TeamRole, TeamMember } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger.util.js';

const prisma = new PrismaClient();

// Validation schemas
export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().max(500).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export class TeamService {
  /**
   * Create a new team
   */
  async createTeam(data: CreateTeamInput, creatorId: string): Promise<Team> {
    logger.info('Creating new team', { creatorId, teamName: data.name });

    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        createdById: creatorId,
        members: {
          create: {
            userId: creatorId,
            role: TeamRole.OWNER,
          },
        },
      },
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

    logger.info('Team created successfully', { teamId: team.id });
    return team;
  }

  /**
   * Get all teams for a user
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    logger.info('Fetching teams for user', { userId });

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
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
            projects: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Teams fetched successfully', { userId, count: teams.length });
    return teams;
  }

  /**
   * Get a single team by ID
   */
  async getTeamById(teamId: string, userId: string): Promise<Team> {
    logger.info('Fetching team by ID', { teamId, userId });

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        projects: {
          include: {
            createdBy: {
              select: {
                id: true,
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

    if (!team) {
      throw new Error('Team not found or access denied');
    }

    logger.info('Team fetched successfully', { teamId });
    return team;
  }

  /**
   * Update a team
   */
  async updateTeam(
    teamId: string,
    data: UpdateTeamInput,
    userId: string
  ): Promise<Team> {
    logger.info('Updating team', { teamId, userId });

    // Check if user is owner or admin
    const membership = await this.getUserMembership(teamId, userId);
    if (!membership || (membership.role !== TeamRole.OWNER && membership.role !== TeamRole.ADMIN)) {
      throw new Error('Only team owners and admins can update team details');
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data,
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

    logger.info('Team updated successfully', { teamId });
    return team;
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamId: string, userId: string): Promise<void> {
    logger.info('Deleting team', { teamId, userId });

    // Check if user is owner
    const membership = await this.getUserMembership(teamId, userId);
    if (!membership || membership.role !== TeamRole.OWNER) {
      throw new Error('Only team owners can delete teams');
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    logger.info('Team deleted successfully', { teamId });
  }

  /**
   * Add a member to a team
   */
  async addMember(
    teamId: string,
    data: AddMemberInput,
    requesterId: string
  ): Promise<TeamMember> {
    logger.info('Adding member to team', { teamId, newUserId: data.userId, requesterId });

    // Check if requester is owner or admin
    const requesterMembership = await this.getUserMembership(teamId, requesterId);
    if (
      !requesterMembership ||
      (requesterMembership.role !== TeamRole.OWNER &&
        requesterMembership.role !== TeamRole.ADMIN)
    ) {
      throw new Error('Only team owners and admins can add members');
    }

    // Check if user already exists in team
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: data.userId,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this team');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId: data.userId,
        role: data.role as TeamRole,
      },
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
    });

    logger.info('Member added successfully', { teamId, userId: data.userId });
    return member;
  }

  /**
   * Remove a member from a team
   */
  async removeMember(
    teamId: string,
    userIdToRemove: string,
    requesterId: string
  ): Promise<void> {
    logger.info('Removing member from team', { teamId, userIdToRemove, requesterId });

    // Check if requester is owner or admin
    const requesterMembership = await this.getUserMembership(teamId, requesterId);
    if (
      !requesterMembership ||
      (requesterMembership.role !== TeamRole.OWNER &&
        requesterMembership.role !== TeamRole.ADMIN)
    ) {
      throw new Error('Only team owners and admins can remove members');
    }

    // Check if trying to remove themselves and they're the owner
    if (requesterId === userIdToRemove) {
      const membership = await this.getUserMembership(teamId, userIdToRemove);
      if (membership?.role === TeamRole.OWNER) {
        throw new Error('Team owner cannot remove themselves. Transfer ownership or delete the team.');
      }
    }

    // Check if member exists
    const memberToRemove = await this.getUserMembership(teamId, userIdToRemove);
    if (!memberToRemove) {
      throw new Error('Member not found in this team');
    }

    // Prevent removing owner unless requester is also owner
    if (memberToRemove.role === TeamRole.OWNER && requesterMembership.role !== TeamRole.OWNER) {
      throw new Error('Only owners can remove other owners');
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: userIdToRemove,
        },
      },
    });

    logger.info('Member removed successfully', { teamId, userIdToRemove });
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    teamId: string,
    userIdToUpdate: string,
    data: UpdateMemberRoleInput,
    requesterId: string
  ): Promise<TeamMember> {
    logger.info('Updating member role', { teamId, userIdToUpdate, newRole: data.role, requesterId });

    // Check if requester is owner
    const requesterMembership = await this.getUserMembership(teamId, requesterId);
    if (!requesterMembership || requesterMembership.role !== TeamRole.OWNER) {
      throw new Error('Only team owners can change member roles');
    }

    // Check if member exists
    const memberToUpdate = await this.getUserMembership(teamId, userIdToUpdate);
    if (!memberToUpdate) {
      throw new Error('Member not found in this team');
    }

    const updatedMember = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: userIdToUpdate,
        },
      },
      data: {
        role: data.role as TeamRole,
      },
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
    });

    logger.info('Member role updated successfully', { teamId, userIdToUpdate, newRole: data.role });
    return updatedMember;
  }

  /**
   * Get user's membership in a team
   */
  private async getUserMembership(
    teamId: string,
    userId: string
  ): Promise<TeamMember | null> {
    return prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });
  }
}
