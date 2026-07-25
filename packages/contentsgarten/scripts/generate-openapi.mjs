import { writeFile } from 'node:fs/promises'
import { createContentsgartenRestApp, testing } from '../dist/index.js'

const app = createContentsgartenRestApp(testing.createFakeInstance())
const response = await app.handle(new Request('http://localhost/openapi/json'))
if (!response.ok) {
  throw new Error(`Failed to generate OpenAPI spec: ${response.status}`)
}
const spec = await response.text()
await writeFile(new URL('../dist/openapi.json', import.meta.url), spec)
console.log('Wrote dist/openapi.json')
