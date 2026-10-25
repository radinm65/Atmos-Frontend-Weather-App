import { describe, expect, it, vi } from 'vitest'
import {
  readStorage,
  readStorageList,
  readStorageParsed,
  removeStorage,
  storageKey,
  writeStorage,
} from './storage'

const isString = (value: unknown): value is string => typeof value === 'string'

describe('storageKey', () => {
  it('namespaces and versions the key', () => {
    expect(storageKey('theme', 1)).toBe('atmos:theme:v1')
  })
})

describe('readStorageParsed', () => {
  it('hands the JSON value to the parser', () => {
    window.localStorage.setItem('k', JSON.stringify({ n: 2 }))
    expect(readStorageParsed('k', (value) => (value as { n: number }).n * 2)).toBe(4)
  })

  it('returns null when nothing is stored, the text is not JSON, or the parser throws', () => {
    expect(readStorageParsed('missing', () => 1)).toBeNull()
    window.localStorage.setItem('bad', '{nope')
    expect(readStorageParsed('bad', () => 1)).toBeNull()
    window.localStorage.setItem('k', '1')
    expect(
      readStorageParsed('k', () => {
        throw new Error('boom')
      }),
    ).toBeNull()
  })
})

describe('readStorageList', () => {
  const isItem = (value: unknown): value is { id: string } =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string'
  const options = { max: 3, keyOf: (item: { id: string }) => item.id }

  it('keeps valid entries and drops corrupted ones without losing the rest', () => {
    window.localStorage.setItem(
      'l',
      JSON.stringify([{ id: 'a' }, 42, null, { id: 7 }, { id: 'b' }]),
    )
    expect(readStorageList('l', isItem, options)).toEqual([{ id: 'a' }, { id: 'b' }])
  })

  it('removes duplicates and caps the length', () => {
    window.localStorage.setItem(
      'l',
      JSON.stringify([{ id: 'a' }, { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]),
    )
    expect(readStorageList('l', isItem, options).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('returns an empty list for missing, non-JSON or non-array data', () => {
    expect(readStorageList('missing', isItem, options)).toEqual([])
    window.localStorage.setItem('l', '{oops')
    expect(readStorageList('l', isItem, options)).toEqual([])
    window.localStorage.setItem('l', JSON.stringify({ id: 'a' }))
    expect(readStorageList('l', isItem, options)).toEqual([])
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
