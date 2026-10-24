export interface Location {
  /** Stable app-level id, e.g. `om:2950159` (geocoded place) or `geo:52.52,13.41` (device position). */
  id: string
  name: string
  /** First-level administrative area (state, province), when known. */
  region?: string
  country?: string
  latitude: number
  longitude: number
  /** IANA time zone, e.g. `Europe/Berlin`, when known. */
  timezone?: string
}

/** One-line label that tells similarly named places apart, e.g. "Berlin, State of Berlin, Germany". */
export function describeLocation(location: Location): string {
  return [location.name, location.region, location.country]
    .filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index)
    .join(', ')
}
