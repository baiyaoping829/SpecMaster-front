import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default async () => {
  if (process.env.E2E_NO_TEARDOWN === '1') return
  const pidFile = join(process.cwd(), '.e2e', 'server.pid')
  const pidRaw = await readFile(pidFile, 'utf8').catch(() => '')
  const pid = Number(pidRaw.trim())
  if (!Number.isFinite(pid) || pid <= 0) return
  try {
    process.kill(pid)
  } catch {
  }
}

