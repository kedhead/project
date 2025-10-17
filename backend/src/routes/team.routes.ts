import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { ProjectController } from '../controllers/project.controller';
import { authenticateToken } from '../middleware/authenticate';

const router = Router();
const teamController = new TeamController();
const projectController = new ProjectController();

// All routes require authentication
router.use(authenticateToken);

// Team CRUD operations
router.post('/', (req, res) => teamController.createTeam(req, res));
router.get('/', (req, res) => teamController.getUserTeams(req, res));
router.get('/:id', (req, res) => teamController.getTeamById(req, res));
router.put('/:id', (req, res) => teamController.updateTeam(req, res));
router.delete('/:id', (req, res) => teamController.deleteTeam(req, res));

// Team member management
router.post('/:id/members', (req, res) => teamController.addMember(req, res));
router.delete('/:id/members/:userId', (req, res) => teamController.removeMember(req, res));
router.put('/:id/members/:userId', (req, res) => teamController.updateMemberRole(req, res));

// Team projects
router.get('/:teamId/projects', (req, res) => projectController.getTeamProjects(req, res));

export default router;
