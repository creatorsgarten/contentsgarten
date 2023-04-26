import { micromark } from 'micromark'
import { gfm, gfmHtml } from 'micromark-extension-gfm'
import { Handle, directive, directiveHtml } from 'micromark-extension-directive'
import { FC, useMemo } from 'react'
import { Html } from '@contentsgarten/html'
import type { MarkdownCustomComponents } from '@contentsgarten/html'
import { Directive } from 'micromark-extension-directive/lib/html'
import * as wikiLink from 'micromark-extension-wiki-link'
import { rehype } from 'rehype'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { visit } from 'unist-util-visit'
import { headingRank } from 'hast-util-heading-rank'
import { toString } from 'hast-util-to-string'

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
    this.tag('<markdown-directive')
    this.tag(` type="${this.encode(d.type)}"`)
    this.tag(` name="${this.encode(d.name)}"`)
    if (d.label && d.type !== 'textDirective') {
      this.tag(` label="${this.encode(d.label)}"`)
    }
    if (d.attributes) {
      this.tag(` attributes="${this.encode(JSON.stringify(d.attributes))}"`)
    }
    this.tag('>')
    if (d.label && d.type === 'textDirective') {
      this.raw(d.label)
    }
    if (d.content) {
      this.raw(d.content)
    }
    this.tag('</markdown-directive>')
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
  return processMarkdown(text).html
}

export interface MarkdownProcessingResult {
  html: string
  headings: Heading[]
  wikiLinks: WikiLink[]
}
export interface Heading {
  id: string
  label: string
  rank: number
}
export interface WikiLink {
  pageRef: string
  label: string
}

export function processMarkdown(text: string): MarkdownProcessingResult {
  const result = micromark(text, {
    allowDangerousHtml: true,
    extensions: [
      gfm({ singleTilde: false }),
      directive(),
      wikiLink.syntax({ aliasDivider: '|' }),
    ],
    htmlExtensions: [
      gfmHtml(),
      directiveHtml(directives),
      wikiLink.html({
        pageResolver: (pageName) => [
          pageName
            .split('/')
            .map((s, i) =>
              s
                .replace(/[\W_](\w)/g, (a, x) => x.toUpperCase())
                .replace(/[\W_]/g, '')
                .replace(/^[a-z]/, (x) => (i === 0 ? x.toUpperCase() : x)),
            )
            .join('/'),
        ],
        hrefTemplate: (pageName) => `/wiki/${pageName}`,
      }),
    ],
  })

  const headings: Heading[] = []
  const wikiLinks: WikiLink[] = []
  const processor = rehype()
    .data('settings', { fragment: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(() => (tree) => {
      visit(tree, 'element', (node) => {
        const rank = headingRank(node)
        if (rank) {
          const id = node.properties?.id
          if (id && typeof id === 'string') {
            headings.push({ id, label: toString(node), rank })
          }
        }

        if (node.tagName === 'a' && node.properties?.href) {
          const href = node.properties.href
          if (typeof href === 'string') {
            const match = href.match(/^\/wiki\/([^?#]+)(?:[?#].*)?$/)
            if (match) {
              const pageRef = match[1]
              const label = toString(node)
              wikiLinks.push({ pageRef, label })
            }
          }
        }
      })
    })
  const processed = processor.processSync(result)

  return {
    html: processed.toString(),
    headings,
    wikiLinks,
  }
}

export { MarkdownCustomComponents }

/**
 * @deprecated Use `@contentsgarten/html` with HTML input directly instead
 */
export interface Markdown {
  text: string
  className?: string
  markdownRenderer?: MarkdownRenderer
  customComponents?: MarkdownCustomComponents
}

/**
 * @deprecated Use `@contentsgarten/html` with HTML input directly instead
 */
export const Markdown: FC<Markdown> = (props) => {
  const html = useMemo(() => {
    const renderer = props.markdownRenderer || renderMarkdown
    return renderer(props.text)
  }, [props.text, props.markdownRenderer])
  return (
    <Html
      className={props.className}
      html={html}
      customComponents={props.customComponents}
    />
  )
}
