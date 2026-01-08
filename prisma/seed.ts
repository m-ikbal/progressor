import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 12);
  const user = await prisma.user.create({
    data: {
      email: 'demo@progressor.dev',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Yazılım Geliştirme',
        description: 'Programlama dilleri, frameworkler ve yazılım mühendisliği',
        color: '#6366f1',
        icon: 'Code2',
        sortOrder: 1,
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Siber Güvenlik',
        description: 'Güvenlik, penetrasyon testi ve güvenlik araçları',
        color: '#ef4444',
        icon: 'Shield',
        sortOrder: 2,
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Ağ Sistemleri',
        description: 'Network protokolleri, altyapı ve sistem yönetimi',
        color: '#10b981',
        icon: 'Network',
        sortOrder: 3,
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'İngilizce',
        description: 'Dil öğrenimi, kelime çalışması ve gramer',
        color: '#f59e0b',
        icon: 'Languages',
        sortOrder: 4,
        userId: user.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'DevOps & Cloud',
        description: 'CI/CD, konteynerler ve bulut hizmetleri',
        color: '#8b5cf6',
        icon: 'Cloud',
        sortOrder: 5,
        userId: user.id,
      },
    }),
  ]);

  console.log('✅ Created categories:', categories.length);

  // Create tasks
  const tasks = await Promise.all([
    // Software Development Tasks
    prisma.task.create({
      data: {
        title: 'React Hooks derinlemesine çalış',
        description: 'useState, useEffect, useCallback, useMemo ve custom hooks konularını öğren',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        progress: 45,
        userId: user.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'TypeScript generics konusunu bitir',
        description: 'Generic types, constraints ve utility types',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        progress: 0,
        userId: user.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Next.js 14 App Router öğren',
        description: 'Server components, streaming ve data fetching patterns',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        progress: 100,
        completedAt: new Date(),
        userId: user.id,
        categoryId: categories[0].id,
      },
    }),

    // Cybersecurity Tasks
    prisma.task.create({
      data: {
        title: 'OWASP Top 10 listesini incele',
        description: 'En yaygın web güvenlik açıklarını öğren',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        progress: 60,
        userId: user.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Burp Suite kullanımı',
        description: 'Web uygulama güvenlik testi için Burp Suite öğren',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        progress: 0,
        userId: user.id,
        categoryId: categories[1].id,
      },
    }),

    // Network Tasks
    prisma.task.create({
      data: {
        title: 'TCP/IP protokol yığını',
        description: 'OSI modeli ve TCP/IP katmanlarını detaylı öğren',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        progress: 100,
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
        categoryId: categories[2].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Linux network komutları',
        description: 'netstat, ss, ip, tcpdump komutlarını öğren',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        progress: 30,
        userId: user.id,
        categoryId: categories[2].id,
      },
    }),

    // English Tasks
    prisma.task.create({
      data: {
        title: 'Teknik İngilizce kelime çalışması',
        description: 'Yazılım ve teknoloji terimleri',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.LOW,
        progress: 25,
        userId: user.id,
        categoryId: categories[3].id,
      },
    }),

    // DevOps Tasks
    prisma.task.create({
      data: {
        title: 'Docker fundamentals',
        description: 'Container kavramları, Dockerfile ve docker-compose',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        progress: 100,
        completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        userId: user.id,
        categoryId: categories[4].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Kubernetes basics',
        description: 'Pods, services, deployments ve ConfigMaps',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        progress: 0,
        userId: user.id,
        categoryId: categories[4].id,
      },
    }),
  ]);

  console.log('✅ Created tasks:', tasks.length);

  // Create notes
  const notes = await Promise.all([
    prisma.note.create({
      data: {
        title: 'React Performance Optimizasyonu',
        content: `# React Performance İpuçları

## Memoization
- \`React.memo()\` ile gereksiz render'ları önle
- \`useMemo\` ile pahalı hesaplamaları cache'le
- \`useCallback\` ile fonksiyon referanslarını koru

## Code Splitting
- \`React.lazy()\` ve \`Suspense\` kullan
- Route bazlı splitting yap

## State Yönetimi
- State'i mümkün olduğunca aşağıda tut
- Gereksiz lifting'den kaçın`,
        isPinned: true,
        userId: user.id,
        categoryId: categories[0].id,
        taskId: tasks[0].id,
      },
    }),
    prisma.note.create({
      data: {
        title: 'SQL Injection Önleme',
        content: `# SQL Injection Korunma Yöntemleri

## Parametreli Sorgular
Her zaman prepared statements kullan:
\`\`\`sql
SELECT * FROM users WHERE id = ?
\`\`\`

## Input Validation
- Whitelist yaklaşımı kullan
- Escape special characters

## ORM Kullanımı
- Prisma, Sequelize gibi ORM'ler doğal koruma sağlar`,
        isPinned: false,
        userId: user.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.note.create({
      data: {
        title: 'Network Troubleshooting Checklist',
        content: `# Ağ Sorun Giderme Adımları

1. **Fiziksel Bağlantı**
   - Kablo kontrolü
   - Link ışıkları

2. **IP Konfigürasyonu**
   - \`ip addr\` veya \`ipconfig\`
   - DHCP lease durumu

3. **DNS**
   - \`nslookup\` veya \`dig\`
   - /etc/resolv.conf

4. **Routing**
   - \`ip route\`
   - Default gateway

5. **Firewall**
   - \`iptables -L\`
   - Port durumları`,
        isPinned: true,
        userId: user.id,
        categoryId: categories[2].id,
      },
    }),
    prisma.note.create({
      data: {
        title: 'Teknik Terimler - Hafta 1',
        content: `# Yazılım Terimleri

| Terim | Anlam |
|-------|-------|
| Refactoring | Kod yapısını iyileştirme |
| Deployment | Dağıtım/Yayınlama |
| Debugging | Hata ayıklama |
| Repository | Kod deposu |
| Commit | Değişiklik kaydetme |
| Branch | Dal/Şube |
| Merge | Birleştirme |
| Pull Request | Çekme isteği |`,
        isPinned: false,
        userId: user.id,
        categoryId: categories[3].id,
        taskId: tasks[7].id,
      },
    }),
  ]);

  console.log('✅ Created notes:', notes.length);
  console.log('🎉 Seed completed successfully!');
  console.log('\n📧 Demo login: demo@progressor.dev / demo123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
