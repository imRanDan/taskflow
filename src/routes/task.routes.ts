import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createTaskSchema), createTask);
router.get('/', getTasks);
router.get('/:id', getTask);
router.put('/:id', validateRequest(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;