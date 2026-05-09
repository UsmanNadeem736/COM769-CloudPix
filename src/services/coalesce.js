/**
 * Coalesces concurrent async requests by key.
 *
 * While a request for `key` is in-flight, every subsequent call with the same
 * key returns the *same* Promise instead of issuing a new one.  Once the
 * Promise settles the entry is evicted so the next call fires a fresh request.
 *
 * Optional `ttl` (ms) keeps a resolved value cached so even calls made *after*
 * the first resolves still hit the cache within that window.
 */
export function makeCoalescer({ ttl = 0 } = {}) {
  /**
   * @type {Map<string, { promise: Promise<any>, resolvedAt?: number, value?: any }>}
   */
  const store = new Map()

  function coalesce(key, fn) {
    const entry = store.get(key)

    if (entry) {
      // Resolved and within TTL → return cached value immediately
      if (entry.resolvedAt !== undefined) {
        if (ttl > 0 && Date.now() - entry.resolvedAt < ttl) {
          return Promise.resolve(entry.value)
        }
        // Expired — evict and fall through to a fresh request
        store.delete(key)
      } else {
        // Still in-flight → coalesce onto the existing promise
        return entry.promise
      }
    }

    const promise = fn().then(
      (value) => {
        if (ttl > 0) {
          store.set(key, { promise, resolvedAt: Date.now(), value })
        } else {
          store.delete(key)
        }
        return value
      },
      (err) => {
        store.delete(key)
        throw err
      }
    )

    store.set(key, { promise })
    return promise
  }

  /** Invalidate one key, or all keys when called with no argument. */
  coalesce.invalidate = (key) => {
    if (key === undefined) store.clear()
    else store.delete(key)
  }

  /** Number of live entries — useful for tests and debugging. */
  coalesce.size = () => store.size

  return coalesce
}

// ── Singleton coalescers used across the app ──────────────────

/** Pure in-flight deduplication — no TTL, evicts on settle */
export const coalesceRequest = makeCoalescer()

/** Photo list pages cached for 30 s */
export const coalescePhotoList = makeCoalescer({ ttl: 30_000 })

/** Individual photo detail cached for 60 s */
export const coalescePhotoDetail = makeCoalescer({ ttl: 60_000 })
