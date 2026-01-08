import { redirect } from 'next/navigation';

interface NotePageProps {
  params: { id: string };
}

export default function NotePage({ params }: NotePageProps) {
  // No dedicated note detail page yet; redirect to edit.
  redirect(`/notes/${params.id}/edit`);
}


