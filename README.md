# Page Builder (MVP): React + Node.js + PostgreSQL

Конструктор лендингов с моделью страницы в виде JSON-дерева блоков.

## Архитектура (MVP)

- `frontend/`: React UI-конструктор
  - холст с drag-and-drop перемещением блоков по дереву
  - инспектор свойств выбранного блока
  - предпросмотр рендера из JSON
- `backend/`: REST API + Prisma + PostgreSQL
  - JWT auth (`/api/auth/register`, `/api/auth/login`)
  - страницы/версии/публикация
  - медиа хранение локально (позже можно заменить на S3)

## Быстрый старт

1. Установите Node.js (LTS) и PostgreSQL.
2. Поднимите БД (опционально):
   - `docker compose up -d` (если Docker доступен)
3. Переменные окружения:
   - скопируйте `.env.example` в `.env` (в корне)
   - скопируйте `frontend/.env.example` в `frontend/.env`
   - при необходимости обновите `DATABASE_URL` и `JWT_SECRET`
4. Установка зависимостей:
   - `npm install`
5. Prisma:
   - `npm -w backend run prisma:generate`
   - затем выполните миграции (нужен доступ к БД):
     - `npm -w backend run prisma:migrate`
     - или: `npx prisma db push`
6. Запуск:
   - `npm run dev`

## Тесты

- Frontend: `npm -w frontend test`
- Backend: `npm -w backend test`
  - интеграционные тесты будут автоматически пропущены, если PostgreSQL недоступна

## Основные API endpoints

- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/pages` (создать draft)
- `GET /api/pages` (список)
- `GET /api/pages/:pageId` (draft/published текущая версия для редактора)
- `POST /api/pages/:pageId/draft` (сохранить JSON схему как draft-версию)
- `POST /api/pages/:pageId/publish` (закрепить draft-версию и выдать slug)
- `GET /api/public/pages/:slug` (публичный предпросмотр)
- `POST /api/media` (upload)
- `GET /api/media/:id` (выдача файла)

## Стартовые блоки

- `container` (layout: `stack | row`)
- `heading`
- `text`
- `image` (через `assetId`)
- `button`

