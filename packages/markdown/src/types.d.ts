declare module 'micromark-extension-wiki-link' {
  export const syntax: (options: { aliasDivider?: string }) => any
  export const html: (options: {
    permalinks?: string[]
    pageResolver?: (pageName: string) => string[]
    hrefTemplate?: (permalink: string) => string
    wikiLinkClassName?: string
    newClassName?: string
  }) => any
}
