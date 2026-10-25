/**
 * Small, safe wrapper around localStorage. Values are stored as JSON and must pass a
 * caller-supplied type guard when read, so malformed, outdated or tampered data is
 * ignored instead of crashing the app. Never store secrets here.
 * Keys carry a version (atmos:<name>:v<n>), so a changed format can simply use a new key.
 */

const KEY_PREFIX = 'atmos:'

export type Validator<T> = (value: unknown) => value is T

/** Builds a namespaced, versioned key, e.g. `atmos:theme:v1`. Bump the version to invalidate old data. */
export function storageKey(name: string, version: number): string {
  return `${KEY_PREFIX}${name}:v${version}`
}

function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    // Access can throw when storage is blocked (privacy modes, sandboxed iframes).
    return null
  }
}

/** Returns the stored value if it exists, parses as JSON and passes `validate`; otherwise `null`. */
export function readStorage<T>(key: string, validate: Validator<T>): T | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return validate(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Reads a JSON value and hands it to `parse`, which decides what to keep, for example by dropping
 * invalid entries or filling in defaults. Returns `null` when nothing is stored, storage is
 * blocked, the text is not JSON, or `parse` throws.
 */
export function readStorageParsed<T>(key: string, parse: (value: unknown) => T): T | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (raw === null) return null
    return parse(JSON.parse(raw))
  } catch {
    return null
  }
}

/**
 * Reads a stored list, keeping only the entries that pass `validate` (so one corrupted entry
 * does not lose the rest), without duplicates by `keyOf`, and at most `max` of them.
 * Anything that is not an array gives an empty list.
 */
export function readStorageList<T>(
  key: string,
  validate: Validator<T>,
  options: { max: number; keyOf: (item: T) => string },
): T[] {
  const list = readStorageParsed(key, (value) => (Array.isArray(value) ? value : []))
  if (!list) return []
  const seen = new Set<string>()
  const kept: T[] = []
  for (const item of list) {
    if (!validate(item)) continue
    const id = options.keyOf(item)
    if (seen.has(id)) continue
    seen.add(id)
    kept.push(item)
    if (kept.length >= options.max) break
  }
  return kept
}

/** Returns `true` if the value was written. Failure (quota, blocked storage) is non-fatal. */
export function writeStorage(key: string, value: unknown): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStorage(key: string): void {
  try {
    getStorage()?.removeItem(key)
  } catch {
    // Nothing useful to do if removal fails.
  }
}
