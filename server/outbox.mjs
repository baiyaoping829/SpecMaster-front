import { randomUUID } from 'node:crypto'

export const enqueueOutboxEvent = async (trx, event) => {
  const id = randomUUID()
  const now = new Date().toISOString()
  await trx
    .insertInto('outbox_events')
    .values({
      id,
      event_type: event.eventType,
      aggregate_type: event.aggregateType,
      aggregate_id: event.aggregateId,
      payload: JSON.stringify(event.payload || {}),
      status: 'pending',
      created_at: now
    })
    .execute()
  return id
}

export const startOutboxPublisher = ({ dbManager, redis, intervalMs }) => {
  if (!redis) return { stop: () => {} }

  let stopped = false
  let timer = null

  const tick = async () => {
    if (stopped) return
    try {
      const db = dbManager.getDb()
      const rows = await db
        .selectFrom('outbox_events')
        .selectAll()
        .where('status', '=', 'pending')
        .orderBy('created_at', 'asc')
        .limit(50)
        .execute()

      for (const row of rows) {
        await redis.xadd(
          'specmaster:events',
          '*',
          'id',
          String(row.id),
          'event_type',
          String(row.event_type),
          'aggregate_type',
          String(row.aggregate_type),
          'aggregate_id',
          String(row.aggregate_id),
          'payload',
          String(row.payload)
        )
        await db.updateTable('outbox_events').set({ status: 'sent' }).where('id', '=', row.id).execute()
      }
    } catch {
    } finally {
      if (!stopped) timer = setTimeout(tick, intervalMs || 500)
    }
  }

  timer = setTimeout(tick, intervalMs || 500)

  return {
    stop: () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }
}

export const startCacheInvalidationConsumer = ({ redis, cache }) => {
  if (!redis || !cache) return { stop: () => {} }

  let stopped = false
  let timer = null
  let lastId = '0-0'

  const tick = async () => {
    if (stopped) return
    try {
      const res = await redis.xread('BLOCK', 2000, 'COUNT', 100, 'STREAMS', 'specmaster:events', lastId)
      if (!res) return
      for (const [, entries] of res) {
        for (const [id, fields] of entries) {
          lastId = id
          const obj = {}
          for (let i = 0; i < fields.length; i += 2) {
            obj[fields[i]] = fields[i + 1]
          }
          if (obj.event_type === 'cache.invalidate' && obj.payload) {
            try {
              const payload = JSON.parse(obj.payload)
              const keys = Array.isArray(payload.keys) ? payload.keys : []
              await cache.del(keys)
            } catch {
            }
          }
        }
      }
    } catch {
    } finally {
      if (!stopped) timer = setTimeout(tick, 50)
    }
  }

  timer = setTimeout(tick, 50)

  return {
    stop: () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }
}

