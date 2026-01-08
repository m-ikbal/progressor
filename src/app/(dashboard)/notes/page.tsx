import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { NoteList } from '@/components/notes/note-list';
import { NoteFilters } from '@/components/notes/note-filters';
import type { TaskStatus } from '@/types';

interface NotesPageProps {
  searchParams: {
    category?: string;
    pinned?: string;
  };
}

async function getNotes(userId: string, filters: NotesPageProps['searchParams']) {
  const where: any = {
    userId,
    isArchived: false,
  };

  if (filters.category) {
    where.categoryId = filters.category;
  }

  if (filters.pinned === 'true') {
    where.isPinned = true;
  }

  const notes = await db.note.findMany({
    where,
    orderBy: [
      { isPinned: 'desc' },
      { updatedAt: 'desc' },
    ],
    include: {
      category: {
        select: {
          id: true,
          name: true,
          color: true,
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

  // Prisma schema uses `String` for Task.status; narrow it to our app union for UI consumption.
  return notes.map((n) => ({
    ...n,
    task: n.task
      ? {
          ...n.task,
          status: n.task.status as TaskStatus,
        }
      : null,
  }));
}

async function getCategories(userId: string) {
  return db.category.findMany({
    where: { userId, isArchived: false },
    select: { id: true, name: true, color: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const session = await getAuthSession();
  const [notes, categories] = await Promise.all([
    getNotes(session!.user.id, searchParams),
    getCategories(session!.user.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notlar</h1>
          <p className="text-muted-foreground mt-1">
            Öğrendiklerinizi kaydedin ve düzenleyin
          </p>
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Not
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <NoteFilters categories={categories} />

      {/* Note List */}
      <Suspense fallback={<div className="h-64 skeleton rounded-xl" />}>
        <NoteList notes={notes} />
      </Suspense>
    </div>
  );
}

