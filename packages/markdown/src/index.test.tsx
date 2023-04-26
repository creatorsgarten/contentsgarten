import { test, expect } from 'vitest'
import { processMarkdown, renderMarkdown } from '.'

test('heading id', () => {
  const md = `# Hello World`
  const html = renderMarkdown(md)
  expect(html).toContain('id="hello-world"')
})

test('heading self link', () => {
  const md = `# Hello World`
  const html = renderMarkdown(md)
  expect(html).toContain('href="#hello-world"')
})

test('wikilink', () => {
  const md = `[[creative coding]]`
  const html = renderMarkdown(md)
  expect(html).toContain('href="/wiki/CreativeCoding"')
})

test('no <html>', () => {
  const md = `# Hello World`
  const html = renderMarkdown(md)
  expect(html).not.toContain('<html>')
})

test('heading extraction', () => {
  const md = `# Hello!\n## MEOW\n### nyan\n\nYay\n===\n\n<h2>hello</h2>`
  const { headings } = processMarkdown(md)
  expect(headings).toEqual([
    { id: 'hello', label: 'Hello!', rank: 1 },
    { id: 'meow', label: 'MEOW', rank: 2 },
    { id: 'nyan', label: 'nyan', rank: 3 },
    { id: 'yay', label: 'Yay', rank: 1 },
    { id: 'hello-1', label: 'hello', rank: 2 },
  ])
})
