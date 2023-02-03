import type { LoaderArgs, MetaFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import {
  ContentsgartenRouter,
  GetPageResult,
  handleContentsgartenRequest,
} from 'src/packlets/contentsgarden'
import { Markdown } from '~/markdown'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { contentsgarten } from '../api/contentsgarten/$action'
import { Editable } from '~/ui/Editable'
import { FC, useState } from 'react'
import { trpc } from '~/utils/trpc'

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
        <h1>
          {data.title}
          {data.file ? (
            <span className="text-xl pl-2">
              <FileEditor file={data.file} pageRef={data.pageRef} />
            </span>
          ) : null}
        </h1>
        <Markdown text={data.content} />
      </article>
    </div>
  )
}

interface FileEditor {
  file: Exclude<GetPageResult['file'], undefined>
  pageRef: string
}

const FileEditor: FC<FileEditor> = (props) => {
  const { file } = props
  const [content, setContent] = useState(file.content)
  const save = trpc.save.useMutation()
  return (
    <Editable
      saving={save.isLoading}
      onSave={async () => {
        await save.mutateAsync({
          pageRef: props.pageRef,
          newContent: content,
          oldRevision: file.revision,
        })
        setTimeout(() => {
          location.reload()
        })
        return true
      }}
    >
      <textarea
        className="font-mono p-2 flex-1"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </Editable>
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
