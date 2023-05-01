import parse, { HTMLReactParserOptions, domToReact } from 'html-react-parser'
import { Children, FC, HTMLAttributes, useMemo } from 'react'

export type DirectiveType =
  | 'containerDirective'
  | 'leafDirective'
  | 'textDirective'

export type MarkdownCustomComponents = Partial<
  Record<DirectiveType, Record<string, FC<any>>>
>

export interface LinkProps {
  href: string
  children: React.ReactNode
  className?: string
  [others: string]: any
}

export interface Html {
  className?: string
  html: string
  customComponents?: MarkdownCustomComponents
  renderLink?: (props: LinkProps) => JSX.Element
  renderImage?: (props: HTMLAttributes<HTMLImageElement>) => JSX.Element
}

export function isWikiLink(props: { href: string }) {
  return props.href.startsWith('/wiki/')
}

export const Html: FC<Html> = (props) => {
  const html = props.html
  const element = useMemo(() => {
    const options: HTMLReactParserOptions = {
      replace: (domNode) => {
        if (domNode.type !== 'tag') return
        if (!('name' in domNode)) return

        const { attribs, children } = domNode
        if (domNode.name === 'a') return replaceLink()
        if (domNode.name === 'markdown-directive') return replaceDirective()
        if (domNode.name === 'code') return replaceCode()

        function replaceCode() {
          const element = Children.only(domToReact([domNode], {
            ...options,
            replace(node) {
              if (
                node.type === 'tag' &&
                'name' in node &&
                node.name === 'img'
              ) {
                // Don't replace links twice.
                return
              }
              return options.replace?.(node)
            }
          }))
          if (typeof element !== 'object') return
          return props.renderImage?.(element.props) || undefined
        }

        function replaceLink() {
          const href = attribs.href
          if (!href) return
          const link = Children.only(
            domToReact([domNode], {
              ...options,
              replace(node) {
                if (
                  node.type === 'tag' &&
                  'name' in node &&
                  node.name === 'a'
                ) {
                  // Don't replace links twice.
                  return
                }
                return options.replace?.(node)
              },
            }),
          )
          if (typeof link !== 'object') return
          return props.renderLink?.(link.props) || undefined
        }

        function replaceDirective() {
          const type = attribs.type as DirectiveType
          const name = attribs.name
          const definition = props.customComponents?.[type]?.[name]
          if (!definition) return
          const label = attribs.label
          const attributes = attribs.attributes
          const reactChildren = domToReact(children, options)
          return (
            <MarkdownCustomComponent
              Component={definition}
              label={label}
              attributes={attributes}
            >
              {reactChildren}
            </MarkdownCustomComponent>
          )
        }
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
