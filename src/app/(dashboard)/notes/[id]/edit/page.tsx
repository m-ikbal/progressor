import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { EditNoteForm } from '@/components/notes/edit-note-form';

interface EditNotePageProps {
  params: { id: string };
}

export default async function EditNotePage({ params }: EditNotePageProps) {
  const session = await getAuthSession();

  const [note, categories, tasks] = await Promise.all([
    db.note.findFirst({
      where: { id: params.id, userId: session!.user.id, isArchived: false },
      select: {
        id: true,
        title: true,
        content: true,
        isPinned: true,
        categoryId: true,
        taskId: true,
      },
    }),
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

  if (!note) {
    redirect('/notes');
  }

  return (
    <EditNoteForm
      noteId={note.id}
      categories={categories}
      tasks={tasks}
      initialNote={{
        title: note.title,
        content: note.content,
        isPinned: note.isPinned,
        categoryId: note.categoryId,
        taskId: note.taskId,
      }}
    />
  );
}


