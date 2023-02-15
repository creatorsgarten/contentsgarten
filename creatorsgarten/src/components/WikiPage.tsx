import { Markdown } from '@contentsgarten/markdown'
import type { GetPageResult } from 'contentsgarten'
import type { FC } from 'react'
import { TrpcProvider, trpc } from 'src/utils/trpc'
import { clsx } from 'clsx'
import { Icon } from 'react-iconify-icon-wrapper'

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
  return (
    <>
      <h1>
        {page.title}
        {!!page.file && (
          <span
            className="text-xl pl-2"
            onClick={() => alert('under construction!')}
          >
            <Icon icon="mdi:lead-pencil" />
          </span>
        )}
      </h1>
      <Markdown
        className={clsx(
          'prose-h1:text-4xl prose-h1:mt-12 prose-h1:font-medium',
          freshPageQuery.data && freshPageQuery.isRefetching && 'opacity-50',
        )}
        text={page.content}
      />
    </>
  )
}
