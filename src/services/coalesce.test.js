import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { makeCoalescer } from './coalesce'

describe('makeCoalescer — in-flight deduplication (no TTL)', () => {
  test('calls fn once for concurrent requests with the same key', async () => {
    const fn = vi.fn().mockResolvedValue('data')
    const c  = makeCoalescer()

    const [a, b, d] = await Promise.all([c('k', fn), c('k', fn), c('k', fn)])

    expect(fn).toHaveBeenCalledTimes(1)
    expect(a).toBe('data')
    expect(b).toBe('data')
    expect(d).toBe('data')
  })

  test('fires a fresh request after the first one settles', async () => {
    const fn = vi.fn().mockResolvedValue('v')
    const c  = makeCoalescer()

    await c('k', fn)
    await c('k', fn)

    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('different keys each get their own request', async () => {
    const fn = vi.fn().mockResolvedValue('v')
    const c  = makeCoalescer()

    await Promise.all([c('a', fn), c('b', fn), c('c', fn)])

    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('evicts key on rejection so next call retries', async () => {
    let call = 0
    const fn = vi.fn().mockImplementation(async () => {
      if (++call === 1) throw new Error('fail')
      return 'ok'
    })
    const c = makeCoalescer()

    await expect(c('k', fn)).rejects.toThrow('fail')
    await expect(c('k', fn)).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('concurrent callers all receive the rejection', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    const c  = makeCoalescer()

    const results = await Promise.allSettled([c('k', fn), c('k', fn)])

    expect(fn).toHaveBeenCalledTimes(1)
    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('rejected')
  })

  test('invalidate() removes the key so next call fetches fresh', async () => {
    let n = 0
    const fn = vi.fn().mockImplementation(async () => ++n)
    const c  = makeCoalescer()

    const v1 = await c('k', fn)
    c.invalidate('k')
    const v2 = await c('k', fn)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(v1).toBe(1)
    expect(v2).toBe(2)
  })

  test('invalidate() with no arg clears all in-flight entries', async () => {
    const fn = vi.fn().mockResolvedValue('x')
    const c  = makeCoalescer()

    // settled entries are already evicted — size should be 0
    await Promise.all([c('a', fn), c('b', fn)])
    expect(c.size()).toBe(0)

    // put something in-flight then nuke it
    const p = c('a', fn)
    expect(c.size()).toBe(1)
    c.invalidate()
    expect(c.size()).toBe(0)
    await p // original promise still resolves normally
  })
})

describe('makeCoalescer — TTL cache', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('returns cached value within TTL without calling fn again', async () => {
    const fn = vi.fn().mockResolvedValue('cached')
    const c  = makeCoalescer({ ttl: 5000 })

    const v1 = await c('k', fn)
    const v2 = await c('k', fn)
    const v3 = await c('k', fn)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(v1).toBe('cached')
    expect(v2).toBe('cached')
    expect(v3).toBe('cached')
  })

  test('calls fn again after TTL expires', async () => {
    let n = 0
    const fn = vi.fn().mockImplementation(async () => ++n)
    const c  = makeCoalescer({ ttl: 5000 })

    const v1 = await c('k', fn)
    vi.advanceTimersByTime(6000)
    const v2 = await c('k', fn)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(v1).toBe(1)
    expect(v2).toBe(2)
  })

  test('invalidate() busts TTL-cached entry', async () => {
    let n = 0
    const fn = vi.fn().mockImplementation(async () => ++n)
    const c  = makeCoalescer({ ttl: 60_000 })

    await c('k', fn)
    c.invalidate('k')
    await c('k', fn)

    expect(fn).toHaveBeenCalledTimes(2)
  })
})
