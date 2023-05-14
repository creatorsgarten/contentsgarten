'use client'

import type { GetPageResult } from 'contentsgarten'
import { Html } from '@contentsgarten/html'
import { FC, useState } from 'react'
import { TrpcProvider, trpc } from '@/utils/trpc'
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('./Editor'), { ssr: false })

export interface WikiClientSidePage {
  page: GetPageResult
}

export const WikiClientSidePage: FC<WikiClientSidePage> = (props) => {
  return (
    <TrpcProvider>
      <WikiClientSidePageInner {...props} />
    </TrpcProvider>
  )
}

export const WikiClientSidePageInner: FC<WikiClientSidePage> = (props) => {
  const stalePage = props.page
  const freshPageQuery = trpc.view.useQuery({
    pageRef: stalePage.pageRef,
    revalidate: true,
    render: true,
  })
  const page = freshPageQuery.data ?? stalePage
  const [lastSavedRevision, setLastSavedRevision] = useState('')

  if (!page.rendered) {
    throw new Error('Page not rendered')
  }

  return (
    <div className="p-8">
      <article
        className="prose prose-lg md:prose-xl max-w-[48rem] mx-auto"
        style={{
          opacity: freshPageQuery.data && freshPageQuery.isRefetching ? 0.5 : 1,
        }}
      >
        <h1>
          {page.title}
          {!!freshPageQuery.data?.file && (
            <Editor
              key={lastSavedRevision}
              page={freshPageQuery.data}
              file={freshPageQuery.data.file}
              onSave={setLastSavedRevision}
            />
          )}
        </h1>
        <Html html={page.rendered.html} />
      </article>
    </div>
  )
}
