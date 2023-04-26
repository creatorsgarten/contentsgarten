import { test, expect, suite } from 'vitest'
import { Html, MarkdownCustomComponents } from '.'
import { renderToStaticMarkup } from 'react-dom/server'

test('render HTML', () => {
  const src = `<h1>Hello World</h1>`
  const html = renderToStaticMarkup(<Html html={src} />)
  expect(html).toContain('<h1>Hello World</h1>')
})

test('render directive as custom component', () => {
  const src =
    '<markdown-directive type="containerDirective" name="Greeting">World</markdown-directive>'
  const customComponents: MarkdownCustomComponents = {
    containerDirective: {
      Greeting: ({ children }) => <span>Ahoy {children}</span>,
    },
  }
  const html = renderToStaticMarkup(
    <Html html={src} customComponents={customComponents} />,
  )
  expect(html).toContain('<span>Ahoy World</span>')
})
