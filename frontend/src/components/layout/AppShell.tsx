import { motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { WiDayCloudy } from 'react-icons/wi'
import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS } from '../../app/navigation'
import { WeatherBackdrop } from '../../features/backdrop/WeatherBackdrop'
import { useBackdropScene } from '../../features/backdrop/useBackdropScene'
import { LocationPicker } from '../../features/locations/LocationPicker'
import { ThemeToggle } from '../../features/preferences/ThemeToggle'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import styles from './AppShell.module.css'
import { SiteFooter } from './SiteFooter'

/** Matches the breakpoint in AppShell.module.css where the tabs move to the bottom of the screen. */
const COMPACT_QUERY = '(max-width: 768px)'

export function AppShell() {
  const { scene, dim } = useBackdropScene()
  const compact = useMediaQuery(COMPACT_QUERY)

  const nav = (
    <nav className={styles.nav} aria-label="Main">
      <ul className={styles.navList}>
        {NAV_ITEMS.map(({ path, label, icon: Icon, inTabBar }) => (
          <li key={path} className={inTabBar ? undefined : styles.desktopOnly}>
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span
                      layoutId="nav-pill"
                      className={styles.activePill}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <Icon size={19} aria-hidden="true" className={styles.navIcon} />
                  <span className={styles.navLabel}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )

  return (
    <>
      <WeatherBackdrop scene={scene} dim={dim} />

      <div className={styles.shell}>
        <a href="#main-content" className={styles.skipLink}>
          Skip to main content
        </a>

        <header className={styles.headerWrap}>
          <div className={styles.header}>
            <NavLink to="/" className={styles.brand} aria-label="Atmos home">
              <WiDayCloudy size={34} aria-hidden="true" className={styles.logo} />
              <span>Atmos</span>
            </NavLink>

            {/* In the header on wide screens. */}
            {compact ? null : nav}

            <div className={styles.controls}>
              <LocationPicker />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main id="main-content" className={styles.main} tabIndex={-1}>
          <Outlet />
        </main>

        <SiteFooter />
      </div>

      {/*
        On phones the tab bar is rendered straight into <body>, outside the header and every
        wrapper, so no ancestor (sticky, filtered, transformed) can ever make it scroll or jump.
      */}
      {compact ? createPortal(nav, document.body) : null}
    </>
  )
}
