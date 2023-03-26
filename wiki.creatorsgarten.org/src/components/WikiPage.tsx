import { Markdown, MarkdownCustomComponents } from '@contentsgarten/markdown'
import type { GetPageResult } from 'contentsgarten'
import { FC, Suspense, lazy, useState } from 'react'
import { TrpcProvider, trpc } from '../utils/trpc'
import { clsx } from 'clsx'

const Editor = lazy(() => import('./Editor'))

export interface WikiPage {
  page: GetPageResult
}

export const WikiPage: FC<WikiPage> = (props) => {
  return (
    <TrpcProvider>
      <WikiPageInner {...props} />
    </TrpcProvider>
  )
}
export const WikiPageInner: FC<WikiPage> = (props) => {
  const stalePage = props.page
  const freshPageQuery = trpc.view.useQuery({
    pageRef: stalePage.pageRef,
    revalidate: true,
  })
  const page = freshPageQuery.data ?? stalePage
  const [lastSavedRevision, setLastSavedRevision] = useState('')
  return (
    <>
      <h1>
        {page.title}
        {!!freshPageQuery.data?.file && (
          <Suspense fallback={<></>}>
            <Editor
              key={lastSavedRevision}
              page={freshPageQuery.data}
              file={freshPageQuery.data.file}
              onSave={setLastSavedRevision}
            />
          </Suspense>
        )}
      </h1>
      <Markdown
        className={clsx(
          'prose-h1:text-4xl prose-h1:mt-12 prose-h1:font-medium',
          freshPageQuery.data && freshPageQuery.isRefetching && 'opacity-50',
        )}
        text={page.content}
        customComponents={customComponents}
      />
    </>
  )
}

const customComponents: MarkdownCustomComponents = {
  leafDirective: {
    RatingTally,
  },
}

interface RatingTally {
  attributes: {
    tally: string
    min: string
    max: string
  }
}
function RatingTally(props: RatingTally) {
  const minKey = Number(props.attributes.min || 1)
  const maxKey = Number(props.attributes.max || 10)
  const bucketCount = maxKey - minKey + 1
  const map: Record<number, number> = {}
  for (const item of (props.attributes.tally || '').split(',')) {
    const [rating, count] = item.split('=')
    map[Number(rating)] = Number(count)
  }
  const max = Math.max(1, ...Object.values(map))
  const sum = Object.entries(map).reduce(
    (acc, [k, v]) => acc + Number(k) * v,
    0,
  )
  const count = Object.values(map).reduce((acc, v) => acc + v, 0)
  return (
    <div className="not-prose">
      <div className="flex items-end">
        {Array.from({ length: bucketCount }).map((_, i) => {
          const k = minKey + i
          const v = map[k] || 0
          const height = Math.round((v / max) * 100)
          return (
            <div key={k} className="flex-1 flex flex-col text-center">
              <div className="text-slate-600">{v}</div>
              <div className="px-[10%]">
                <div className="bg-sky-600" style={{ height }} />
              </div>
              <div className="border-t border-slate-400">{k}</div>
            </div>
          )
        })}
      </div>
      <div className="text-slate-500 text-center">
        {count > 0 ? (
          <>
            (average={Math.round((sum / count) * 10) / 10}, n={count})
          </>
        ) : (
          <>(no ratings)</>
        )}
      </div>
    </div>
  )
}
