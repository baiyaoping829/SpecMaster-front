import { loadConfig } from '../config.mjs'
import { DataSourceManager } from '../db/manager.mjs'
import { createRedisClients } from '../cache/redis.mjs'

const main = async () => {
  const config = await loadConfig()
  const dbManager = new DataSourceManager(config)
  const db = dbManager.getDb(config.db.defaultDialect)

  const { redis } = createRedisClients(config)
  if (!redis) {
    process.stdout.write('redis disabled\n')
    await dbManager.destroy()
    return
  }
  await redis.connect()

  const specs = await db.selectFrom('specs').selectAll().limit(50).execute()
  let mismatched = 0

  for (const spec of specs) {
    const key = `spec:detail:${spec.id}`
    const raw = await redis.get(key)
    if (!raw) continue
    try {
      const cached = JSON.parse(raw)
      if (String(cached.id) !== String(spec.id) || String(cached.updated_at) !== String(spec.updated_at)) {
        mismatched += 1
      }
    } catch {
      mismatched += 1
    }
  }

  process.stdout.write(`checked=${specs.length} mismatched=${mismatched}\n`)
  await redis.quit()
  await dbManager.destroy()
}

await main()
