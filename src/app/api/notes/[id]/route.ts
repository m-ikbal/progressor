import { db } from '@/lib/db';
import { updateNoteSchema } from '@/lib/validations';
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

// GET /api/notes/[id] - Get a single note
export async function GET(request: Request, { params }: RouteParams) {
  return withAuth(async (userId) => {
    try {
      const note = await db.note.findFirst({
        where: {
          id: params.id,
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
              priority: true,
            },
          },
        },
      });

      if (!note) {
        return notFoundResponse('Not');
      }

      return successResponse(note);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

// PATCH /api/notes/[id] - Update a note
export async function PATCH(request: Request, { params }: RouteParams) {
  return withAuth(async (userId) => {
    try {
      const existingNote = await db.note.findFirst({
        where: {
          id: params.id,
          userId,
        },
      });

      if (!existingNote) {
        return notFoundResponse('Not');
      }

      const validation = await validateRequest(request, updateNoteSchema);

      if (validation.error) {
        return validation.error;
      }

      const { title, content, isPinned, categoryId, taskId, isArchived } = validation.data;

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

      const note = await db.note.update({
        where: { id: params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(isPinned !== undefined && { isPinned }),
          ...(categoryId !== undefined && { categoryId }),
          ...(taskId !== undefined && { taskId }),
          ...(isArchived !== undefined && { isArchived }),
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

      return successResponse(note);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (userId) => {
    try {
      const note = await db.note.findFirst({
        where: {
          id: params.id,
          userId,
        },
      });

      if (!note) {
        return notFoundResponse('Not');
      }

      // Soft delete by archiving
      await db.note.update({
        where: { id: params.id },
        data: { isArchived: true },
      });

      return successResponse({ message: 'Not silindi' });
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

