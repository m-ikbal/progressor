import { db } from '@/lib/db';
import { updateCategorySchema } from '@/lib/validations';
import {
  validateRequest,
  withAuth,
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  errorResponse,
} from '@/lib/api-utils';

interface RouteParams {
  params: { id: string };
}

// GET /api/categories/[id] - Get a single category
export async function GET(request: Request, { params }: RouteParams) {
  return withAuth(async (userId) => {
    try {
      const category = await db.category.findFirst({
        where: {
          id: params.id,
          userId,
        },
        include: {
          _count: {
            select: {
              tasks: true,
              notes: true,
            },
          },
        },
      });

      if (!category) {
        return notFoundResponse('Kategori');
      }

      return successResponse(category);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

// PATCH /api/categories/[id] - Update a category
export async function PATCH(request: Request, { params }: RouteParams) {
  return withAuth(async (userId) => {
    try {
      // Check if category exists and belongs to user
      const existingCategory = await db.category.findFirst({
        where: {
          id: params.id,
          userId,
        },
      });

      if (!existingCategory) {
        return notFoundResponse('Kategori');
      }

      const validation = await validateRequest(request, updateCategorySchema);

      if (validation.error) {
        return validation.error;
      }

      const { name, description, color, icon, sortOrder, isArchived } = validation.data;

      // Check for duplicate name if name is being changed
      if (name && name !== existingCategory.name) {
        const duplicateCategory = await db.category.findFirst({
          where: {
            userId,
            name: {
              equals: name,
            },
            id: { not: params.id },
            isArchived: false,
          },
        });

        if (duplicateCategory) {
          return errorResponse('Bu isimde bir kategori zaten mevcut', 409);
        }
      }

      const category = await db.category.update({
        where: { id: params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(color !== undefined && { color }),
          ...(icon !== undefined && { icon }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(isArchived !== undefined && { isArchived }),
        },
        include: {
          _count: {
            select: {
              tasks: true,
              notes: true,
            },
          },
        },
      });

      return successResponse(category);
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(request: Request, { params }: RouteParams) {
  return withAuth(async (userId) => {
    try {
      const category = await db.category.findFirst({
        where: {
          id: params.id,
          userId,
        },
      });

      if (!category) {
        return notFoundResponse('Kategori');
      }

      // Soft delete by archiving
      await db.category.update({
        where: { id: params.id },
        data: { isArchived: true },
      });

      return successResponse({ message: 'Kategori silindi' });
    } catch (error) {
      return serverErrorResponse(error);
    }
  });
}

