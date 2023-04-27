import { selectAll } from 'unist-util-select'

import { getProviderEndpoint } from './getProviderEndpoint'

import type { Plugin } from 'unified'
import type { Root } from 'hast'
import type { MarkdownNode } from './@types/MarkdownNode'
import type { OembedResult } from './@types/OembedResult'

const createIframe = (node: MarkdownNode, url: string) => {
  node.type = 'html'
  node.value = `
    <div class="w-full aspect-video">
      <iframe
        src="${url}"
        class="w-full aspect-video"
        style="border:0"
        loading="lazy"
        allowfullscreen
      ></iframe>
    </div>
  `
}

export const rehypeOembed: Plugin<[], Root> = () => {
  return async markdownAST => {
    // transform
    const nodes = selectAll('[type=inlineCode]', markdownAST) as MarkdownNode[]

    await Promise.all(
      nodes.map(async node => {
        const matcher = node.value.match(/(\w+):\s?(.+)/)
        if (matcher !== null) {
          const provider = matcher[1]
          const targetValue = matcher[2]

          switch (provider) {
            case 'niconico':
              createIframe(
                node,
                `https://embed.nicovideo.jp/watch/${targetValue}`
              )
              break
            case 'youtube':
              createIframe(node, `https://www.youtube.com/embed/${targetValue}`)
              break
            case 'oembed':
              const extractedUrl = node.value.slice('oembed: '.length)

              // get provider endpoint
              const endpoint = getProviderEndpoint(extractedUrl)

              if (endpoint !== undefined) {
                try {
                  // call api
                  const searchParams = new URLSearchParams({
                    format: 'json',
                    url: extractedUrl,
                  }).toString()
                  const oembedResult: OembedResult = await fetch(`${endpoint}?${searchParams}`).then(o => {
                    if (o.ok)
                      return o.json()
                    else
                      throw o
                  })

                  // override node
                  node.type = `html`
                  node.value = `<div class="flex justify-center">${oembedResult.html}</div>`
                } catch (e) {}
              }
              break
          }
        }
      })
    )
  }
}
