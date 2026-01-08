'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  CheckSquare,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getContrastColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalNotes: number;
    progress: number;
  };
}

interface CategoryListProps {
  categories: Category[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteCategory = useMemo(() => {
    return categories.find((c) => c.id === deleteCategoryId) ?? null;
  }, [categories, deleteCategoryId]);

  const onDelete = async () => {
    if (!deleteCategoryId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/categories/${deleteCategoryId}`, {
        method: 'DELETE',
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: 'Hata',
          description: result.error || 'Kategori silinemedi',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Başarılı',
        description: 'Kategori silindi',
      });

      setDeleteCategoryId(null);
      router.refresh();
    } catch {
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz kategori yok</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Öğrenme alanlarınızı organize etmek için kategoriler oluşturun.
            Örneğin: Yazılım, Siber Güvenlik, İngilizce
          </p>
          <Button asChild>
            <Link href="/categories/new">
              İlk Kategorinizi Oluşturun
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {categories.map((category) => (
          <motion.div key={category.id} variants={itemVariants}>
            <Card hoverable className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <FolderKanban
                      className="h-6 w-6"
                      style={{ color: getContrastColor(category.color) }}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/categories/${category.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Düzenle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                          setDeleteCategoryId(category.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Link href={`/tasks?category=${category.id}`} className="block group">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {category.description}
                    </p>
                  )}
                </Link>

                <div className="space-y-4 mt-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">İlerleme</span>
                      <span className="font-semibold">{category.stats.progress}%</span>
                    </div>
                    <Progress
                      value={category.stats.progress}
                      className="h-2"
                      indicatorClassName="transition-all duration-500"
                      style={
                        {
                          '--progress-indicator-color': category.color,
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4" />
                      <span>
                        {category.stats.completedTasks}/{category.stats.totalTasks}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      <span>{category.stats.totalNotes}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Dialog
        open={!!deleteCategoryId}
        onOpenChange={(open) => {
          if (!open) setDeleteCategoryId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyi sil?</DialogTitle>
            <DialogDescription>
              {deleteCategory
                ? `"${deleteCategory.name}" kategorisini silmek istediğine emin misin? Bu işlem kategoriyi arşivler.`
                : 'Bu kategoriyi silmek istediğine emin misin? Bu işlem kategoriyi arşivler.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                İptal
              </Button>
            </DialogClose>
            <Button variant="destructive" isLoading={isDeleting} onClick={onDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

