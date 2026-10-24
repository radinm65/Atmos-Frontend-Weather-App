import { describe, expect, it, vi } from 'vitest'
import { readStorage, removeStorage, storageKey, writeStorage } from './storage'

const isString = (value: unknown): value is string => typeof value === 'string'

describe('storageKey', () => {
  it('namespaces and versions the key', () => {
    expect(storageKey('theme', 1)).toBe('atmos:theme:v1')
  })
})

describe('readStorage / writeStorage', () => {
  it('round-trips a valid value', () => {
    expect(writeStorage('k', 'dark')).toBe(true)
    expect(readStorage('k', isString)).toBe('dark')
  })

  it('returns null when the key is missing', () => {
    expect(readStorage('missing', isString)).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    window.localStorage.setItem('k', '{not json')
    expect(readStorage('k', isString)).toBeNull()
  })

  it('returns null when the value fails validation', () => {
    window.localStorage.setItem('k', JSON.stringify(42))
    expect(readStorage('k', isString)).toBeNull()
  })

  it('removes a stored value', () => {
    writeStorage('k', 'dark')
    removeStorage('k')
    expect(readStorage('k', isString)).toBeNull()
  })

  it('does not throw when storage access is blocked', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(readStorage('k', isString)).toBeNull()
    expect(writeStorage('k', 'dark')).toBe(false)
    expect(() => removeStorage('k')).not.toThrow()
    spy.mockRestore()
  })

  it('reports a failed write when setItem throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(writeStorage('k', 'dark')).toBe(false)
    spy.mockRestore()
  })
})
