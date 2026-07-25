import { describe, expect, test } from 'vitest'
import { createContentsgartenRestApp } from './ContentsgartenRestApi'
import { testing } from './testing'

function createApp() {
  return createContentsgartenRestApp(testing.createFakeInstance())
}

function req(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  options: { auth?: string; body?: unknown } = {},
) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(options.auth ? { authorization: `Bearer ${options.auth}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    }),
  )
}

describe('ContentsgartenRestApi', () => {
  test('GET /about', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/about')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ name: 'Contentsgarten' })
  })

  test('GET /user — unauthenticated', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/user')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ authenticated: false })
  })

  test('GET /user — authenticated', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/user', { auth: 'fake:1' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      authenticated: true,
      user: { id: 1 },
    })
  })

  test('GET /page — missing page', async () => {
    const app = createApp()
    const res = await req(
      app,
      'GET',
      '/page?pageRef=RestApiTest%2FDoesNotExist',
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe(404)
  })

  test('GET /page — invalid page ref is rejected', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/page?pageRef=not%20valid')
    expect(res.status).toBe(422)
  })

  test('save then view a page', async () => {
    const app = createApp()
    const pageRef = 'RestApiTest/RoundTrip'
    const q = `pageRef=${encodeURIComponent(pageRef)}`

    const saveRes = await req(app, 'PUT', `/page?${q}`, {
      auth: 'fake:1',
      body: { newContent: '# Hello from the REST API' },
    })
    expect(saveRes.status).toBe(200)
    const saved = await saveRes.json()
    expect(saved.revision).toBeTruthy()

    const viewRes = await req(app, 'GET', `/page?${q}`)
    expect(viewRes.status).toBe(200)
    const viewed = await viewRes.json()
    expect(viewed.status).toBe(200)
    expect(viewed.file.content).toContain('Hello from the REST API')
  })

  test('PUT /page — unauthenticated is forbidden', async () => {
    const app = createApp()
    const res = await req(app, 'PUT', '/page?pageRef=RestApiTest%2FNoAuth', {
      body: { newContent: 'nope' },
    })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain('Not authenticated')
  })

  test('GET /page-contributors', async () => {
    const app = createApp()
    const res = await req(
      app,
      'GET',
      '/page-contributors?pageRef=RestApiTest%2FFoo',
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.contributors).toEqual([])
  })

  test('GET /page-permission', async () => {
    const app = createApp()
    const res = await req(
      app,
      'GET',
      '/page-permission?pageRef=RestApiTest%2FFoo',
      { auth: 'fake:1' },
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ granted: true })
  })

  test('GET /pages — search, no query', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/pages')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ count: 0, results: [] })
  })

  test('GET /pages — search with a non-empty q param', async () => {
    // Regression test: Elysia auto-parses query values that look like JSON
    // into objects *before* schema validation runs, regardless of the
    // declared query schema. `q`'s schema must accept the parsed object
    // (PageDatabaseSearch), not a raw string — otherwise this 422s.
    const app = createApp()
    const q = JSON.stringify({ prefix: 'Events/', match: { event: true } })
    const res = await req(app, 'GET', `/pages?q=${encodeURIComponent(q)}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ count: 0, results: [] })
  })

  test('mounted with a prefix', async () => {
    const app = createContentsgartenRestApp(
      testing.createFakeInstance(),
      '/api/rest',
    )
    const prefixed = await req(app, 'GET', '/api/rest/about')
    expect(prefixed.status).toBe(200)
    const unprefixed = await req(app, 'GET', '/about')
    expect(unprefixed.status).toBe(404)
  })
})
