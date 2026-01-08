'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Pin,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { TaskStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  task: {
    id: string;
    title: string;
    status: TaskStatus;
  } | null;
}

interface NoteListProps {
  notes: Note[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
};

export function NoteList({ notes }: NoteListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteNote = useMemo(() => {
    return notes.find((n) => n.id === deleteNoteId) ?? null;
  }, [notes, deleteNoteId]);

  const onDelete = async () => {
    if (!deleteNoteId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notes/${deleteNoteId}`, {
        method: 'DELETE',
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: 'Hata',
          description: result.error || 'Not silinemedi',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Başarılı',
        description: 'Not silindi',
      });

      setDeleteNoteId(null);
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

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz not yok</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Öğrendiklerinizi not edin, kategorilere ve görevlere bağlayın.
            Bilgilerinizi düzenli tutun.
          </p>
          <Button asChild>
            <Link href="/notes/new">
              İlk Notunuzu Oluşturun
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
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {notes.map((note) => (
          <motion.div key={note.id} variants={itemVariants}>
            <Card hoverable className="h-full">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {note.category && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: note.category.color }}
                      />
                    )}
                    {note.isPinned && (
                      <Pin className="h-4 w-4 text-primary fill-primary shrink-0" />
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/notes/${note.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Düzenle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => {
                          e.preventDefault();
                          setDeleteNoteId(note.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Link href={`/notes/${note.id}/edit`} className="flex-1 group">
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {truncate(note.content.replace(/[#*`]/g, ''), 150)}
                  </p>
                </Link>

                <div className="mt-auto pt-4 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {note.category && <span>{note.category.name}</span>}
                      {note.task && (
                        <>
                          {note.category && <span>•</span>}
                          <span className="truncate max-w-[100px]">{note.task.title}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(note.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Dialog
        open={!!deleteNoteId}
        onOpenChange={(open) => {
          if (!open) setDeleteNoteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notu sil?</DialogTitle>
            <DialogDescription>
              {deleteNote
                ? `"${deleteNote.title}" notunu silmek istediğine emin misin? Bu işlem notu arşivler.`
                : 'Bu notu silmek istediğine emin misin? Bu işlem notu arşivler.'}
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

