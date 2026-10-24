/**
 * Small, safe wrapper around localStorage. Values are stored as JSON and must pass a
 * caller-supplied type guard when read, so malformed, outdated or tampered data is
 * ignored instead of crashing the app. Never store secrets here.
 * Phase 4 extends this with versioned envelopes for locations and preferences.
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
