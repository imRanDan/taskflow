import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const userId = req.user!.userId;

  const project = await prisma.project.create({
    data: {
      title,
      description,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: 'OWNER'
        }
      }
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: project
  });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          tasks: true,
          members: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  res.json({
    success: true,
    data: projects
  });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const project = await prisma.project.findFirst({
    where: {
      id,
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  res.json({
    success: true,
    data: project
  });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const userId = req.user!.userId;

  const member = await prisma.projectMember.findFirst({
    where: {
      projectId: id,
      userId,
      role: {
        in: ['OWNER', 'ADMIN']
      }
    }
  });

  if (!member) {
    throw new ApiError(403, 'You do not have permission to update this project');
  }

  const project = await prisma.project.update({
    where: { id },
    data: { title, description }
  });

  res.json({
    success: true,
    data: project
  });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const project = await prisma.project.findFirst({
    where: {
      id,
      ownerId: userId
    }
  });

  if (!project) {
    throw new ApiError(404, 'Project not found or you are not the owner');
  }

  await prisma.project.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
});