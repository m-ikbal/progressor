import { redirect } from 'next/navigation';

interface TaskPageProps {
  params: { id: string };
}

export default function TaskPage({ params }: TaskPageProps) {
  // No dedicated task detail page yet; redirect to edit.
  redirect(`/tasks/${params.id}/edit`);
}


