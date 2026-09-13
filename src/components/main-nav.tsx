"use client"



import * as React from "react"

import Link from "next/link"

import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

import { Heart, Menu, BarChart3, Image, Palette, Gift, Globe } from "lucide-react"

import { LanguageSwitcher } from "./language-switcher"

import { useTranslations } from "next-intl"
import { SERVICE_NAME } from "@/lib/brand"

import { Button } from "@/components/ui/button"

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu"



interface MainNavProps {

  locale?: string

}



export function MainNav({ locale = "pl" }: MainNavProps) {

  const pathname = usePathname()

  const t = useTranslations("navigation")



  const navItems = [

    { title: t("dashboard"), href: "/dashboard" },

    { title: t("tasks"), href: "/dashboard/tasks" },

    { title: t("budget"), href: "/dashboard/budget" },

    { title: t("guests"), href: "/dashboard/guests" },

    { title: t("analytics"), href: "/dashboard/analytics", icon: BarChart3 },

    { title: t("photos"), href: "/dashboard/photos", icon: Image },

    { title: t("moodboard"), href: "/dashboard/moodboard", icon: Palette },

    { title: t("gifts"), href: "/dashboard/gifts", icon: Gift },

    { title: t("website"), href: "/dashboard/website", icon: Globe },

    { title: t("stationery"), href: "/dashboard/stationery", premium: true },

    { title: t("seating"), href: "/dashboard/seating" },

    { title: t("day"), href: "/dashboard/day" },

    { title: t("dayOf"), href: "/dashboard/day-of" },

    { title: t("vendors"), href: "/dashboard/vendors" },

    { title: t("portal"), href: "/dashboard/portal" },

    { title: t("account"), href: "/dashboard/account" },

  ]



  const renderNavLink = (item: (typeof navItems)[number]) => {

    const hrefWithLocale = `/${locale}${item.href}`

    const isActive =

      item.href === "/dashboard"

        ? pathname === hrefWithLocale

        : item.href === "/dashboard/account"

        ? pathname === hrefWithLocale ||

          pathname.startsWith(hrefWithLocale + "/")

        : pathname === hrefWithLocale || pathname.startsWith(hrefWithLocale + "/")

    const Icon = "icon" in item ? item.icon : null;

    return (

      <Link

        href={hrefWithLocale}

        className={cn(

          "relative font-medium tracking-wide transition-all duration-300 px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5",

          isActive

            ? "text-ink font-semibold bg-olive/15 shadow-sm"

            : "text-ink-muted hover:text-ink hover:bg-olive/8",

          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/35"

        )}

      >

        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}

        {item.title}
        {"premium" in item && item.premium ? (
          <span className="ml-1 text-[10px] text-gold font-semibold not-italic">✦</span>
        ) : null}

      </Link>

    )

  }



  return (

    <div className="flex w-full min-w-0 items-center gap-2 sm:gap-4 xl:gap-6">

      <Link

        href={`/${locale}/dashboard`}

        className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 min-w-0"

      >

        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-olive/30 bg-olive-muted text-olive group-hover:bg-olive/15 group-hover:border-olive/50 transition-all duration-300 shrink-0">

          <Heart className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />

        </div>

        <span className="font-script text-xl sm:text-[26px] font-normal tracking-tight text-ink group-hover:text-gold transition-colors hidden sm:inline truncate">

          {SERVICE_NAME}

        </span>

      </Link>



      <nav className="hidden lg:flex items-center justify-center gap-2 xl:gap-3 2xl:gap-6 text-sm xl:text-[15px] 2xl:text-base font-serif italic flex-1 min-w-0">

        {navItems.map((item) => (

          <React.Fragment key={item.href}>{renderNavLink(item)}</React.Fragment>

        ))}

      </nav>



      <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">

        <LanguageSwitcher />

        <DropdownMenu>

          <DropdownMenuTrigger asChild>

            <Button

              type="button"

              variant="ghost"

              size="icon"

              className="h-9 w-9 rounded-full border border-olive/20 bg-white/80 hover:bg-olive/10 lg:hidden shrink-0"

              aria-label="Otwórz nawigację"

            >

              <Menu className="h-5 w-5 text-ink-muted" />

            </Button>

          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 max-w-[min(90vw,20rem)]">

            {navItems.map((item) => (

              <DropdownMenuItem key={item.href} asChild className="cursor-pointer">

                {renderNavLink(item)}

              </DropdownMenuItem>

            ))}

          </DropdownMenuContent>

        </DropdownMenu>

      </div>

    </div>

  )

}


