# المؤسسة الوطنية للتنمية الشاملة

## نظرة عامة

موقع ويب للمؤسسة الوطنية للتنمية الشاملة (اليمن) يقدم خدمات تعليمية وتأمين صحي. يشمل موقعاً عاماً ولوحة إدارة متكاملة.

## المكدس التقني

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (RTL/Arabic, Tajawal font)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild

## الهيكل

```
artifacts/
  almossah/       # Frontend React+Vite (port 20055)
  api-server/     # Express API server (port 8080)
  mockup-sandbox/ # Component preview server

lib/
  db/             # Drizzle ORM schema + DB config
  api-client-react/  # Orval-generated API hooks
  api-zod/        # Zod validators from OpenAPI spec
```

## صفحات الموقع العام

- `/` — الرئيسية (hero slider، إحصائيات، أخبار، شركاء)
- `/about` — عن المؤسسة
- `/services` — الخدمات
- `/programs` — البرامج
- `/media` — المركز الإعلامي (أخبار + مقالات)
- `/register` — نموذج التسجيل
- `/contact` — اتصل بنا
- `/find-us` — موقعنا

## لوحة الإدارة `/admin`

- `/admin/login` — تسجيل الدخول (افتراضي: admin/admin123)
- `/admin/dashboard` — لوحة التحكم الرئيسية
- `/admin/registrations` — إدارة طلبات التسجيل
- `/admin/news` — إدارة الأخبار والمقالات
- `/admin/partners` — إدارة شركاء النجاح
- `/admin/team` — إدارة الفريق
- `/admin/stats` — إدارة الإحصائيات
- `/admin/slides` — إدارة شرائح الصفحة الرئيسية

## قاعدة البيانات

جداول: `registrations`, `news`, `partners`, `team`, `stats`, `homepage_slides`

## الأوامر الرئيسية

- `pnpm run typecheck` — فحص الأنواع لجميع الحزم
- `pnpm --filter @workspace/db run push` — دفع تغييرات مخطط DB
- `pnpm --filter @workspace/api-server run dev` — تشغيل API server محلياً

## المتغيرات البيئية

- `DATABASE_URL` — رابط قاعدة البيانات PostgreSQL
- `SESSION_SECRET` — مفتاح تشفير الجلسات
- `ADMIN_USERNAME` — اسم مستخدم الإدارة (افتراضي: admin)
- `ADMIN_PASSWORD` — كلمة مرور الإدارة (افتراضي: admin123)
- `PORT` — منفذ الخدمة (يُعيَّن تلقائياً)

## المصادقة في الإدارة

- Bearer token في `localStorage` + session cookie احتياطي
- تُولَّد tokens في الذاكرة (تُعاد التهيئة عند إعادة تشغيل الخادم)
- للإنتاج: يُنصح بتعيين ADMIN_USERNAME وADMIN_PASSWORD كمتغيرات بيئية سرية
