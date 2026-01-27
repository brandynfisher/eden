import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(apiRoot, '../..')

const watcher = spawn(
  'node',
  [resolve(repoRoot, 'scripts/openapi/watch-openapi.mjs')],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  },
)

const devCommand =
  'DOTENV_PATH=.env.eden tsx watch --clear-screen=false --ignore src/plugins/mcpGeneratedTools.ts src .env.eden | pino-pretty --colorize'
const dev = spawn(devCommand, {
  cwd: apiRoot,
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

const shutdown = signal => {
  watcher.kill(signal)
  dev.kill(signal)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

dev.on('exit', code => {
  watcher.kill('SIGINT')
  process.exit(code ?? 0)
})
