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

  test('GET /pages/* — missing page', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/pages/RestApiTest/DoesNotExist')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe(404)
  })

  test('GET /pages/* — invalid page ref is rejected', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/pages/not valid')
    expect(res.status).toBe(422)
  })

  test('save then view a page', async () => {
    const app = createApp()
    const pageRef = 'RestApiTest/RoundTrip'

    const saveRes = await req(app, 'PUT', `/pages/${pageRef}`, {
      auth: 'fake:1',
      body: { newContent: '# Hello from the REST API' },
    })
    expect(saveRes.status).toBe(200)
    const saved = await saveRes.json()
    expect(saved.revision).toBeTruthy()

    const viewRes = await req(app, 'GET', `/pages/${pageRef}`)
    expect(viewRes.status).toBe(200)
    const viewed = await viewRes.json()
    expect(viewed.status).toBe(200)
    expect(viewed.file.content).toContain('Hello from the REST API')
  })

  test('PUT /pages/* — unauthenticated is forbidden', async () => {
    const app = createApp()
    const res = await req(app, 'PUT', '/pages/RestApiTest/NoAuth', {
      body: { newContent: 'nope' },
    })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain('Not authenticated')
  })

  test('GET /page-contributors/*', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/page-contributors/RestApiTest/Foo')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.contributors).toEqual([])
  })

  test('GET /page-permission/*', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/page-permission/RestApiTest/Foo', {
      auth: 'fake:1',
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ granted: true })
  })

  test('GET /pages — search', async () => {
    const app = createApp()
    const res = await req(app, 'GET', '/pages')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ count: 0, results: [] })
  })
})
