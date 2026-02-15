# Progressor

Öğrenme, görev yönetimi ve not alma süreçlerini tek bir platformda birleştiren modern bir web uygulaması.

## Özellikler

- 🔐 **Güvenli Kimlik Doğrulama** - Email/şifre ile kayıt ve giriş, güvenli oturum yönetimi
- 📁 **Kategoriler** - Öğrenme alanlarını kategorize edin (Yazılım, Siber Güvenlik, İngilizce vb.)
- ✅ **Görev Yönetimi** - Durum, öncelik ve ilerleme takibi ile görevler oluşturun
- 📝 **Not Tutma** - Markdown destekli notlar, kategoriler ve görevlerle ilişkilendirme
- 📊 **Dashboard** - Genel ve kategori bazlı ilerleme takibi
- 🌓 **Karanlık/Aydınlık Tema** - Sistem tercihine göre otomatik tema
- 📱 **Responsive Tasarım** - Tüm cihazlarda mükemmel görünüm

## Teknolojiler

- **Framework:** Next.js 14 (App Router)
- **Dil:** TypeScript
- **Veritabanı:** PostgreSQL (Neon) + Prisma ORM
- **Kimlik Doğrulama:** NextAuth.js
- **Stil:** Tailwind CSS
- **UI Bileşenleri:** Radix UI
- **Form Yönetimi:** React Hook Form + Zod
- **Animasyonlar:** Framer Motion

## Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükleyin:**

```bash
npm install
```

2. **Ortam değişkenlerini ayarlayın:**

`.env.local` (önerilir) dosyası oluşturun:

```env
# Neon / PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
```

> Not: Prisma migrate komutları `.env` dosyasını okuyabilir; uygulamanın kullandığı DB ile migration yapılan DB'nin aynı olduğundan emin olun.

3. **Veritabanını oluşturun:**

```bash
npm run db:migrate
```

4. **Demo verileri yükleyin (opsiyonel):**

```bash
npm run db:seed
```

5. **Geliştirme sunucusunu başlatın:**

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## Demo Hesabı

Seed çalıştırıldıysa:

- **Email:** demo@progressor.dev
- **Şifre:** demo123456

## Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth sayfaları (login, register)
│   ├── (dashboard)/       # Dashboard sayfaları
│   ├── api/               # API route'ları
│   └── layout.tsx         # Root layout
├── components/            # React bileşenleri
│   ├── ui/               # Temel UI bileşenleri
│   ├── dashboard/        # Dashboard bileşenleri
│   ├── categories/       # Kategori bileşenleri
│   ├── tasks/            # Görev bileşenleri
│   ├── notes/            # Not bileşenleri
│   └── settings/         # Ayarlar bileşenleri
├── lib/                   # Yardımcı fonksiyonlar
│   ├── auth.ts           # NextAuth yapılandırması
│   ├── db.ts             # Prisma client
│   ├── validations.ts    # Zod şemaları
│   └── utils.ts          # Utility fonksiyonlar
├── hooks/                 # Custom React hooks
├── providers/             # Context providers
└── types/                 # TypeScript tipleri
```

## API Endpoints

### Kimlik Doğrulama

- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Kategoriler

- `GET /api/categories` - Tüm kategorileri getir
- `POST /api/categories` - Yeni kategori oluştur
- `GET /api/categories/[id]` - Tek kategori getir
- `PATCH /api/categories/[id]` - Kategori güncelle
- `DELETE /api/categories/[id]` - Kategori sil

### Görevler

- `GET /api/tasks` - Tüm görevleri getir (filtreleme destekli)
- `POST /api/tasks` - Yeni görev oluştur
- `GET /api/tasks/[id]` - Tek görev getir
- `PATCH /api/tasks/[id]` - Görev güncelle
- `DELETE /api/tasks/[id]` - Görev sil

### Notlar

- `GET /api/notes` - Tüm notları getir (filtreleme destekli)
- `POST /api/notes` - Yeni not oluştur
- `GET /api/notes/[id]` - Tek not getir
- `PATCH /api/notes/[id]` - Not güncelle
- `DELETE /api/notes/[id]` - Not sil

### Dashboard

- `GET /api/dashboard` - Dashboard istatistikleri

## Geliştirme

### Veritabanı Komutları

```bash
# Prisma client oluştur
npm run db:generate

# Şemayı veritabanına uygula
npm run db:push

# Migration oluştur
npm run db:migrate

# Prisma Studio aç
npm run db:studio

# Seed verilerini yükle
npm run db:seed
```

### Lint

```bash
npm run lint
```

### Build

```bash
npm run build
npm run start
```

## Gelecek Planları

- [ ] Çoklu dil desteği (i18n)
- [ ] Mobil uygulama (React Native)
- [ ] Gelişmiş analitik ve raporlama
- [ ] AI destekli öneriler
- [ ] Takım/organizasyon desteği
- [ ] API rate limiting
- [ ] Export/Import özellikleri

## Lisans

MIT License

