'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  FolderKanban,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatsProps {
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    totalCategories: number;
    totalNotes: number;
    overallProgress: number;
  };
}

const statItems = [
  {
    key: 'completedTasks',
    label: 'Tamamlanan',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    href: '/tasks?status=COMPLETED',
  },
  {
    key: 'inProgressTasks',
    label: 'Devam Eden',
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    href: '/tasks?status=IN_PROGRESS',
  },
  {
    key: 'todoTasks',
    label: 'Yapılacak',
    icon: ListTodo,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    href: '/tasks?status=TODO',
  },
  {
    key: 'totalCategories',
    label: 'Kategori',
    icon: FolderKanban,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    href: '/categories',
  },
  {
    key: 'totalNotes',
    label: 'Not',
    icon: FileText,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    href: '/notes',
  },
];

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

export function DashboardStats({ stats }: StatsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Overall Progress Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Genel İlerleme
                  </p>
                  <p className="text-2xl font-bold">{stats.overallProgress}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {stats.completedTasks} / {stats.totalTasks} görev
                </p>
              </div>
            </div>
            {/* @ts-ignore */}
            <Progress
              value={stats.overallProgress}
              className="h-3"
              indicatorClassName="bg-gradient-to-r from-primary to-purple-500"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {statItems.map((item) => {
          const value = stats[item.key as keyof typeof stats];
          return (
            <motion.div key={item.key} variants={itemVariants}>
              <Link href={item.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.bgColor}`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
