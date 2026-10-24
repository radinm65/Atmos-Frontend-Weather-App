import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS } from '../../app/navigation'
import { LocationPicker } from '../../features/locations/LocationPicker'
import { ThemeToggle } from '../../features/preferences/ThemeToggle'
import styles from './AppShell.module.css'
import { SiteFooter } from './SiteFooter'

export function AppShell() {
  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink to="/" className={styles.brand} aria-label="Atmos home">
            Atmos
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
                    <Icon size={20} aria-hidden="true" />
                    <span>{label}</span>
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
  )
}
