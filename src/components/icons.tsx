"use client"

import {
  Moon,
  SunMedium,
  Twitter,
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  Users,
  Armchair,
  Table2,
  Handshake,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Plus,
  Trash,
  Edit,
  Calendar,
  Mail,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Upload,
  Loader2,
  Check,
  Copy,
} from "lucide-react"

// Zamiast jednego obiektu, eksportujemy każdą ikonę jako osobny komponent
// To rozwiązuje problemy z React Server Components
export const IconSun = SunMedium
export const IconMoon = Moon
export const IconTwitter = Twitter
export const IconDashboard = LayoutDashboard
export const IconTasks = CheckSquare
export const IconBudget = DollarSign
export const IconGuests = Users
export const IconSeating = Armchair
export const IconTable = Table2
export const IconVendors = Handshake
export const IconSettings = Settings
export const IconLogout = LogOut
export const IconUser = User
export const IconMenu = Menu
export const IconClose = X
export const IconAdd = Plus
export const IconDelete = Trash
export const IconEdit = Edit
export const IconCalendar = Calendar
export const IconMail = Mail
export const IconFile = FileText
export const IconChevronLeft = ChevronLeft
export const IconChevronRight = ChevronRight
export const IconMore = MoreHorizontal
export const IconSearch = Search
export const IconFilter = Filter
export const IconDownload = Download
export const IconUpload = Upload
export const IconSpinner = Loader2
export const IconCheck = Check
export const IconCopy = Copy

// Typ pozostaje dla ewentualnej referencji, ale nie jest już kluczowy
export type IconName =
  | "sun" | "moon" | "twitter" | "dashboard" | "tasks" | "budget"
  | "guests" | "seating" | "vendors" | "settings" | "logout" | "user"
  | "menu" | "close" | "add" | "delete" | "edit" | "calendar" | "mail"
  | "file" | "chevronLeft" | "chevronRight" | "more" | "search" | "filter"
  | "download" | "upload" | "spinner" | "check" | "copy"
