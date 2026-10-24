import { describe, expect, it } from 'vitest'
import { readConfig } from './env'

describe('readConfig', () => {
  it('defaults to the live data source', () => {
    expect(readConfig({})).toEqual({ dataSource: 'live' })
    expect(readConfig({ VITE_DATA_SOURCE: '' })).toEqual({ dataSource: 'live' })
  })

  it('accepts live and snapshot', () => {
    expect(readConfig({ VITE_DATA_SOURCE: 'live' }).dataSource).toBe('live')
    expect(readConfig({ VITE_DATA_SOURCE: ' snapshot ' }).dataSource).toBe('snapshot')
  })

  it('rejects unknown values loudly instead of guessing', () => {
    expect(() => readConfig({ VITE_DATA_SOURCE: 'mock' })).toThrow(/VITE_DATA_SOURCE/)
  })
})
