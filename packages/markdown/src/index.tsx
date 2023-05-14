import Slugger from 'github-slugger'
import { headingRank } from 'hast-util-heading-rank'
import { toString } from 'hast-util-to-string'
import { micromark } from 'micromark'
import { Handle, directive, directiveHtml } from 'micromark-extension-directive'
import { Directive } from 'micromark-extension-directive/lib/html'
import { gfm, gfmHtml } from 'micromark-extension-gfm'
import * as wikiLink from 'micromark-extension-wiki-link'
import { rehype } from 'rehype'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import { visit } from 'unist-util-visit'

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

export async function renderMarkdown(text: string): Promise<string> {
  const result = await processMarkdown(text)
  return result.html
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

export async function processMarkdown(
  text: string,
): Promise<MarkdownProcessingResult> {
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
        pageResolver: (pageName) => [normalizePageName(pageName)],
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
  const processed = await processor.process(result)

  return {
    html: processed.toString(),
    headings,
    wikiLinks,
  }
}

export function normalizePageName(pageName: string) {
  const slugs = new Slugger()
  const [name, ...hashes] = pageName.split('#')
  const pageRef = name
    .split('/')
    .map((s, i) =>
      s
        .replace(/[\W_](\w)/g, (a, x) => x.toUpperCase())
        .replace(/[\W_]/g, '')
        .replace(/^[a-z]/, (x) => (i === 0 ? x.toUpperCase() : x)),
    )
    .join('/')
  return hashes.length > 0
    ? `${pageRef}#${slugs.slug(hashes.join('#'))}`
    : pageRef
}
