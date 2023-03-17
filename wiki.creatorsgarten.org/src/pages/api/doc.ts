import { generateOpenAPIDocumentFromTRPCRouter } from 'openapi-trpc'
import { ContentsgartenRouter } from 'contentsgarten'
export function get() {
  const doc = generateOpenAPIDocumentFromTRPCRouter(ContentsgartenRouter, {
    pathPrefix: '/api/contentsgarten',
    processOperation(op) {
      op.security = [{ bearerAuth: [] }]
    },
  })
  doc.components ??= {}
  doc.components.securitySchemes ??= {}
  doc.components.securitySchemes.bearerAuth = {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  }
  return new Response(JSON.stringify(doc), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
