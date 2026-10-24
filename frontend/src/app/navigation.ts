import { Bookmark, CalendarDays, CloudSun, Columns2, Map, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

/** Single source of truth for primary navigation. Routes are defined in router.tsx. */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Overview', icon: CloudSun },
  { path: '/forecast', label: 'Forecast', icon: CalendarDays },
  { path: '/compare', label: 'Compare', icon: Columns2 },
  { path: '/map', label: 'Map', icon: Map },
  { path: '/assistant', label: 'Assistant', icon: Sparkles },
  { path: '/locations', label: 'Locations', icon: Bookmark },
]
