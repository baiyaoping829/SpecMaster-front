import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadJson, saveJson } from '../../server/storage.mjs'

test('loadJson returns fallback when file missing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'specmaster-'))
  try {
    const file = join(dir, 'missing.json')
    const data = await loadJson(file, { ok: true })
    assert.deepEqual(data, { ok: true })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('saveJson then loadJson roundtrip', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'specmaster-'))
  try {
    const file = join(dir, 'data.json')
    const payload = { a: 1, nested: { b: 'x' } }
    await saveJson(file, payload)
    const data = await loadJson(file, null)
    assert.deepEqual(data, payload)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
