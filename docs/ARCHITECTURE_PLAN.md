# 🏗️ PLAN ARCHITEKTURY - WEDDING AI PLANNER

**Etap 2: Planowanie Architektury**  
**Data**: 2024

---

## 📐 STRUKTURA PROPOZOWANA

### 1. Ujednolicenie Routingu

#### Obecna struktura (do usunięcia):
```
src/app/
├── (dashboard)/          # ❌ Usunąć
├── dashboard/            # ❌ Usunąć (legacy)
└── [locale]/(dashboard)/ # ✅ Zostawić jako główną
```

#### Docelowa struktura:
```
src/app/
└── [locale]/
    ├── (auth)/
    │   ├── sign-in/[[...sign-in]]/
    │   └── sign-up/[[...sign-up]]/
    ├── (dashboard)/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── tasks/
    │   ├── budget/
    │   ├── guests/
    │   ├── seating/
    │   └── vendors/
    ├── api/
    │   └── events/[id]/...
    ├── rsvp/[token]/
    └── layout.tsx
```

**Migracja**:
1. Przenieść wszystkie route z `(dashboard)/` do `[locale]/(dashboard)/`
2. Usunąć `dashboard/` (legacy)
3. Zaktualizować wszystkie linki w komponentach
4. Zaktualizować middleware

---

### 2. System Autentykacji - Propozycja

#### Opcja A: JWT (Rekomendowana - obecna implementacja)

**Struktura**:
```
src/lib/
├── auth/
│   ├── actions.ts          # Server actions (login, register, logout)
│   ├── middleware.ts       # Auth middleware
│   ├── utils.ts            # getCurrentUser, verifyToken
│   └── types.ts            # Auth types
└── validations/
    └── auth.ts             # Zod schemas
```

**Implementacja**:
- ✅ Już zaimplementowane w `src/lib/actions/auth.actions.ts`
- ✅ Używa JWT + cookies
- ✅ Hasła haszowane bcrypt

**Zmiany wymagane**:
1. Usunąć wszystkie referencje do Clerk
2. Zaktualizować middleware (`src/middleware.ts`)
3. Zaktualizować wszystkie API routes
4. Zaktualizować komponenty używające `currentUser` z Clerk

**Interfejs**:
```typescript
// src/lib/auth/types.ts
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}
```

**Middleware**:
```typescript
// src/lib/auth/middleware.ts
export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) throw new UnauthorizedError();
  
  const user = await verifyToken(token);
  if (!user) throw new UnauthorizedError();
  
  return user;
}
```

---

### 3. Baza Danych - Migracja na PostgreSQL

#### Schema Changes:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // Zmiana z sqlite
  url      = env("DATABASE_URL")
}
```

#### Migracja:
1. Utworzyć migrację Prisma
2. Zaktualizować `.env` i `.env.example`
3. Zaktualizować `docker-compose.yml` (już jest PostgreSQL)
4. Zaktualizować README

#### Nowe migracje:
```bash
npx prisma migrate dev --name migrate_to_postgresql
```

---

### 4. Error Handling - Centralizacja

#### Struktura:
```
src/lib/
└── errors/
    ├── types.ts           # Error types
    ├── handlers.ts        # Error handlers
    └── boundaries.ts     # React error boundaries
```

#### Error Types:
```typescript
// src/lib/errors/types.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', 400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', 401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', 404, `${resource} not found`);
  }
}
```

#### Error Handler:
```typescript
// src/lib/errors/handlers.ts
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
}
```

#### Error Boundary:
```typescript
// src/components/errors/error-boundary.tsx
'use client';

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  // Implementacja z react-error-boundary
}
```

---

### 5. AI Integration - Struktura

#### Struktura:
```
src/lib/
└── ai/
    ├── client.ts          # OpenAI/Anthropic client
    ├── prompts/
    │   ├── tasks.ts       # Prompts dla zadań
    │   ├── budget.ts      # Prompts dla budżetu
    │   ├── seating.ts     # Prompts dla usadzenia
    │   └── invitations.ts  # Prompts dla zaproszeń
    ├── services/
    │   ├── task-generator.ts
    │   ├── budget-optimizer.ts
    │   ├── seating-planner.ts
    │   └── invitation-generator.ts
    └── types.ts
```

#### AI Client:
```typescript
// src/lib/ai/client.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIResponse(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return response.choices[0].message.content || '';
}
```

#### Rate Limiting:
```typescript
// src/lib/ai/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
});

export async function checkRateLimit(userId: string) {
  const { success } = await ratelimit.limit(`ai:${userId}`);
  if (!success) throw new Error('Rate limit exceeded');
}
```

#### Caching:
```typescript
// src/lib/ai/cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedAIResponse(key: string) {
  return await redis.get<string>(`ai:cache:${key}`);
}

export async function cacheAIResponse(key: string, response: string, ttl = 3600) {
  await redis.setex(`ai:cache:${key}`, ttl, response);
}
```

---

### 6. Service Layer - Propozycja

#### Struktura:
```
src/lib/
└── services/
    ├── events/
    │   ├── event.service.ts
    │   └── event.repository.ts
    ├── tasks/
    │   ├── task.service.ts
    │   └── task.repository.ts
    ├── guests/
    │   ├── guest.service.ts
    │   └── guest.repository.ts
    └── budget/
        ├── budget.service.ts
        └── budget.repository.ts
```

#### Przykład Service:
```typescript
// src/lib/services/tasks/task.service.ts
export class TaskService {
  constructor(private repository: TaskRepository) {}

  async createTask(data: CreateTaskInput, userId: string) {
    // Walidacja
    const validated = taskSchema.parse(data);
    
    // Autoryzacja
    await this.repository.verifyEventAccess(validated.eventId, userId);
    
    // Logika biznesowa
    const task = await this.repository.create(validated);
    
    // Side effects (notifications, etc.)
    await this.notifyTaskCreated(task);
    
    return task;
  }
}
```

#### Repository Pattern:
```typescript
// src/lib/services/tasks/task.repository.ts
export class TaskRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTaskInput) {
    return this.prisma.task.create({ data });
  }

  async findById(id: string) {
    return this.prisma.task.findUnique({ where: { id } });
  }

  async verifyEventAccess(eventId: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, userId },
    });
    if (!event) throw new NotFoundError('Event');
  }
}
```

---

### 7. API Routes - Ujednolicenie

#### Struktura docelowa:
```
src/app/[locale]/api/
└── events/
    └── [id]/
        ├── route.ts              # GET, POST, PUT, DELETE
        ├── tasks/
        │   ├── route.ts
        │   └── [taskId]/route.ts
        ├── budget/
        │   ├── route.ts
        │   └── [budgetItemId]/route.ts
        └── ...
```

#### Wspólny middleware:
```typescript
// src/lib/api/middleware.ts
export async function withAuth<T>(
  handler: (req: Request, user: AuthUser, params: T) => Promise<NextResponse>
) {
  return async (req: Request, context: { params: T }) => {
    try {
      const user = await requireAuth(req as NextRequest);
      return await handler(req, user, context.params);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
```

#### Przykład użycia:
```typescript
// src/app/[locale]/api/events/[id]/tasks/route.ts
import { withAuth } from '@/lib/api/middleware';

export const POST = withAuth(async (req, user, { id }) => {
  const body = await req.json();
  const task = await taskService.createTask(body, user.id);
  return NextResponse.json(task, { status: 201 });
});
```

---

### 8. Loading States - Ujednolicenie

#### Struktura:
```
src/components/
└── ui/
    ├── skeleton.tsx        # Skeleton loaders
    ├── loading.tsx         # Loading spinner
    └── suspense-boundary.tsx # Suspense wrapper
```

#### Skeleton Components:
```typescript
// src/components/ui/skeleton.tsx
export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
```

#### Suspense Usage:
```typescript
// src/app/[locale]/(dashboard)/tasks/page.tsx
import { Suspense } from 'react';
import { TaskListSkeleton } from '@/components/ui/skeleton';

export default function TasksPage() {
  return (
    <Suspense fallback={<TaskListSkeleton />}>
      <TaskList />
    </Suspense>
  );
}
```

---

### 9. Validation - Centralizacja

#### Struktura:
```
src/lib/
└── validations/
    ├── auth.ts
    ├── tasks.ts
    ├── budget.ts
    ├── guests.ts
    └── events.ts
```

#### Przykład:
```typescript
// src/lib/validations/tasks.ts
import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  category: z.string().optional(),
  eventId: z.string().cuid(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

---

### 10. Monitoring & Logging

#### Struktura:
```
src/lib/
└── monitoring/
    ├── logger.ts           # Structured logging
    └── analytics.ts        # Analytics events
```

#### Logger:
```typescript
// src/lib/monitoring/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
  } : undefined,
});

export function logError(error: Error, context?: Record<string, unknown>) {
  logger.error({ err: error, ...context }, error.message);
}
```

---

## 🔄 MIGRACJA - PLAN DZIAŁAŃ

### Faza 1: Stabilizacja (Tydzień 1-2)

1. **Autentykacja** (2-3 dni)
   - [ ] Usunąć wszystkie referencje do Clerk
   - [ ] Zaktualizować middleware
   - [ ] Zaktualizować wszystkie API routes
   - [ ] Zaktualizować komponenty

2. **Routing** (1-2 dni)
   - [ ] Przenieść route z `(dashboard)/` do `[locale]/(dashboard)/`
   - [ ] Usunąć duplikaty
   - [ ] Zaktualizować linki

3. **Baza danych** (1 dzień)
   - [ ] Zmienić schema na PostgreSQL
   - [ ] Utworzyć migrację
   - [ ] Zaktualizować dokumentację

4. **Error Handling** (1-2 dni)
   - [ ] Utworzyć error types
   - [ ] Dodać error boundaries
   - [ ] Zaktualizować API routes

### Faza 2: Funkcjonalności (Tydzień 3-5)

1. **AI Integration** (3-4 dni)
   - [ ] Skonfigurować OpenAI client
   - [ ] Zaimplementować rate limiting
   - [ ] Dodać caching
   - [ ] Zaktualizować wszystkie AI endpoints

2. **Brakujące widoki** (2-3 dni)
   - [ ] Kanban view dla zadań
   - [ ] Timeline view
   - [ ] Porównywarka dostawców

3. **Eksport PDF** (1-2 dni)
   - [ ] Dodać bibliotekę (react-pdf lub puppeteer)
   - [ ] Zaimplementować eksport planu stołów

### Faza 3: Jakość (Tydzień 6-7)

1. **Testy** (3-4 dni)
   - [ ] Zwiększyć pokrycie testami
   - [ ] Dodać E2E testy
   - [ ] Dodać testy integracyjne dla AI

2. **Performance** (1-2 dni)
   - [ ] Dodać caching (React Query)
   - [ ] Optymalizacja obrazów
   - [ ] Code splitting

3. **Monitoring** (1 dzień)
   - [ ] Dodać logging
   - [ ] Dodać error tracking (Sentry?)

---

## 📊 DIAGRAM ARCHITEKTURY

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  React   │  │ Next.js │  │ React    │              │
│  │          │  │  App    │  │ Query    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────────────────────┐
│              NEXT.JS SERVER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Middleware  │  │  API Routes  │  │ Server       │ │
│  │  (Auth)      │  │              │  │ Actions      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────┬──────────────┬──────────────────┬────────────────┘
      │              │                  │
      ▼              ▼                  ▼
┌──────────┐  ┌──────────┐      ┌──────────┐
│ Service  │  │ Service  │      │   AI     │
│  Layer   │  │  Layer   │      │ Service  │
└─────┬────┘  └─────┬────┘      └─────┬────┘
      │             │                  │
      ▼             ▼                  ▼
┌──────────┐  ┌──────────┐      ┌──────────┐
│Repository│  │Repository│      │ OpenAI/ │
│  Layer   │  │  Layer   │      │Anthropic │
└─────┬────┘  └─────┬────┘      └──────────┘
      │             │
      └──────┬──────┘
             ▼
      ┌──────────┐
      │  Prisma  │
      │   ORM    │
      └─────┬────┘
            ▼
      ┌──────────┐
      │PostgreSQL│
      │ Database │
      └──────────┘
```

---

## ✅ CHECKLIST IMPLEMENTACJI

### Priorytet 1 (Krytyczne):
- [ ] Ujednolicenie autentykacji (JWT)
- [ ] Ujednolicenie routingu
- [ ] Migracja na PostgreSQL
- [ ] Error boundaries
- [ ] Centralne error handling

### Priorytet 2 (Wysoki):
- [ ] AI integration (OpenAI)
- [ ] Rate limiting
- [ ] Caching
- [ ] Loading states
- [ ] Validation centralizacja

### Priorytet 3 (Średni):
- [ ] Service layer
- [ ] Repository pattern
- [ ] Kanban/Timeline views
- [ ] Porównywarka dostawców
- [ ] Eksport PDF

### Priorytet 4 (Niski):
- [ ] Monitoring/logging
- [ ] Analytics
- [ ] E2E testy
- [ ] Performance optimization

---

**Plan przygotowany przez**: Senior Fullstack Developer  
**Data**: 2024
