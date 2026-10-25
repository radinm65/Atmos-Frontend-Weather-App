import { motion } from 'motion/react'
import { WiDayCloudy } from 'react-icons/wi'
import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS } from '../../app/navigation'
import { WeatherBackdrop } from '../../features/backdrop/WeatherBackdrop'
import { useBackdropScene } from '../../features/backdrop/useBackdropScene'
import { LocationPicker } from '../../features/locations/LocationPicker'
import { ThemeToggle } from '../../features/preferences/ThemeToggle'
import styles from './AppShell.module.css'
import { SiteFooter } from './SiteFooter'

export function AppShell() {
  const { scene, dim } = useBackdropScene()

  return (
    <>
      <WeatherBackdrop scene={scene} dim={dim} />

      <div className={styles.shell}>
        <a href="#main-content" className={styles.skipLink}>
          Skip to main content
        </a>

        <header className={styles.headerWrap}>
          <div className={`glass-strong ${styles.header}`}>
            <NavLink to="/" className={styles.brand} aria-label="Atmos home">
              <WiDayCloudy size={34} aria-hidden="true" className={styles.logo} />
              <span>Atmos</span>
            </NavLink>

            <nav className={styles.nav} aria-label="Main">
              <ul className={styles.navList}>
                {NAV_ITEMS.map(({ path, label, icon: Icon, inTabBar }) => (
                  <li key={path} className={inTabBar ? undefined : styles.desktopOnly}>
                    <NavLink
                      to={path}
                      end={path === '/'}
                      className={({ isActive }) =>
                        [styles.navLink, isActive ? styles.navLinkActive : '']
                          .filter(Boolean)
                          .join(' ')
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
    </>
  )
}
