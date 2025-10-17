import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task CRUD operations
router.post('/', taskController.create.bind(taskController));
router.get('/:id', taskController.getById.bind(taskController));
router.put('/:id', taskController.update.bind(taskController));
router.delete('/:id', taskController.delete.bind(taskController));

// Task dependencies
router.post('/:id/dependencies', taskController.addDependency.bind(taskController));
router.delete('/:id/dependencies/:dependsOnId', taskController.removeDependency.bind(taskController));

// Task progress
router.patch('/:id/progress', taskController.updateProgress.bind(taskController));

export default router;
