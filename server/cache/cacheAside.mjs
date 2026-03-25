export const createCacheAside = ({ redis, redlock }) => {
  const stats = { hits: 0, misses: 0, sets: 0, deletes: 0 }

  const getJson = async (key) => {
    if (!redis) return null
    const raw = await redis.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const setJson = async (key, value, ttlSeconds) => {
    if (!redis) return
    const payload = JSON.stringify(value)
    if (ttlSeconds) {
      await redis.set(key, payload, 'EX', ttlSeconds)
    } else {
      await redis.set(key, payload)
    }
    stats.sets += 1
  }

  const del = async (keys) => {
    if (!redis) return
    const arr = Array.isArray(keys) ? keys : [keys]
    if (!arr.length) return
    await redis.del(arr)
    stats.deletes += arr.length
  }

  const getOrSet = async ({ key, ttlSeconds, lockTtlMs, loader }) => {
    const cached = await getJson(key)
    if (cached != null) {
      stats.hits += 1
      return cached
    }
    stats.misses += 1

    if (!redis || !redlock) {
      const value = await loader()
      if (value != null) await setJson(key, value, ttlSeconds)
      return value
    }

    const resource = `lock:${key}`
    const lock = await redlock.acquire([resource], lockTtlMs || 2000)
    try {
      const cachedAfterLock = await getJson(key)
      if (cachedAfterLock != null) {
        stats.hits += 1
        return cachedAfterLock
      }
      const value = await loader()
      if (value != null) await setJson(key, value, ttlSeconds)
      return value
    } finally {
      await lock.release().catch(() => {})
    }
  }

  return { getOrSet, del, stats }
}

