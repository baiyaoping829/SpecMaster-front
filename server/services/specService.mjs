import { withTransaction, optimisticUpdateById } from '../db/tx.mjs'
import { enqueueOutboxEvent } from '../outbox.mjs'

const now = () => new Date().toISOString()

export const createSpecService = ({ dbManager, cache }) => {
  const listKey = (query) => {
    const q = query || {}
    const name = q.name || ''
    const code = q.code || ''
    const type = q.type || ''
    return `spec:list:${encodeURIComponent(`${name}|${code}|${type}`)}`
  }

  const detailKey = (id) => `spec:detail:${id}`

  const list = async ({ dialect, query, limit, offset }) => {
    const key = listKey(query)
    return cache.getOrSet({
      key,
      ttlSeconds: 60,
      lockTtlMs: 1500,
      loader: async () => {
        const db = dbManager.getDb(dialect)
        let qb = db.selectFrom('specs').selectAll().orderBy('created_at', 'desc')
        let countQb = db.selectFrom('specs')
        if (query?.name) qb = qb.where('name', 'like', `%${query.name}%`)
        if (query?.code) qb = qb.where('code', 'like', `%${query.code}%`)
        if (query?.type) qb = qb.where('type', '=', query.type)
        if (query?.name) countQb = countQb.where('name', 'like', `%${query.name}%`)
        if (query?.code) countQb = countQb.where('code', 'like', `%${query.code}%`)
        if (query?.type) countQb = countQb.where('type', '=', query.type)
        if (offset) qb = qb.offset(offset)
        if (limit) qb = qb.limit(limit)
        const items = await qb.execute()
        const totalRow = await countQb.select((eb) => eb.fn.count('id').as('cnt')).executeTakeFirst()
        const total = Number(totalRow?.cnt || 0)
        return { items, total }
      }
    })
  }

  const detail = async ({ dialect, id }) => {
    const key = detailKey(id)
    return cache.getOrSet({
      key,
      ttlSeconds: 300,
      lockTtlMs: 1500,
      loader: async () => {
        const db = dbManager.getDb(dialect)
        const spec = await db.selectFrom('specs').selectAll().where('id', '=', id).executeTakeFirst()
        return spec || null
      }
    })
  }

  const create = async ({ dialect, input, actorUserId }) => {
    const db = dbManager.getDb(dialect)
    const id = String(Date.now())
    const createdAt = now()
    const updatedAt = createdAt
    const spec = {
      id,
      name: String(input.name || ''),
      code: String(input.code || ''),
      type: String(input.type || 'GB'),
      level: Number(input.level || 1),
      status: Number(input.status || 1),
      implementation_date: input.implementationDate || null,
      compilation_unit: input.compilationUnit || null,
      keywords: input.keywords || null,
      description: input.description || null,
      version: 0,
      created_at: createdAt,
      updated_at: updatedAt
    }

    await withTransaction(
      db,
      { dialect, isolationLevel: 'read committed' },
      async (trx) => {
        await trx.insertInto('specs').values(spec).execute()
        await enqueueOutboxEvent(trx, {
          eventType: 'cache.invalidate',
          aggregateType: 'spec',
          aggregateId: id,
          payload: { keys: [detailKey(id), listKey({})] }
        })
      }
    )

    await cache.del([detailKey(id), listKey({})])
    return { ...spec, actorUserId: actorUserId || null }
  }

  const update = async ({ dialect, id, version, patch, actorUserId }) => {
    const db = dbManager.getDb(dialect)
    const updatedAt = now()

    await withTransaction(db, { dialect, isolationLevel: 'read committed' }, async (trx) => {
      await optimisticUpdateById(trx, 'specs', id, version, { ...patch, updated_at: updatedAt })
      await enqueueOutboxEvent(trx, {
        eventType: 'cache.invalidate',
        aggregateType: 'spec',
        aggregateId: id,
        payload: { keys: [detailKey(id), listKey({})] }
      })
    })

    await cache.del([detailKey(id), listKey({})])
    return { id, actorUserId: actorUserId || null }
  }

  return { list, detail, create, update }
}

