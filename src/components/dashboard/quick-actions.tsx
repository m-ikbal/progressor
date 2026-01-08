'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, FolderPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const actions = [
  {
    label: 'Yeni Görev',
    href: '/tasks/new',
    icon: Plus,
    variant: 'default' as const,
  },
  {
    label: 'Yeni Kategori',
    href: '/categories/new',
    icon: FolderPlus,
    variant: 'outline' as const,
  },
  {
    label: 'Yeni Not',
    href: '/notes/new',
    icon: FileText,
    variant: 'outline' as const,
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-wrap gap-3"
    >
      {actions.map((action, index) => (
        <motion.div
          key={action.href}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Button variant={action.variant} asChild>
            <Link href={action.href}>
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </Link>
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}

