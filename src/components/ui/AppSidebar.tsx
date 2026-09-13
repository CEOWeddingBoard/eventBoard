"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SidebarItem = {
  label: string
  href: string
  icon: React.ReactNode
  children?: SidebarItem[]
  badge?: number
}

interface AppSidebarProps {
  locale: string
  items: SidebarItem[]
  title: React.ReactNode
  titleHref: string
  bottomItems?: SidebarItem[]
  bottomContent?: React.ReactNode
  variant?: "wedding" | "business"
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

type SidebarContextValue = {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
})

export function useSidebar() {
  return React.useContext(SidebarContext)
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}
    >
      <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  )
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  return (
    <div
      className={cn(
        "flex-1 min-h-screen transition-[padding-left] duration-200 ease-in-out",
        collapsed ? "lg:pl-[52px]" : "lg:pl-[220px]"
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isExternal(href: string) {
  return /^https?:\/\//.test(href)
}

function resolveHref(href: string, locale: string) {
  return isExternal(href) ? href : `/${locale}${href}`
}

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}\//, "/")
}

function isItemActive(item: SidebarItem, pathname: string): boolean {
  const currentPath = stripLocale(pathname)

  if (item.children && item.children.length > 0) {
    return item.children.some((c) => isItemActive(c, pathname))
  }

  if (currentPath === item.href) return true
  if (item.href !== "/" && currentPath.startsWith(item.href + "/")) return true
  return false
}

/* ------------------------------------------------------------------ */
/*  Nav Item                                                           */
/* ------------------------------------------------------------------ */

function SidebarNavItem({
  item,
  locale,
  collapsed,
  pathname,
  depth,
  variant = "wedding",
}: {
  item: SidebarItem
  locale: string
  collapsed: boolean
  pathname: string
  depth: number
  variant?: "wedding" | "business"
}) {
  const hasChildren = item.children && item.children.length > 0
  const [open, setOpen] = React.useState(false)
  const href = resolveHref(item.href, locale)
  const active = isItemActive(item, pathname)
  const t = VARIANT_TOKENS[variant]

  React.useEffect(() => {
    if (active && hasChildren && !collapsed) {
      setOpen(true)
    }
  }, [active, hasChildren, collapsed])

  const linkContent = (
    <>
      <span className="flex h-5 w-5 items-center justify-center shrink-0">
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="ml-2.5 text-[13px] font-medium truncate">
            {item.label}
          </span>
          <span className="ml-auto flex items-center gap-1">
            {item.badge != null && item.badge > 0 && (
              <span className={cn("inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[11px] font-semibold", t.badge, t.badgeText)}>
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 opacity-40 transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            )}
          </span>
        </>
      )}
    </>
  )

  const linkClasses = cn(
    "flex items-center w-full rounded transition-all duration-150 group",
    collapsed ? "justify-center px-0 py-2" : "px-2.5 py-1.5",
    active ? t.navActive : t.navHover,
    t.focusRing,
    "focus-visible:outline-none focus-visible:ring-2",
    depth > 0 && !collapsed && "pl-8"
  )

  if (collapsed && !hasChildren) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Link href={href} className={linkClasses}>
            {linkContent}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  if (collapsed && hasChildren) {
    return null
  }

  return (
    <div>
      {hasChildren ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(linkClasses, "w-full text-left")}
        >
          {linkContent}
        </button>
      ) : (
        <Link href={href} className={linkClasses}>
          {linkContent}
        </Link>
      )}

      {hasChildren && open && (
        <div className="mt-0.5 space-y-0.5 overflow-hidden">
          {item.children!.map((child) => (
            <SidebarNavItem
              key={child.href}
              item={child}
              locale={locale}
              collapsed={false}
              pathname={pathname}
              depth={depth + 1}
              variant={variant}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Theme tokens per variant                                           */
/* ------------------------------------------------------------------ */

type VariantTokens = {
  sidebar: string
  header: string
  navActive: string
  navHover: string
  navBase: string
  focusRing: string
  badge: string
  badgeText: string
  toggle: string
  mobileBtn: string
  collapseBtn: string
  separator: string
}

const VARIANT_TOKENS: Record<"wedding" | "business", VariantTokens> = {
  wedding: {
    sidebar: "bg-white border-r border-olive/20 shadow-soft",
    header: "border-b border-olive/20",
    navActive: "bg-olive-muted/40 text-olive font-medium",
    navHover: "text-ink-muted hover:bg-olive-muted/20 hover:text-ink",
    navBase: "",
    focusRing: "focus-visible:ring-olive/35",
    badge: "bg-gold/20",
    badgeText: "text-gold",
    toggle: "rounded-full border border-olive/30 bg-olive-muted text-olive",
    mobileBtn: "bg-white border border-olive/20 text-ink-muted hover:text-ink",
    collapseBtn: "border border-olive/20 text-ink-muted hover:text-ink hover:bg-olive-muted/30 rounded-md",
    separator: "border-olive/15",
  },
  business: {
    sidebar: "bg-white border-r border-neutral-100",
    header: "border-b border-neutral-100",
    navActive: "bg-neutral-100 text-neutral-900 font-semibold",
    navHover: "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800",
    navBase: "",
    focusRing: "focus-visible:ring-neutral-200",
    badge: "bg-neutral-200",
    badgeText: "text-neutral-600",
    toggle: "rounded-md bg-neutral-800 text-white",
    mobileBtn: "bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-800",
    collapseBtn: "border border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md",
    separator: "border-neutral-100",
  },
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

export function AppSidebar({
  locale,
  items,
  title,
  titleHref,
  bottomItems,
  bottomContent,
  variant = "wedding",
}: AppSidebarProps) {
  const pathname = usePathname()
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const t = VARIANT_TOKENS[variant]

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-40 flex flex-col",
    "transition-all duration-200 ease-in-out",
    t.sidebar,
    collapsed ? "w-[52px]" : "w-[220px]"
  )

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile hamburger */}
      <button
        type="button"
        className={cn(
          "fixed top-3 left-3 z-50 lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg",
          t.mobileBtn,
          "transition-all duration-200",
          mobileOpen && "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(true)}
        aria-label="Otwórz menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar panel */}
      <aside
        className={cn(
          sidebarClasses,
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header / logo */}
        <div
          className={cn(
            "flex items-center h-14 px-3 shrink-0",
            t.header,
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {collapsed ? (
            <Link
              href={resolveHref(titleHref, locale)}
              className="flex items-center justify-center"
              aria-label="Strona główna"
            >
              <span className={cn("flex h-8 w-8 items-center justify-center shrink-0", t.toggle)}>
                <ChevronLeft className="h-4 w-4 hidden" />
              </span>
            </Link>
          ) : (
            <Link
              href={resolveHref(titleHref, locale)}
              className="flex items-center gap-2 min-w-0"
            >
              {title}
            </Link>
          )}

          {/* Desktop collapse toggle */}
          <button
            type="button"
            className={cn(
              "hidden lg:inline-flex items-center justify-center h-7 w-7 transition-all duration-200 shrink-0",
              t.collapseBtn,
              collapsed &&
                "absolute -right-3 top-4 h-6 w-6 rounded-full bg-white shadow-sm border-slate-200"
            )}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Rozwiń menu" : "Zwiń menu"}
          >
            <ChevronLeft
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </button>

          {/* Mobile close */}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-muted hover:text-ink"
            onClick={() => setMobileOpen(false)}
            aria-label="Zamknij menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-0.5 px-2 py-2 flex-1 overflow-y-auto">
          {items.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              locale={locale}
              collapsed={collapsed}
              pathname={pathname}
              depth={0}
              variant={variant}
            />
          ))}
        </nav>

        {/* Bottom section */}
        {(bottomItems?.length || bottomContent) ? (
          <div className={cn("px-2 py-3 space-y-0.5", "border-t", t.separator)}>
            {bottomItems?.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                locale={locale}
                collapsed={collapsed}
                pathname={pathname}
                depth={0}
                variant={variant}
              />
            ))}
            {!collapsed && bottomContent}
          </div>
        ) : (
          <div className={cn("px-2 py-2", "border-t", t.separator)}>
            {!collapsed && bottomContent}
          </div>
        )}
      </aside>
    </>
  )
}
