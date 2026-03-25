export type TelemetryEvent =
  | { name: 'spec.view.click' }
  | { name: 'spec.view.success'; newCount: number }
  | { name: 'spec.view.failure'; message: string; stage?: 'initial' | 'retry' }
  | { name: 'spec.view.retry' }
  | { name: 'spec.delete.click'; count: number }
  | { name: 'spec.delete.success'; success: number; failed: number }
  | { name: 'spec.delete.failure'; message: string; stage?: 'initial' | 'retry' }
  | { name: 'spec.delete.retry' }

export const track = (event: TelemetryEvent) => {
  const payload = { ...event, ts: Date.now() }
  ;(globalThis as any).__telemetry = (globalThis as any).__telemetry || []
  ;(globalThis as any).__telemetry.push(payload)
  try {
    console.info('[telemetry]', payload)
  } catch {
  }
}

