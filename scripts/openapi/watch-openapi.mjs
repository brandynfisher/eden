import { spawnSync } from 'node:child_process'
import { watch } from 'node:fs'
import { resolve } from 'node:path'
import { openapiJobs, repoRoot } from './config.mjs'

const generatorPath = resolve(
  repoRoot,
  'scripts/openapi/generate-openapi-artifacts.mjs',
)

const watchedSpecs = Array.from(
  new Set(
    openapiJobs.flatMap(job => {
      // If job has watch sources, those files generate the spec - don't watch the spec itself
      if (job.watch && job.watch.length > 0) {
        return job.watch.map(path => resolve(repoRoot, path))
      }
      // Otherwise the spec is manually edited, so watch it
      return [resolve(repoRoot, job.spec)]
    }),
  ),
)

let pending = null
let running = false

const run = () => {
  if (running) {
    pending = true
    return
  }
  running = true
  const result = spawnSync('node', [generatorPath], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  })
  running = false
  if (pending) {
    pending = false
    run()
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log(`[openapi] Watching specs:`)
for (const spec of watchedSpecs) {
  console.log(`- ${spec}`)
}

run()

let debounceTimer = null
for (const spec of watchedSpecs) {
  watch(spec, { persistent: true }, eventType => {
    if (eventType !== 'change') return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(run, 150)
  })
}
