import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, projectId, assigneeId, priority, dueDate, status } = req.body;
  const userId = req.user!.userId;

  const isMember = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId
    }
  });

  if (!isMember) {
    throw new ApiError(403, 'You are not a member of this project');
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      creatorId: userId,
      assigneeId: assigneeId || null,
      priority: priority || 'MEDIUM',
      status: status || 'TODO',
      dueDate: dueDate ? new Date(dueDate) : null
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      creator: {
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
    data: task
  });
});

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { projectId, status, priority, assigneeId } = req.query;

  const where: any = {
    project: {
      members: {
        some: {
          userId
        }
      }
    }
  };

  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: {
        select: {
          id: true,
          name: true
        }
      },
      project: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    success: true,
    data: tasks
  });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const task = await prisma.task.findFirst({
    where: {
      id,
      project: {
        members: {
          some: {
            userId
          }
        }
      }
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      project: {
        select: {
          id: true,
          title: true
        }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  res.json({
    success: true,
    data: task
  });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const { title, description, status, priority, assigneeId, dueDate } = req.body;

  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      project: {
        members: {
          some: {
            userId
          }
        }
      }
    }
  });

  if (!existingTask) {
    throw new ApiError(404, 'Task not found');
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: task
  });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const task = await prisma.task.findFirst({
    where: {
      id,
      project: {
        members: {
          some: {
            userId,
            role: {
              in: ['OWNER', 'ADMIN']
            }
          }
        }
      }
    }
  });

  if (!task) {
    throw new ApiError(404, 'Task not found or you do not have permission to delete it');
  }

  await prisma.task.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
});