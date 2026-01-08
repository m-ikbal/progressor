import { redirect } from 'next/navigation';

interface CategoryPageProps {
  params: { id: string };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  // We don't have a dedicated category detail page yet; redirect to filtered tasks.
  redirect(`/tasks?category=${params.id}`);
}


