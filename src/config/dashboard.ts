import { MainNavItem, SidebarNavItem } from "@/types"

interface DashboardConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "Dashboard",
      href: "/",
    },
    {
      title: "Zadania",
      href: "/tasks",
    },
    {
      title: "Budżet",
      href: "/budget",
    },
    {
      title: "Goście",
      href: "/guests",
    },
    {
      title: "Komunikacja",
      href: "/communication",
    },
    {
      title: "Dostawcy",
      href: "/vendors",
    },
    {
      title: "Plan Stołów",
      href: "/seating",
    },
    {
      title: "Organizacja",
      href: "/day",
    },
    {
      title: "Portal gościa",
      href: "/portal",
    },
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/",
      items: [],
    },
    {
      title: "Zarządzanie",
      items: [
        {
          title: "Zadania",
          href: "/tasks",
        },
        {
          title: "Budżet",
          href: "/budget",
        },
        {
          title: "Goście",
          href: "/guests",
        },
        {
          title: "Komunikacja",
          href: "/communication",
        },
        {
          title: "Dostawcy",
          href: "/vendors",
        },
        {
          title: "Organizacja",
          href: "/day",
        },
        {
          title: "Portal gościa",
          href: "/portal",
        },
      ],
    },
  ],
}
