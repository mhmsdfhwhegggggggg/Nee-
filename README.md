# المؤسسة الوطنية — موقع ولوحة إدارة

مشروع **pnpm workspace**: واجهة React (Vite) + خادم Express + PostgreSQL.

## المتطلبات

- Node.js 22+
- pnpm 9+
- PostgreSQL

## الإعداد

1. انسخ `.env.example` إلى `.env` وعيّن `DATABASE_URL` و`SESSION_SECRET` ومتغيرات التشغيل للواجهة (`PORT`، `BASE_PATH`) حسب بيئتك.
2. `pnpm install`
3. شغّل API: `pnpm --filter @workspace/api-server run dev` (أو `build` ثم `start`).
4. شغّل الواجهة: `pnpm --filter @workspace/almossah run dev`.

تفاصيل إضافية كانت موثّقة في `replit (11).md` داخل المستودع.

## ملاحظة عن هيكل المجلدات

أسماء مجلدات مثل `artifacts (11)` ناتجة عن تصدير/نسخ الملفات؛ مسارات الحزم معرّفة في `pnpm-workspace.yaml`.
