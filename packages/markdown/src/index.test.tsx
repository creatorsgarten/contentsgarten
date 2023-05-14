import { test, expect, suite } from 'vitest'
import { processMarkdown, renderMarkdown } from '.'

test('heading id', async () => {
  const md = `# Hello World`
  const html = await renderMarkdown(md)
  expect(html).toContain('id="hello-world"')
})

test('heading self link', async () => {
  const md = `# Hello World`
  const html = await renderMarkdown(md)
  expect(html).toContain('href="#hello-world"')
})

test('wikilink', async () => {
  const md = `[[creative coding]]`
  const html = await renderMarkdown(md)
  expect(html).toContain('href="/wiki/CreativeCoding"')
})

test('wikilink with hash', async () => {
  const md = `[[Guilds#Working Group]]`
  const html = await renderMarkdown(md)
  expect(html).toContain('href="/wiki/Guilds#working-group"')
})

test('no <html>', async () => {
  const md = `# Hello World`
  const html = await renderMarkdown(md)
  expect(html).not.toContain('<html>')
})

test('syntax highlighting', async () => {
  const md = '```js\nconsole.log("hello")\n```'
  const html = await renderMarkdown(md)
  expect(html).toContain('highlight-js')
  expect(html).toContain('pl-en')
})

suite('directives', () => {
  test('container', async () => {
    const md = [':::Component', 'children', ':::'].join('\n')
    const html = await renderMarkdown(md)
    expect(html).toContain(
      '<markdown-directive type="containerDirective" name="Component">',
    )
    expect(html).toContain('children')
  })
})

test('heading extraction', async () => {
  const md = `# Hello!\n## MEOW\n### nyan\n\nYay\n===\n\n<h2>hello</h2>`
  const { headings } = await processMarkdown(md)
  expect(headings).toEqual([
    { id: 'hello', label: 'Hello!', rank: 1 },
    { id: 'meow', label: 'MEOW', rank: 2 },
    { id: 'nyan', label: 'nyan', rank: 3 },
    { id: 'yay', label: 'Yay', rank: 1 },
    { id: 'hello-1', label: 'hello', rank: 2 },
  ])
})

test('wikilink extraction', async () => {
  const md = '[[foo]] [bar](/wiki/Baz#wtf) [[Special/AllPages]]'
  const { wikiLinks } = await processMarkdown(md)
  expect(wikiLinks.map((link) => link.pageRef)).toEqual([
    'Foo',
    'Baz',
    'Special/AllPages',
  ])
})
