import { db } from '@/lib/db';
import { createNoteSchema, noteFilterSchema, paginationSchema } from '@/lib/validations';
import {
  validateRequest,
  validateQueryParams,
  withAuth,
  successResponse,
  serverErrorResponse,
  getPaginationMeta,
} from '@/lib/api-utils';

// GET /api/notes - Get all notes for current user
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
      const filterResult = validateQueryParams(searchParams, noteFilterSchema);
      if (filterResult.error) return filterResult.error;
      const { categoryId, taskId, isPinned, isArchived, search } = filterResult.data;

      // Build where clause
      const where: any = {
        userId,
        isArchived: isArchived ?? false,
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (taskId) {
        where.taskId = taskId;
      }

      if (isPinned !== undefined) {
        where.isPinned = isPinned;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } },
        ];
      }

      // Get total count
      const total = await db.note.count({ where });

      // Get notes
      const notes = await db.note.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      return successResponse({
        notes,
        pagination: getPaginationMeta(total, page, limit),
      });
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

// POST /api/notes - Create a new note
export async function POST(request: Request) {
  return withAuth(async (userId) => {
    try {
      const validation = await validateRequest(request, createNoteSchema);

      if (validation.error) {
        return validation.error;
      }

      const { title, content, isPinned, categoryId, taskId } = validation.data;

      // Verify category belongs to user if provided
      if (categoryId) {
        const category = await db.category.findFirst({
          where: { id: categoryId, userId },
        });

        if (!category) {
          return serverErrorResponse(new Error('Kategori bulunamadı'));
        }
      }

      // Verify task belongs to user if provided
      if (taskId) {
        const task = await db.task.findFirst({
          where: { id: taskId, userId },
        });

        if (!task) {
          return serverErrorResponse(new Error('Görev bulunamadı'));
        }
      }

      const note = await db.note.create({
        data: {
          title,
          content: content || '',
          isPinned: isPinned || false,
          categoryId,
          taskId,
          userId,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      return successResponse(note, 201);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

