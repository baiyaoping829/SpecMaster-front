import { withTransaction } from '../db/tx.mjs'
import { enqueueOutboxEvent } from '../outbox.mjs'

const now = () => new Date().toISOString()

export const createFileService = ({ dbManager, cache, minio, config }) => {
  const listKey = (query) => {
    const q = query || {}
    const page = q.page || 1
    const pageSize = q.pageSize || 20
    const name = q.name || ''
    return `file:list:${encodeURIComponent(`${page}|${pageSize}|${name}`)}`
  }

  const detailKey = (id) => `file:detail:${id}`

  const list = async ({ dialect, query }) => {
    const key = listKey(query)
    return cache.getOrSet({
      key,
      ttlSeconds: 30,
      lockTtlMs: 1500,
      loader: async () => {
        const db = dbManager.getDb(dialect)
        const page = Number(query?.page || 1)
        const pageSize = Number(query?.pageSize || 20)
        const offset = (page - 1) * pageSize

        let qb = db
          .selectFrom('file_objects')
          .selectAll()
          .where('deleted_at', 'is', null)
          .orderBy('created_at', 'desc')

        let countQb = db.selectFrom('file_objects').where('deleted_at', 'is', null)

        if (query?.name) {
          qb = qb.where('original_name', 'like', `%${query.name}%`)
          countQb = countQb.where('original_name', 'like', `%${query.name}%`)
        }

        const items = await qb.offset(offset).limit(pageSize).execute()
        const totalRow = await countQb.select((eb) => eb.fn.count('id').as('cnt')).executeTakeFirst()
        const total = Number(totalRow?.cnt || 0)
        return { items, total, page, pageSize }
      }
    })
  }

  const uploadMetadata = async ({ dialect, meta, actorUserId }) => {
    const db = dbManager.getDb(dialect)
    const id = String(Date.now())
    const createdAt = now()
    const row = {
      id,
      sha256: meta.sha256,
      bucket: meta.bucket,
      object_key: meta.objectKey,
      original_name: meta.originalName,
      size_bytes: meta.sizeBytes,
      mime_type: meta.mimeType,
      uploader_user_id: actorUserId,
      visibility: meta.visibility || 'private',
      version: 0,
      created_at: createdAt,
      deleted_at: null
    }

    await withTransaction(db, { dialect, isolationLevel: 'read committed' }, async (trx) => {
      await trx.insertInto('file_objects').values(row).execute()
      await enqueueOutboxEvent(trx, {
        eventType: 'cache.invalidate',
        aggregateType: 'file',
        aggregateId: id,
        payload: { keys: [detailKey(id)] }
      })
    })

    await cache.del([detailKey(id)])
    return row
  }

  return { list, uploadMetadata }
}

