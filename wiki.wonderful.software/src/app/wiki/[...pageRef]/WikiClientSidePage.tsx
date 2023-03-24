'use client'

import { Markdown } from '@contentsgarten/markdown'
import type { GetPageResult } from 'contentsgarten'
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
  })
  const page = freshPageQuery.data ?? stalePage
  const [lastSavedRevision, setLastSavedRevision] = useState('')

  return (
    <div className="p-8">
      <article
        className="prose-lg md:prose-xl max-w-[48rem] mx-auto"
        style={{ opacity: false ? 0.5 : 1 }}
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
        <Markdown text={page.content} />
      </article>
    </div>
  )
}
