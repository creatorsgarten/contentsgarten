import { micromark } from 'micromark'
import { gfm, gfmHtml } from 'micromark-extension-gfm'
import { Handle, directive, directiveHtml } from 'micromark-extension-directive'
import { FC, useMemo } from 'react'
import parse, { HTMLReactParserOptions, domToReact } from 'html-react-parser'
import {
  Directive,
  DirectiveType,
} from 'micromark-extension-directive/lib/html'
import * as wikiLink from 'micromark-extension-wiki-link'

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
            .map((s) =>
              s
                .replace(/[\W_](\w)/g, (a, x) => x.toUpperCase())
                .replace(/[\W_]/g, ''),
            )
            .join('/'),
        ],
        hrefTemplate: (pageName) => `/wiki/${pageName}`,
      }),
    ],
  })
  return result
}

export type MarkdownCustomComponents = Partial<
  Record<DirectiveType, Record<string, FC<any>>>
>

export interface Markdown {
  text: string
  className?: string
  markdownRenderer?: MarkdownRenderer
  customComponents?: MarkdownCustomComponents
}

export const Markdown: FC<Markdown> = (props) => {
  const html = useMemo(() => {
    const renderer = props.markdownRenderer || renderMarkdown
    return renderer(props.text)
  }, [props.text, props.markdownRenderer])
  const element = useMemo(() => {
    const options: HTMLReactParserOptions = {
      replace: (domNode) => {
        if (domNode.type !== 'tag') return
        if (!('name' in domNode)) return
        if (domNode.name !== 'markdown-directive') return
        const type = domNode.attribs.type as DirectiveType
        const name = domNode.attribs.name
        const definition = props.customComponents?.[type]?.[name]
        if (!definition) return
        const label = domNode.attribs.label
        const attributes = domNode.attribs.attributes
        const children = domToReact(domNode.children, options)
        return (
          <MarkdownCustomComponent
            Component={definition}
            label={label}
            attributes={attributes}
          >
            {children}
          </MarkdownCustomComponent>
        )
      },
    }
    return parse(html, options)
  }, [html, props.customComponents])
  return <div className={props.className}>{element}</div>
}

interface MarkdownCustomComponent {
  Component: FC<any>
  label?: string
  attributes?: string
  children?: React.ReactNode
}
function MarkdownCustomComponent(props: MarkdownCustomComponent) {
  return (
    <props.Component
      label={props.label}
      attributes={JSON.parse(props.attributes || '{}')}
    >
      {props.children}
    </props.Component>
  )
}
