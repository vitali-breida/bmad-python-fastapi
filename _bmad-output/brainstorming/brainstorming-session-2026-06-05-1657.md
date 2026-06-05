---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Развитие приложения за пределы одностраничного CRUD — многостраничность, routing, демонстрация архитектурных паттернов'
session_goals: 'Сгенерировать варианты функционала, которые интересны, практичны для обучения/демо и показывают, как добавлять фичи в текущую структуру проекта (FastAPI + React + TanStack Query)'
selected_approach: 'ai-recommended'
techniques_used: ['Question Storming', 'Cross-Pollination (simplified)']
ideas_generated: 12
session_active: false
workflow_completed: true
context_file: ''
facilitation_notes: 'Пользователь предпочёл простой формат без шаблонов Category/Concept/Novelty. Morphological Analysis заменён прямым согласованием scope v1. Приоритет — архитектурная наглядность, не polish UX.'
---

# Brainstorming Session Results

**Facilitator:** Vitali
**Date:** 2026-06-05-1657

## Session Overview

**Topic:** Развитие приложения за пределы одностраничного CRUD — многостраничность, routing, демонстрация архитектурных паттернов

**Goals:** Сгенерировать варианты функционала, которые интересны, практичны для обучения/демо и показывают, как добавлять фичи в текущую структуру проекта (FastAPI + React + TanStack Query)

### Context Guidance

_Проект: учебный Notes API (FastAPI + SQLite + JWT) с React SPA (Vite, TanStack Query, sessionStorage auth). Текущее состояние — одна страница CRUD заметок в монолитном `App.tsx`, React Router ещё не установлен._

### Session Setup

Пользователь хочет выйти за рамки «одной страницы с CRUD», чтобы проверить routing и увидеть, как новый функционал встраивается в текущую архитектуру.

## Technique Selection

**Approach:** AI-Recommended Techniques

**Techniques used:**

- **Question Storming** — определили constraints (routing patterns, auth, layout, приоритеты)
- **Cross-Pollination (simplified)** — идеи из GitHub Issues адаптированы в простые уровни 1/2/3; Morphological Analysis заменён прямым согласованием v1 scope

## Technique Execution Results

### Question Storming — Constraints

| Решение | Значение |
|---|---|
| Routing patterns | static (`/login`), dynamic (`/notes/:id`), protected |
| Auth | отдельный route `/login`, не gate в `App.tsx` |
| Note detail | отдельная страница, прямой переход по URL |
| Layout | header (logo, nav, logout) на всех страницах кроме `/login` |
| Breadcrumbs | только на `/notes/:id` |
| Query params | можно (уровень 2, не v1) |
| Back navigation | scroll position списка сохраняется |
| Приоритет | архитектура > красивый UX |
| Структура кода | `src/pages/` + `src/layouts/AppLayout.tsx` |

### Cross-Pollination — Scope Levels

**Уровень 1 (выбран):** routing foundation — разнести существующий CRUD по страницам + dashboard + settings

**Уровень 2 (backlog):** поиск в URL (`/notes?search=`), `returnUrl` после логина

**Уровень 3 (backlog):** теги, закреплённые заметки (нужен новый бэкенд)

### Agreed Product Shape (v1) — FINAL

**Route map:**

```
/login              → LoginPage (public)
/dashboard          → DashboardPage (protected) — home after login
/notes              → NotesListPage (protected) — list + create form
/notes/:id          → NoteDetailPage (protected) — view/edit one note
/settings           → SettingsPage (protected) — username + logout
```

**Flows:**

- После логина → redirect на `/dashboard`
- «Новая заметка» с dashboard → `/notes` с пустой формой (без `/notes/new`)
- Пустой dashboard → «Заметок пока нет» + CTA создать первую

**Navigation:**

- Header: `Dashboard | Notes | Settings` + Logout
- Breadcrumbs: `Notes > {title}` только на `/notes/:id`

**Dashboard blocks (no new backend):**

- Приветствие (`GET /auth/me`)
- Счётчик заметок (`GET /notes`)
- Последняя заметка (ссылка на `/notes/:id`)
- Версия API (`GET /health`)
- Быстрые действия

**Settings v1:**

- Username (`GET /auth/me`)
- Logout

## Idea Organization and Prioritization

### Theme 1: Routing Foundation

_Focus: Multi-page SPA с React Router_

- Установить `react-router-dom`, вынести routes из `App.tsx`
- `ProtectedRoute` wrapper для всех страниц кроме `/login`
- Dynamic route `/notes/:id` с `useNoteQuery(id)`
- Redirect `/` → `/dashboard` (authenticated) или `/login`

### Theme 2: Non-CRUD Pages

_Focus: Сценарии вне CRUD заметок_

- **Dashboard** — обзорная страница, комбинирует auth + notes + health queries
- **Settings** — профиль пользователя, другой домен данных (auth, не notes)

### Theme 3: Layout & Navigation

_Focus: Общая оболочка и ориентация пользователя_

- `AppLayout` с header nav и outlet для страниц
- Breadcrumbs на detail page
- Scroll restoration на `/notes` при возврате с detail

### Theme 4: Backlog (Post-v1)

_Focus: Следующие итерации без блокировки v1_

- Query params для поиска/сортировки
- `returnUrl` при редиректе на login
- Теги и pinned notes (новые API + миграции)

### Prioritization Results

| Приоритет | Что | Почему |
|---|---|---|
| **P0 — v1** | 5 routes + layout + dashboard + settings | Закрывает цель сессии: не одна страница, видна архитектура |
| **P1 — quick win** | E2E: login → dashboard → notes → detail → settings | Проверяет routing end-to-end |
| **P2 — level 2** | search query params, returnUrl | Минимальный новый функционал без бэкенда |
| **P3 — level 3** | tags, pinned | Требует backend, отдельный epic |

## Action Planning

### v1 Implementation Steps (when ready)

1. **Dependencies** — `npm install react-router-dom` в `frontend/`
2. **Routing shell** — `src/routes.tsx` или `src/AppRoutes.tsx` с route config
3. **Auth guard** — `ProtectedRoute` + redirect logic (`/login`, post-login → `/dashboard`)
4. **Layout** — `src/layouts/AppLayout.tsx` (nav + breadcrumbs slot + outlet)
5. **Pages** — вынести из `App.tsx`:
   - `LoginPage.tsx`
   - `DashboardPage.tsx`
   - `NotesListPage.tsx`
   - `NoteDetailPage.tsx`
   - `SettingsPage.tsx`
6. **Hooks reuse** — `useMeQuery`, `useNotesQuery`, `useNoteQuery`, mutations без изменений логики
7. **New API client** — `GET /health` hook для dashboard (если ещё нет)
8. **E2E** — обновить `session.spec.ts` под multi-page flow
9. **Docs** — ADR или plan doc для routing patterns (опционально)

### Suggested Folder Structure

```
frontend/src/
  layouts/
    AppLayout.tsx
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    NotesListPage.tsx
    NoteDetailPage.tsx
    SettingsPage.tsx
  components/
    ProtectedRoute.tsx
    Breadcrumbs.tsx
    AppNav.tsx
  routes.tsx
  App.tsx          ← QueryClientProvider + Router only
```

### Success Metrics

- [ ] 5 distinct URLs работают и отражаются в адресной строке
- [ ] Без токена `/dashboard`, `/notes`, `/settings` → redirect `/login`
- [ ] Прямой переход `/notes/42` загружает заметку
- [ ] Dashboard показывает данные из 3 источников (me, notes, health)
- [ ] Settings показывает username, logout работает
- [ ] Scroll на `/notes` сохраняется при back с detail
- [ ] E2E покрывает основной happy path

### Potential Obstacles

- Рефакторинг монолитного `App.tsx` — много state для разнести по страницам
- Scroll restoration — может потребовать `sessionStorage` или React Router scroll restoration API
- E2E тесты завязаны на текущую одностраничную структуру — нужно обновить селекторы

## Session Summary and Insights

### Key Achievements

- Согласован конкретный **v1 product shape** — не абстрактные «фичи», а 5 страниц с чёткими ролями
- Разделены **CRUD** (notes) и **не-CRUD** (dashboard, settings) сценарии
- Определены **routing patterns** для обучения: static, dynamic, protected
- Сформирован **backlog** уровней 2 и 3 без раздувания v1

### Key Insights

- Пользователю важнее **понятная структура**, чем объём идей — упрощение формата повысило продуктивность
- Dashboard как **home after login** естественно отделяет «обзор» от «работы с заметками»
- Текущий проект **не имеет React Router** — v1 сам по себе значимый архитектурный шаг
- Новый бэкенд для v1 **не нужен** — dashboard и settings используют существующие API

### Creative Facilitation Narrative

Сессия началась с AI-recommended техник (Question Storming → Cross-Pollination → Morphological Analysis), но по запросу пользователя формат упростился до прямого диалога с уровнями 1/2/3. Question Storming дал чёткие constraints; Cross-Pollination через GitHub Issues дал направление, которое свели к dashboard + settings. Итог — actionable plan без перегруза.

### Session Highlights

**User strengths:** Чётко формулировал предпочтения («отдельная страница», «архитектура важнее UX»), не боялся сказать «не понимаю» — это ускорило сходимость.

**Breakthrough:** Осознание, что v1 — это не «добавить фичи», а **разнести приложение по страницам** с двумя не-CRUD зонами (dashboard, settings).

**Next session trigger:** Когда будешь готов к реализации — можно создать story/epic из Action Planning или запустить `bmad-dev-story`.
