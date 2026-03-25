import { spawn } from 'node:child_process'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const waitFor = async (url: string, timeoutMs: number) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`timeout waiting for ${url}`)
}

export default async () => {
  const stateDir = join(process.cwd(), '.e2e')
  await mkdir(stateDir, { recursive: true })
  const pidFile = join(stateDir, 'server.pid')

  const env = {
    ...process.env,
    PORT: process.env.PORT || '3001',
    AUTO_MIGRATE: process.env.AUTO_MIGRATE || '1',
    REDIS_ENABLED: process.env.REDIS_ENABLED || '0',
    MINIO_ENABLED: process.env.MINIO_ENABLED || '0'
  }

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  await new Promise<void>((resolve, reject) => {
    const build = spawn(npm, ['run', 'build'], { env, stdio: 'inherit', shell: true })
    build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build failed: ${code}`))))
  })

  const proc = spawn(process.execPath, ['server/index.mjs'], { env, stdio: 'inherit' })
  await writeFile(pidFile, String(proc.pid), 'utf8')
  await waitFor(`http://127.0.0.1:${env.PORT}/api/health`, 15_000)
}

