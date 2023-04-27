import { oembedProviders } from './constants/oembedProviders'

export const getProviderEndpoint = (url: string) => {
  let transformedEndpoint = undefined

  for (const provider of oembedProviders || []) {
    for (const endpoint of provider.endpoints || []) {
      for (let schema of endpoint.schemes || []) {
        if (transformedEndpoint === undefined) {
          schema = schema.replace('*', '.*')
          const regExp = new RegExp(schema)
          const isMatchingSchema = regExp.test(url)

          if (isMatchingSchema) {
            transformedEndpoint = endpoint.url
          }
        }
      }
    }
  }

  return transformedEndpoint
}
