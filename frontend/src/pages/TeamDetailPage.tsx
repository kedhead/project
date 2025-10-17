import { FC, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { teamApi } from '../api/team.api';
import { projectApi } from '../api/project.api';
import { Team, Project, TeamRole, AddMemberData } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useAuth } from '../hooks/useAuth';

export const TeamDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState<AddMemberData>({
    userId: '',
    role: TeamRole.MEMBER,
  });

  const fetchTeamData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [teamData, projectsData] = await Promise.all([
        teamApi.getTeamById(id),
        projectApi.getTeamProjects(id),
      ]);
      setTeam(teamData);
      setProjects(projectsData);
    } catch (err: any) {
      console.error('Error fetching team:', err);
      setError(err.response?.data?.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [id]);

  const userMembership = team?.members.find((m) => m.userId === user?.id);
  const isOwner = userMembership?.role === TeamRole.OWNER;
  const isAdmin = userMembership?.role === TeamRole.ADMIN;
  const canManage = isOwner || isAdmin;

  const handleDeleteTeam = async () => {
    if (!team || !id) return;
    if (!confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) return;

    try {
      await teamApi.deleteTeam(id);
      navigate('/teams');
    } catch (err: any) {
      console.error('Error deleting team:', err);
      alert(err.response?.data?.message || 'Failed to delete team');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newMember.userId.trim()) return;

    try {
      setAddingMember(true);
      await teamApi.addMember(id, newMember);
      setShowAddMemberModal(false);
      setNewMember({ userId: '', role: TeamRole.MEMBER });
      fetchTeamData();
    } catch (err: any) {
      console.error('Error adding member:', err);
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!id) return;
    if (!confirm(`Remove ${memberName} from this team?`)) return;

    try {
      await teamApi.removeMember(id, userId);
      fetchTeamData();
    } catch (err: any) {
      console.error('Error removing member:', err);
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Team not found'}</p>
          <Link to="/teams" className="btn-primary">
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
              PM Suite
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                Dashboard
              </Link>
              <Link to="/teams" className="text-gray-600 hover:text-primary-600">
                Teams
              </Link>
              <Link to="/projects" className="text-gray-600 hover:text-primary-600">
                Projects
              </Link>
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <button onClick={() => logout()} className="btn-primary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/teams" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Back to Teams
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
              {team.description && (
                <p className="text-gray-600">{team.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Created {new Date(team.createdAt).toLocaleDateString()}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={handleDeleteTeam}
                className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                Delete Team
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members Section */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Members ({team.members.length})</h2>
                {canManage && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="btn-primary"
                  >
                    Add Member
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.role === TeamRole.OWNER
                          ? 'bg-purple-100 text-purple-700'
                          : member.role === TeamRole.ADMIN
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {member.role}
                      </span>
                      {canManage && member.userId !== user?.id && member.role !== TeamRole.OWNER && (
                        <button
                          onClick={() =>
                            handleRemoveMember(
                              member.userId,
                              `${member.user.firstName} ${member.user.lastName}`
                            )
                          }
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Projects ({projects.length})</h2>
              {projects.length === 0 ? (
                <p className="text-gray-500 text-sm">No projects yet</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {project.tasks?.length || 0} task{project.tasks?.length !== 1 ? 's' : ''}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
              {canManage && (
                <Link
                  to={`/projects/new?teamId=${team.id}`}
                  className="mt-4 block text-center btn-primary"
                >
                  Create Project
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Add Team Member</h3>
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                  User ID *
                </label>
                <input
                  type="text"
                  id="userId"
                  value={newMember.userId}
                  onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  placeholder="Enter user ID"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You need the user's ID to add them to the team
                </p>
              </div>
              <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  id="role"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as TeamRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={TeamRole.MEMBER}>Member</option>
                  <option value={TeamRole.ADMIN}>Admin</option>
                  {isOwner && <option value={TeamRole.OWNER}>Owner</option>}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setNewMember({ userId: '', role: TeamRole.MEMBER });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={addingMember}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={addingMember}
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
