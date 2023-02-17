import MarkdownIt from 'markdown-it/dist/markdown-it.js'
import container from 'markdown-it-container'
import { FC, useMemo } from 'react'

export interface Markdown {
  text: string
  className?: string
}

export const Markdown: FC<Markdown> = (props) => {
  const html = useMemo(() => {
    const md = MarkdownIt({ html: true })
    addContainer(md, 'lead', {
      open: () => '<div class="lead">',
      close: () => '</div>',
    })
    addContainer(md, 'details', {
      open: (info) => {
        const title = md.renderInline(info || 'Details')
        return `<details><summary>${title}</summary>\n`
      },
      close: () => '</details>',
    })
    addCustomBlock(md, 'tip', 'TIP')
    addCustomBlock(md, 'info', 'INFO')
    addCustomBlock(md, 'warning', 'WARNING')
    addCustomBlock(md, 'danger', 'DANGER')
    return md.render(props.text)
  }, [props.text])
  return (
    <div
      className={props.className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function addContainer(md: MarkdownIt, name: string, options: ContainerOptions) {
  md.use(container, name, {
    render(tokens: any[], idx: number) {
      if (tokens[idx].nesting === 1) {
        const info = tokens[idx].info.trim().slice(name.length).trim()
        return options.open(info)
      } else {
        return options.close()
      }
    },
  })
}

interface ContainerOptions {
  open: (info: string) => string
  close: () => string
}

function addCustomBlock(md: MarkdownIt, name: string, defaultTitle: string) {
  addContainer(md, name, {
    open: (info: string) => {
      const title = md.renderInline(info || defaultTitle)
      return `<div class="${name} custom-block"><p class="custom-block-title">${title}</p>\n`
    },
    close: () => `</div>\n`,
  })
}
