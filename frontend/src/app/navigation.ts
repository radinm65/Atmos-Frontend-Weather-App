import { Bookmark, CalendarDays, CloudSun, Columns2, Map, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  /** The compact bottom tab bar fits five tabs; items with `false` are reached another way there. */
  inTabBar: boolean
}

/** Single source of truth for primary navigation. Routes are defined in router.tsx. */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Overview', icon: CloudSun, inTabBar: true },
  { path: '/forecast', label: 'Forecast', icon: CalendarDays, inTabBar: true },
  { path: '/compare', label: 'Compare', icon: Columns2, inTabBar: true },
  { path: '/map', label: 'Map', icon: Map, inTabBar: true },
  { path: '/assistant', label: 'Assistant', icon: Sparkles, inTabBar: true },
  // On compact screens, Locations is opened from the location chip in the header.
  { path: '/locations', label: 'Locations', icon: Bookmark, inTabBar: false },
]
