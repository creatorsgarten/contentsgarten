import { Plugin } from 'unified'
import { ElementContent, Root } from 'hast'
import { createStarryNight, common } from '@wooorm/starry-night'
import { visit } from 'unist-util-visit'
import { toString } from 'hast-util-to-string'

let starryNightPromise: ReturnType<typeof createStarryNight> | undefined

function getStarryNight() {
  if (!starryNightPromise) {
    const promise = createStarryNight(common)
    starryNightPromise = promise
    starryNightPromise.catch((err) => {
      console.error('Failed to load starry-night', err)
      if (starryNightPromise === promise) {
        starryNightPromise = undefined
      }
    })
  }
  return starryNightPromise
}

// https://github.com/wooorm/starry-night#example-integrate-with-unified-remark-and-rehype
export const rehypeStarryNight: Plugin<[], Root> = () => {
  const prefix = 'language-'

  return async function (tree) {
    const starryNight = await getStarryNight()

    visit(tree, 'element', function (node, index, parent) {
      if (!parent || index === null || node.tagName !== 'pre') {
        return
      }

      const head = node.children[0]

      if (
        !head ||
        head.type !== 'element' ||
        head.tagName !== 'code' ||
        !head.properties
      ) {
        return
      }

      const classes = head.properties.className

      if (!Array.isArray(classes)) return

      const language = classes.find(
        (d) => typeof d === 'string' && d.startsWith(prefix),
      )

      if (typeof language !== 'string') return

      const scope = starryNight.flagToScope(language.slice(prefix.length))

      // Maybe warn?
      if (!scope) return

      const fragment = starryNight.highlight(toString(head), scope)
      const children = fragment.children as ElementContent[]

      parent.children.splice(index, 1, {
        type: 'element',
        tagName: 'div',
        properties: {
          className: [
            'highlight',
            'highlight-' + scope.replace(/^source\./, '').replace(/\./g, '-'),
          ],
        },
        children: [
          { type: 'element', tagName: 'pre', properties: {}, children },
        ],
      })
    })
  }
}
