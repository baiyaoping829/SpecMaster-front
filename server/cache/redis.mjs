import Redis from 'ioredis'
import Redlock from 'redlock'

export const createRedisClients = (config) => {
  if (!config.redis.enabled) {
    return { redis: null, redlock: null }
  }

  const redis = new Redis(config.redis.url, {
    tls: config.redis.tls ? {} : undefined,
    lazyConnect: true,
    enableReadyCheck: true
  })

  const redlock = new Redlock([redis], {
    retryCount: 8,
    retryDelay: 50,
    retryJitter: 50
  })

  return { redis, redlock }
}

