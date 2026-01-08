import { db } from '@/lib/db';
import { updateTaskSchema } from '@/lib/validations';
import {
  validateRequest,
  withAuth,
  successResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-utils';

interface RouteParams {
  params: { id: string };
}

const CATEGORY_SELECT = {
  id: true,
  name: true,
  color: true,
  icon: true,
} as const;

function parseDueDate(dueDate: unknown): Date | null {
  if (dueDate === undefined) return null;
  if (!dueDate) return null;
  if (dueDate instanceof Date) return dueDate;
  if (typeof dueDate !== 'string') return null;

  // Handle HTML date input: YYYY-MM-DD -> create local date (prevents timezone day-shift)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    const [y, m, d] = dueDate.split('-').map((x) => Number(x));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  const parsed = new Date(dueDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// GET /api/tasks/[id] - Get a single task
export async function GET(request: Request, { params }: RouteParams) {
  return withAuth(async (userId) => {
    try {
      const task = await db.task.findFirst({
        where: {
          id: params.id,
          userId,
        },
        include: {
          category: {
            select: CATEGORY_SELECT,
          },
          notes: {
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!task) {
        return notFoundResponse('Görev');
      }

      return successResponse(task);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(request: Request, { params }: RouteParams) {
  return withAuth(async (userId) => {
    try {
      const existingTask = await db.task.findFirst({
        where: {
          id: params.id,
          userId,
        },
      });

      if (!existingTask) {
        return notFoundResponse('Görev');
      }

      const validation = await validateRequest(request, updateTaskSchema);

      if (validation.error) {
        return validation.error;
      }

      const {
        title,
        description,
        status,
        priority,
        progress,
        dueDate,
        categoryId,
        isArchived,
      } = validation.data;

      // Verify category belongs to user if provided
      if (categoryId) {
        const category = await db.category.findFirst({
          where: { id: categoryId, userId, isArchived: false },
        });

        if (!category) {
          return notFoundResponse('Kategori');
        }
      }

      // Set completedAt if status is being changed to COMPLETED
      let completedAt = existingTask.completedAt;
      if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
        completedAt = new Date();
      } else if (status && status !== 'COMPLETED') {
        completedAt = null;
      }

      // Auto-set progress based on status
      let finalProgress = progress;
      if (status === 'COMPLETED') {
        finalProgress = 100;
      } else if (status === 'TODO' && progress === undefined) {
        finalProgress = 0;
      }

      const task = await db.task.update({
        where: { id: params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(priority !== undefined && { priority }),
          ...(finalProgress !== undefined && { progress: finalProgress }),
          ...(dueDate !== undefined && { dueDate: parseDueDate(dueDate) }),
          ...(categoryId !== undefined && { categoryId }),
          ...(isArchived !== undefined && { isArchived }),
          completedAt,
        },
        include: {
          category: {
            select: CATEGORY_SELECT,
          },
        },
      });

      return successResponse(task);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (userId) => {
    try {
      // Soft delete by archiving
      const result = await db.task.updateMany({
        where: { id: params.id, userId },
        data: { isArchived: true },
      });

      if (result.count === 0) {
        return notFoundResponse('Görev');
      }

      return successResponse({ message: 'Görev silindi' });
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

