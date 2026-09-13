import '@testing-library/jest-dom';
import React from 'react';

// Polyfill for Request/Response (needed for Next.js API routes tests)
if (typeof global.Request === 'undefined') {
  (global as any).Request = class Request {
    url: string;
    method: string;
    headers: Headers;
    body: string | null;
    
    constructor(url: string, init: RequestInit = {}) {
      this.url = url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers || {});
      this.body = init.body as string || null;
    }
    async text() {
      return this.body || '';
    }
    async json() {
      return JSON.parse(this.body || '{}');
    }
  };
}

if (typeof global.Headers === 'undefined') {
  (global as any).Headers = class Headers {
    _headers: Record<string, string> = {};
    
    constructor(init: HeadersInit = {}) {
      if (init instanceof Headers) {
        init.forEach((value, key) => {
          this._headers[key] = value;
        });
      } else if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key] = value as string;
        });
      }
    }
    get(name: string) {
      return this._headers[name.toLowerCase()] || null;
    }
    set(name: string, value: string) {
      this._headers[name.toLowerCase()] = value;
    }
    has(name: string) {
      return name.toLowerCase() in this._headers;
    }
    forEach(callback: (value: string, key: string, parent: Headers) => void) {
      Object.entries(this._headers).forEach(([key, value]) => {
        callback(value, key, this as any);
      });
    }
  };
}

if (typeof global.Response === 'undefined') {
  (global as any).Response = class Response {
    body: unknown;
    status: number;
    headers: InstanceType<typeof Headers>;
    constructor(body?: unknown, init?: { status?: number; headers?: HeadersInit }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers ?? {});
    }
    static json(data: unknown, init?: { status?: number }) {
      const r = new (global as any).Response(JSON.stringify(data), init);
      r.headers.set('Content-Type', 'application/json');
      return r;
    }
  };
}

// Mock fetch
(global as any).fetch = jest.fn();

// Mock auth function to be mockable
jest.mock('@/lib/auth-mock', () => ({
  auth: jest.fn(() => ({ userId: 'mock-user-id' })),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
  }),
}));

// Mock @clerk/nextjs/server - zgodnie z użyciem w route.ts
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
  auth: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
  currentUser: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  }),
}));

// Mock @clerk/nextjs dla komponentów
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isSignedIn: true,
    user: {
      id: 'user_123',
      fullName: 'Test User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  }),
  UserButton: () => <div>Mock UserButton</div>,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
    theme: 'light',
    resolvedTheme: 'light',
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next-intl (ESM package - avoid transform)
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'pl',
  useFormatter: () => ({ formatDateTime: (x: unknown) => String(x), formatNumber: (x: unknown) => String(x) }),
  useMessages: () => ({}),
  useNow: () => new Date(),
  useTimeZone: () => 'Europe/Warsaw',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  IntlProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock sonner - zgodnie z użyciem w komponencie
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
    }),
  };
});

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_cache: jest.fn((fn: Function) => fn),
}));

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    wedding: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    task: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    budgetItem: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
    guest: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    vendor: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    table: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    household: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    weddingPlanVersion: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock UI components that use JSX
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-trigger">{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/multi-select', () => ({
  MultiSelect: ({ selected, onChange, options }: { selected: string[], onChange: (val: string[]) => void, options: { value: string, label: string }[] }) => (
    <div data-testid="multi-select">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            const newSelection = selected.includes(opt.value)
              ? selected.filter((s) => s !== opt.value)
              : [...selected, opt.value];
            onChange(newSelection);
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDraggable: () => ({ attributes: {}, listeners: {}, setNodeRef: jest.fn(), transform: null }),
  useDroppable: () => ({ setNodeRef: jest.fn() }),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: jest.fn(), transform: null, transition: null }),
  verticalListSortingStrategy: {},
}));

// Mock ResizeObserver
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
