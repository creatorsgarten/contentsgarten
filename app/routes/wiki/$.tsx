import type { LoaderArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import {
  ContentsgartenRouter,
  handleContentsgartenRequest,
} from 'src/packlets/contentsgarden'
import { Markdown } from '~/markdown'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { contentsgarten } from '../api/contentsgarten/$action'

export async function loader(args: LoaderArgs) {
  const client = createClient(args.request)
  const slug = args.params['*'] as string
  return json(await client.view.query({ pageRef: slug }))
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const { title } = data
  return {
    title: `${title} | Contentsgarten`,
  }
}

function createClient(_request: Request) {
  return createTRPCProxyClient<typeof ContentsgartenRouter>({
    links: [
      httpBatchLink({
        url: new URL('/api/contentsgarten', 'http://fake').toString(),
        headers: {},
        fetch: (input, init) => {
          if (typeof input === 'string' && input.startsWith('http://fake')) {
            const request = new Request(input, init)
            return handleContentsgartenRequest(
              contentsgarten,
              request,
              '/api/contentsgarten',
            )
          }
          return fetch(input, init)
        },
      }),
    ],
  })
}

export default function WikiPage() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="p-8">
      <article className="prose md:prose-lg max-w-[48rem]">
        <h1>{data.title}</h1>
        <Markdown text={data.content} />
      </article>
    </div>
  )
}

// const WikiPageEditor: FC<{ edit: WikiPageEdit }> = ({ edit }) => {
//   return (
//     <Form method="post" action={edit.formTarget}>
//       <p>
//         <textarea
//           name="content"
//           className="w-full h-[24rem] rounded border border-gray-500 p-2 font-mono text-sm"
//           defaultValue={edit.content}
//         ></textarea>
//       </p>
//       <p>
//         <button className="rounded border-2 border-gray-500 px-3 py-1">
//           Save Changes
//         </button>
//       </p>
//       <input type="hidden" name="sha" value={edit.sha} />
//       <input type="hidden" name="redirect" value="view" />
//     </Form>
//   )
// }
