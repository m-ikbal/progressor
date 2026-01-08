'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Pin, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { truncate, formatRelativeTime } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface PinnedNotesProps {
  notes: Note[];
}

export function PinnedNotes({ notes }: PinnedNotesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Pin className="h-4 w-4 text-primary" />
            Sabitlenmiş Notlar
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/notes">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  href={`/notes/${note.id}`}
                  className="block p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {note.category && (
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: note.category.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {note.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {truncate(note.content.replace(/[#*`]/g, ''), 80)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatRelativeTime(note.updatedAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

