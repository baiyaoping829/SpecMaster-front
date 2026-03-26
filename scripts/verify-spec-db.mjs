import Database from 'better-sqlite3'
import { join } from 'node:path'

const base = process.env.BASE_URL || 'http://127.0.0.1:3001'

const readJson = async (res) => {
  const body = await res.json().catch(() => null)
  return body
}

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg)
}

const main = async () => {
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  })
  const loginBody = await readJson(loginRes)
  assert(loginBody?.code === 200, `login failed: ${JSON.stringify(loginBody)}`)
  const token = String(loginBody.data.token)

  const name0 = `DB-VERIFY-${Date.now()}`
  const code0 = `DB-${Date.now()}`

  const createRes = await fetch(`${base}/api/spec/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: name0, code: code0, type: 'GB', level: 1, status: 1 })
  })
  const createBody = await readJson(createRes)
  assert(createBody?.code === 200, `upload failed: ${JSON.stringify(createBody)}`)
  const id = String(createBody.data.id)

  const detail1Res = await fetch(`${base}/api/spec/detail/${encodeURIComponent(id)}`)
  const detail1 = await readJson(detail1Res)
  assert(detail1?.code === 200, `detail after upload failed: ${JSON.stringify(detail1)}`)
  assert(String(detail1.data.name) === name0, 'name mismatch after upload')
  const v0 = Number(detail1.data.version || 0)

  const name1 = `${name0}-EDITED`
  const updateRes = await fetch(`${base}/api/spec/update/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ version: v0, patch: { name: name1 } })
  })
  const updateBody = await readJson(updateRes)
  assert(updateBody?.code === 200, `update failed: ${JSON.stringify(updateBody)}`)

  const detail2Res = await fetch(`${base}/api/spec/detail/${encodeURIComponent(id)}`)
  const detail2 = await readJson(detail2Res)
  assert(detail2?.code === 200, `detail after update failed: ${JSON.stringify(detail2)}`)
  assert(String(detail2.data.name) === name1, 'name mismatch after update')
  const v1 = Number(detail2.data.version || 0)
  assert(v1 === v0 + 1, `version not incremented: ${v0} -> ${v1}`)

  const sqlitePath = join(process.cwd(), 'server', 'dev.sqlite')
  const db1 = new Database(sqlitePath, { readonly: true })
  const rowAfterUpdate = db1.prepare('select id, name, version from specs where id = ?').get(id) || null

  const delRes = await fetch(`${base}/api/specifications`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify([id])
  })
  const delBody = await readJson(delRes)
  assert(delBody?.code === 200, `delete failed: ${JSON.stringify(delBody)}`)
  assert(Array.isArray(delBody.data.successIds) && delBody.data.successIds.includes(id), 'delete did not report success')

  const detail3Res = await fetch(`${base}/api/spec/detail/${encodeURIComponent(id)}`)
  const detail3 = await readJson(detail3Res)
  assert(detail3?.code === 404, `detail after delete expected 404: ${JSON.stringify(detail3)}`)

  const db2 = new Database(sqlitePath, { readonly: true })
  const rowAfterDelete = db2.prepare('select id, name, version from specs where id = ?').get(id) || null

  console.log(
    JSON.stringify(
      {
        ok: true,
        base,
        sqliteFile: sqlitePath,
        upload: { id, name: name0, code: code0 },
        edit: { name: name1, versionBefore: v0, versionAfter: v1, rowAfterUpdate },
        delete: { successIds: delBody.data.successIds, rowAfterDelete }
      },
      null,
      2
    )
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

