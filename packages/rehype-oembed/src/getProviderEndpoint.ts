import { OembedProvider } from "./@types/OembedProvider"

export const getProviderEndpoint = (url: string, providers: OembedProvider[]) => {
  let transformedEndpoint = undefined

  for (const provider of providers || []) {
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
