import styles from './SiteFooter.module.css'

/**
 * Required data credits: Open-Meteo data is CC BY 4.0 and its place search uses GeoNames
 * (docs/PROVIDER_VALIDATION.md §1). Backdrop footage is credited to Mixkit (docs/CREDITS.md).
 * Map attribution is added with the map in Phase 5.
 */
export function SiteFooter() {
  return (
    <footer className={styles.wrap}>
      <div className={`glass ${styles.footer}`}>
        <p>
          Weather data by{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo.com
          </a>{' '}
          (
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY 4.0
          </a>
          ). Place names from{' '}
          <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">
            GeoNames
          </a>
          . Background footage from{' '}
          <a href="https://mixkit.co/" target="_blank" rel="noopener noreferrer">
            Mixkit
          </a>
          ; it illustrates the kind of weather, not the place.
        </p>
      </div>
    </footer>
  )
}
