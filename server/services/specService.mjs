import { withTransaction, optimisticUpdateById } from '../db/tx.mjs'
import { enqueueOutboxEvent } from '../outbox.mjs'

const now = () => new Date().toISOString()

export const createSpecService = ({ dbManager, cache }) => {
  const listKey = (query) => {
    const q = query || {}
    const name = q.name || ''
    const code = q.code || ''
    const type = q.type || ''
    const level = q.level || ''
    const status = q.status || ''
    const keywords = q.keywords || ''
    const page = q.page || ''
    const pageSize = q.pageSize || ''
    return `spec:list:${encodeURIComponent(`${name}|${code}|${type}|${level}|${status}|${keywords}|${page}|${pageSize}`)}`
  }

  const detailKey = (id) => `spec:detail:${id}`

  const list = async ({ dialect, query, limit, offset }) => {
    const db = dbManager.getDb(dialect)
    let qb = db.selectFrom('specs').selectAll().orderBy('created_at', 'desc')
    let countQb = db.selectFrom('specs')
    if (query?.name) qb = qb.where('name', 'like', `%${query.name}%`)
    if (query?.code) qb = qb.where('code', 'like', `%${query.code}%`)
    if (query?.type) qb = qb.where('type', '=', query.type)
    if (query?.level) qb = qb.where('level', '=', Number(query.level))
    if (query?.status) qb = qb.where('status', '=', Number(query.status))
    if (query?.keywords) qb = qb.where('keywords', 'like', `%${query.keywords}%`)
    if (query?.name) countQb = countQb.where('name', 'like', `%${query.name}%`)
    if (query?.code) countQb = countQb.where('code', 'like', `%${query.code}%`)
    if (query?.type) countQb = countQb.where('type', '=', query.type)
    if (query?.level) countQb = countQb.where('level', '=', Number(query.level))
    if (query?.status) countQb = countQb.where('status', '=', Number(query.status))
    if (query?.keywords) countQb = countQb.where('keywords', 'like', `%${query.keywords}%`)
    if (offset) qb = qb.offset(offset)
    if (limit) qb = qb.limit(limit)
    const items = await qb.execute()
    const totalRow = await countQb.select((eb) => eb.fn.count('id').as('cnt')).executeTakeFirst()
    const total = Number(totalRow?.cnt || 0)
    return { items, total }
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
      uploader_user_id: actorUserId || null,
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

  const latest = async ({ dialect, limit }) => {
    const db = dbManager.getDb(dialect)
    const rows = await db
      .selectFrom('specs')
      .leftJoin('users', 'users.id', 'specs.uploader_user_id')
      .select([
        'specs.id as id',
        'specs.name as name',
        'specs.version as version',
        'specs.created_at as uploadTime',
        'users.username as uploader'
      ])
      .orderBy('specs.created_at', 'desc')
      .limit(limit || 50)
      .execute()
    return { items: rows }
  }

  const remove = async ({ dialect, ids, actorUserId }) => {
    const db = dbManager.getDb(dialect)
    const idList = Array.from(new Set((ids || []).map((x) => String(x)).filter(Boolean)))
    if (!idList.length) return { successIds: [], failed: [] }

    const existingRows = await db.selectFrom('specs').select(['id']).where('id', 'in', idList).execute()
    const existingIds = new Set(existingRows.map((r) => String(r.id)))
    const failed = idList.filter((id) => !existingIds.has(id)).map((id) => ({ id, reason: 'not found' }))
    const successIds = idList.filter((id) => existingIds.has(id))

    await withTransaction(db, { isolationLevel: 'read committed' }, async (trx) => {
      if (successIds.length) {
        await trx.deleteFrom('specs').where('id', 'in', successIds).execute()
      }
      await enqueueOutboxEvent(trx, {
        eventType: 'cache.invalidate',
        aggregateType: 'spec',
        aggregateId: String(actorUserId || ''),
        payload: { keys: [listKey({})] }
      })
    })

    await cache.del([listKey({}), ...successIds.map((id) => detailKey(id))])
    return { successIds, failed }
  }

  return { list, detail, create, update, latest, remove }
}

