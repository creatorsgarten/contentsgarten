import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'
import type { FC } from 'react'

export interface Markdown {
  text: string
}

export const Markdown: FC<Markdown> = (props) => {
  const md = MarkdownIt({ html: true })
  addContainer(md, 'lead', {
    open: '<div class="lead">',
    close: '</div>',
  })
  const html = md.render(props.text)
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function addContainer(md: MarkdownIt, name: string, options: ContainerOptions) {
  md.use(container, name, {
    render(tokens: any[], idx: number) {
      if (tokens[idx].nesting === 1) {
        return options.open
      } else {
        return options.close
      }
    },
  })
}

interface ContainerOptions {
  open: string
  close: string
}
