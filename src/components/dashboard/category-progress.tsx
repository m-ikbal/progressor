'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface CategoryProgressProps {
  categories: {
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }[];
}

export function CategoryProgress({ categories }: CategoryProgressProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">
            Kategori İlerlemesi
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/categories">
              Tümünü Gör
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.categoryId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.categoryColor }}
                  />
                  <span className="font-medium">{category.categoryName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {category.completedTasks}/{category.totalTasks}
                  </span>
                  <span className="font-semibold text-foreground">
                    {category.progress}%
                  </span>
                </div>
              </div>
              <Progress
                value={category.progress}
                className="h-2"
                indicatorClassName="transition-all duration-500"
                style={
                  {
                    '--progress-color': category.categoryColor,
                  } as React.CSSProperties
                }
              />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

