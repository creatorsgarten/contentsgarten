import { micromark } from 'micromark'
import { gfm, gfmHtml } from 'micromark-extension-gfm'
import { Handle, directive, directiveHtml } from 'micromark-extension-directive'
import { FC, useMemo } from 'react'
import parse from 'html-react-parser'
import { Directive } from 'micromark-extension-directive/lib/html'

export type MarkdownRenderer = (text: string) => string

export const directives: Record<string, Handle> = {
  lead: createBlockHandler({
    open: () => '<div class="lead">',
    close: () => '</div>',
  }),
  details: createBlockHandler({
    open: (d) => {
      const title = d.label || 'Details'
      return `<details><summary>${title}</summary>\n`
    },
    close: () => '</details>',
  }),
  tip: createCustomBlockHandler('tip', 'TIP'),
  info: createCustomBlockHandler('info', 'INFO'),
  warning: createCustomBlockHandler('warning', 'WARNING'),
  danger: createCustomBlockHandler('danger', 'DANGER'),
  '*': function (d) {
    if (d.type === 'textDirective') {
      this.tag('<markdown-text-directive')
      this.tag(` name="${this.encode(d.name)}"`)
      if (d.attributes) {
        this.tag(` attributes="${this.encode(JSON.stringify(d.attributes))}"`)
      }
      this.tag('>')
      if (d.label) this.raw(d.label)
      this.tag('</markdown-text-directive>')
    } else {
      this.tag('<div class="unknown-directive custom-block danger">')
      this.tag(
        `<p class="custom-block-title">Unknown directive: ${this.encode(
          d.name,
        )}</p>`,
      )
      if (d.content) {
        this.raw(d.content)
      }
      this.tag('</div>')
    }
  },
}

function createBlockHandler(options: {
  open: (directive: Directive) => string
  close: () => string
}): Handle {
  return function (d) {
    if (d.type !== 'containerDirective') return false
    this.tag(options.open(d))
    if (d.content) this.raw(d.content)
    this.tag(options.close())
  }
}

function createCustomBlockHandler(name: string, defaultTitle: string) {
  return createBlockHandler({
    open: (d) => {
      const title = d.label || defaultTitle || name
      return `<div class="${name} custom-block"><p class="custom-block-title">${title}</p>\n`
    },
    close: () => `</div>\n`,
  })
}

export function renderMarkdown(text: string): string {
  const result = micromark(text, {
    allowDangerousHtml: true,
    extensions: [gfm({ singleTilde: false }), directive()],
    htmlExtensions: [gfmHtml(), directiveHtml(directives)],
  })
  return result
}

export interface Markdown {
  text: string
  className?: string
  markdownRenderer?: MarkdownRenderer
}

export const Markdown: FC<Markdown> = (props) => {
  const html = useMemo(() => {
    const renderer = props.markdownRenderer || renderMarkdown
    return renderer(props.text)
  }, [props.text, props.markdownRenderer])
  const element = useMemo(() => {
    return parse(html)
  }, [html])
  return <div className={props.className}>{element}</div>
}
