import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { NewNoteForm } from '@/components/notes/new-note-form';

export default async function NewNotePage() {
  const session = await getAuthSession();

  const [categories, tasks] = await Promise.all([
    db.category.findMany({
      where: { userId: session!.user.id, isArchived: false },
      select: { id: true, name: true, color: true },
      orderBy: { sortOrder: 'asc' },
    }),
    db.task.findMany({
      where: {
        userId: session!.user.id,
        isArchived: false,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
      select: { id: true, title: true },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: 50,
    }),
  ]);

  return <NewNoteForm categories={categories} tasks={tasks} />;
}

