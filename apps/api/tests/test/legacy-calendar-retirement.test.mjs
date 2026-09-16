// Execute actual TypeScript modules with external I/O imports replaced by traps.
// No app bootstrap, environment loader, Mongo, Google or compute service is used.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const root = new URL('../../../../', import.meta.url)
const require = createRequire(import.meta.url)
function load(relative) {
  const calls = []
  const trap = new Proxy(function () {}, {
    get: (_, key) => (key === '__esModule' ? true : trap),
    apply: () => {
      calls.push('external')
      throw Error('external I/O refused')
    },
    construct: () => {
      calls.push('external')
      throw Error('external I/O refused')
    },
  })
  const exports = {}
  const source = readFileSync(new URL(relative, root), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      esModuleInterop: false,
    },
  }).outputText
  vm.runInNewContext(
    compiled,
    {
      exports,
      URL,
      Response,
      console: { error() {} },
      React: {
        createElement: (type, props, ...children) => ({
          type,
          props,
          children,
        }),
      },
      require: name =>
        name === '@sinclair/typebox'
          ? require(name)
          : name.endsWith('/authControllerV2')
          ? load('apps/api/src/controllers/auth/v2/authControllerV2.ts').exports
          : name === 'next/server'
          ? {
              NextResponse: {
                json: (body, options) => Response.json(body, options),
              },
            }
          : trap,
      process: { env: {} },
    },
    { filename: relative },
  )
  return { exports, calls }
}
const message =
  'Google Calendar is retired in old Eden. Use new Eden at https://dev.eden.art.'
test('actual Fastify Calendar routes return410 even for old or missing OAuth queries', async () => {
  const server = require('fastify')()
  try {
    await server.register(
      load('apps/api/src/routes/v2/authRoutesV2.ts').exports.default,
    )
    for (const [method, url] of [
      ['GET', '/v2/auth/google-calendar/init'],
      ['GET', '/v2/auth/google-calendar/callback'],
      [
        'GET',
        '/v2/auth/google-calendar/callback?code=synthetic-code&state=synthetic',
      ],
      ['DELETE', '/v2/auth/google-calendar/disconnect'],
    ]) {
      const response = await server.inject({ method, url })
      assert.equal(response.statusCode, 410)
      assert.equal(response.json().message, message)
    }
  } finally {
    await server.close()
  }
})
function reply() {
  return {
    code: 0,
    body: null,
    status(code) {
      this.code = code
      return this
    },
    send(body) {
      this.body = body
      return this
    },
  }
}
for (const name of [
  'googleCalendarOAuthInit',
  'googleCalendarOAuthCallback',
  'disconnectGoogleCalendar',
]) {
  test(`${name} refuses410 without exchanging, exposing or revoking credentials`, async () => {
    const module = load('apps/api/src/controllers/auth/v2/authControllerV2.ts')
    const response = reply()
    const request = {
      query: {
        agentId: 'synthetic',
        code: 'synthetic-code',
        state: 'synthetic',
      },
      user: { userId: 'synthetic' },
    }
    const server = { config: {} }
    if (name === 'disconnectGoogleCalendar')
      await module.exports[name](request, response)
    else await module.exports[name](server, request, response)
    assert.equal(response.code, 410)
    assert.equal(response.body.message, message)
    assert.deepEqual(module.calls, [])
    assert.ok(!JSON.stringify(response.body).includes('synthetic'))
  })
}
for (const name of [
  'deployAgent',
  'updateAgentDeployment',
  'deleteAgentDeployment',
]) {
  test(`${name} cannot restore Calendar through generic deployment routes`, async () => {
    const module = load('apps/api/src/controllers/agentServicesController.ts')
    const response = reply()
    await module.exports[name](
      {},
      {
        user: { userId: 'synthetic' },
        params: { agentId: 'synthetic', platform: 'google_calendar' },
        body: { platform: 'google_calendar' },
      },
      response,
    )
    assert.equal(response.code, 410)
    assert.equal(response.body.message, message)
    assert.deepEqual(module.calls, [])
  })
}
for (const [file, method] of [
  ['init/route.ts', 'GET'],
  ['route.ts', 'DELETE'],
]) {
  test(`Next ${method} Calendar entrypoint returns410 without proxying`, async () => {
    const module = load(
      'apps/media-playground/app/api/integrations/google-calendar/' + file,
    )
    const response = await module.exports[method]({})
    assert.equal(response.status, 410)
    assert.equal((await response.json()).message, message)
    assert.deepEqual(module.calls, [])
  })
}
test('Calendar form displays retirement and new Eden link with no active controls or hooks', () => {
  const module = load(
    'apps/media-playground/features/agent/deployment-sheet/google-calendar-deployment-form.tsx',
  )
  const rendered = module.exports.GoogleCalendarDeploymentForm({
    agentId: 'synthetic',
    variant: 'inline',
  })
  const text = JSON.stringify(rendered)
  assert.match(text, /Google Calendar is retired in old Eden/)
  assert.match(text, /https:\/\/dev\.eden\.art/)
  assert.ok(!text.includes('button'))
  assert.deepEqual(module.calls, [])
})
