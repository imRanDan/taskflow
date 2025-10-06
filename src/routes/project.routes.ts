import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
} from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', validateRequest(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;