import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const projectController = new ProjectController();

// All routes require authentication
router.use(authenticate);

// Project CRUD operations
router.post('/', (req, res) => projectController.createProject(req, res));
router.get('/', (req, res) => projectController.getUserProjects(req, res));
router.get('/:id', (req, res) => projectController.getProjectById(req, res));
router.put('/:id', (req, res) => projectController.updateProject(req, res));
router.delete('/:id', (req, res) => projectController.deleteProject(req, res));

// Project statistics
router.get('/:id/stats', (req, res) => projectController.getProjectStats(req, res));

// Project tasks
router.get('/:projectId/tasks', (req, res) => taskController.getProjectTasks(req, res));

export default router;
