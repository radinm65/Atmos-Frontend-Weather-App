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

/** Region and country, e.g. "State of Berlin, Germany". Empty when neither is known. */
export function describeLocationDetail(location: Location): string {
  return [location.region, location.country]
    .filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index)
    .filter((part) => part !== location.name)
    .join(', ')
}

/** One-line label that tells similarly named places apart, e.g. "Berlin, State of Berlin, Germany". */
export function describeLocation(location: Location): string {
  const detail = describeLocationDetail(location)
  return detail ? `${location.name}, ${detail}` : location.name
}
