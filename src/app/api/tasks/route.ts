import { db } from '@/lib/db';
import { createTaskSchema, taskFilterSchema, paginationSchema } from '@/lib/validations';
import type { Prisma } from '@prisma/client';
import {
  validateRequest,
  validateQueryParams,
  withAuth,
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  getPaginationMeta,
} from '@/lib/api-utils';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  color: true,
  icon: true,
} as const;

const TASK_LIST_INCLUDE = {
  category: { select: CATEGORY_SELECT },
  _count: { select: { notes: true } },
} as const;

function parseDueDate(dueDate: unknown): Date | null {
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

// GET /api/tasks - Get all tasks for current user
export async function GET(request: Request) {
  return withAuth(async (userId) => {
    try {
      const { searchParams } = new URL(request.url);

      // Parse pagination
      const paginationResult = validateQueryParams(searchParams, paginationSchema);
      if (paginationResult.error) return paginationResult.error;
      const page = paginationResult.data.page ?? 1;
      const limit = paginationResult.data.limit ?? 20;

      // Parse filters
      const filterResult = validateQueryParams(searchParams, taskFilterSchema);
      if (filterResult.error) return filterResult.error;
      const { status, priority, categoryId, isArchived, search } = filterResult.data;

      // Build where clause
      const where: Prisma.TaskWhereInput = {
        userId,
        isArchived: isArchived ?? false,
      };

      if (status) {
        where.status = Array.isArray(status) ? { in: status } : status;
      }

      if (priority) {
        where.priority = Array.isArray(priority) ? { in: priority } : priority;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
        ];
      }

      // Get total count
      const total = await db.task.count({ where });

      // Get tasks
      const tasks = await db.task.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: TASK_LIST_INCLUDE,
      });

      return successResponse({
        tasks,
        pagination: getPaginationMeta(total, page, limit),
      });
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  return withAuth(async (userId) => {
    try {
      const validation = await validateRequest(request, createTaskSchema);

      if (validation.error) {
        return validation.error;
      }

      const { title, description, status, priority, progress, dueDate, categoryId } =
        validation.data;

      // Verify category belongs to user if provided
      if (categoryId) {
        const category = await db.category.findFirst({
          where: { id: categoryId, userId, isArchived: false },
        });

        if (!category) {
          return notFoundResponse('Kategori');
        }
      }

      const task = await db.task.create({
        data: {
          title,
          description,
          status: status || 'TODO',
          priority: priority || 'MEDIUM',
          progress: progress || 0,
          dueDate: parseDueDate(dueDate),
          categoryId,
          userId,
        },
        include: {
          category: {
            select: CATEGORY_SELECT,
          },
        },
      });

      return successResponse(task, 201);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

