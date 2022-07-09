import MarkdownIt from 'markdown-it'
import type { FC } from 'react'

export interface Markdown {
  text: string
}

export const Markdown: FC<Markdown> = (props) => {
  const html = MarkdownIt({ html: true }).render(props.text)
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
