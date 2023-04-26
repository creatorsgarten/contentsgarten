import parse, { HTMLReactParserOptions, domToReact } from 'html-react-parser'
import { FC, useMemo } from 'react'

export type DirectiveType =
  | 'containerDirective'
  | 'leafDirective'
  | 'textDirective'

export type MarkdownCustomComponents = Partial<
  Record<DirectiveType, Record<string, FC<any>>>
>

export interface Html {
  className?: string
  html: string
  customComponents?: MarkdownCustomComponents
}

export const Html: FC<Html> = (props) => {
  const html = props.html
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
