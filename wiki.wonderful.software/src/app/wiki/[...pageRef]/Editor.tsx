import { FC, useId, useState } from 'react'
import { Icon } from 'react-iconify-icon-wrapper'
import { trpc } from '@/utils/trpc'
import Modal from '@mui/joy/Modal'
import ModalClose from '@mui/joy/ModalClose'
import Typography from '@mui/joy/Typography'
import Sheet from '@mui/joy/Sheet'
import Textarea from '@mui/joy/Textarea'
import type { GetPageResult } from 'contentsgarten'
import Stack from '@mui/joy/Stack'
import Button from '@mui/joy/Button'
import { useAuth } from '@/utils/useAuth'
import { auth } from '@/utils/auth'

export interface Editor {
  page: GetPageResult
  file: Exclude<GetPageResult['file'], undefined>
  onSave: (newRevision: string) => void
}
export const Editor: FC<Editor> = (props) => {
  const context = trpc.useContext()
  const labelId = useId()
  const descriptionId = useId()
  const [open, setOpen] = useState(false)
  const editPermission = trpc.getEditPermission.useQuery({
    pageRef: props.page.pageRef,
  })
  const editable = !!editPermission.data?.granted
  const saveMutation = trpc.save.useMutation({
    onError: (error) => {
      console.error(error)
      alert('Error saving page: ' + String(error))
    },
    onSuccess: (result) => {
      context.view.invalidate()
      props.onSave(result.revision)
    },
  })
  const [baseFile, setBaseFile] = useState(props.file)
  const [content, setContent] = useState(baseFile.content)
  const save = async () => {
    return saveMutation.mutateAsync({
      oldRevision: baseFile.revision,
      newContent: content,
      pageRef: props.page.pageRef,
    })
  }
  if (baseFile.content !== props.file.content && content === baseFile.content) {
    setBaseFile(props.file)
    setContent(props.file.content)
  }
  const gh = `https://github.com/creatorsgarten/wiki/blob/main/wiki/${props.page.pageRef}.md`
  const editOnGitHubLink = (text: string) => (
    <a href={gh} target="_blank" rel="noreferrer" className="text-sky-600">
      {text}
    </a>
  )
  return (
    <span className="text-xl pl-2">
      <button onClick={() => setOpen(true)} title="Edit this page">
        <Icon icon="mdi:lead-pencil" />
      </button>
      <Modal
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          alignItems: 'center',
        }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: '64rem',
            width: 'calc(100% - 1rem)',
            borderRadius: 'md',
            p: 3,
            boxShadow: 'lg',
            flex: 'none',
            margin: '4rem auto',
          }}
        >
          <ModalClose
            variant="outlined"
            sx={{
              top: 'calc(-1/4 * var(--IconButton-size))',
              right: 'calc(-1/4 * var(--IconButton-size))',
              boxShadow: '0 2px 12px 0 rgba(0 0 0 / 0.2)',
              borderRadius: '50%',
              bgcolor: 'background.body',
            }}
          />
          <Stack spacing={1}>
            <Typography
              component="h2"
              id={labelId}
              level="h4"
              textColor="inherit"
              fontWeight="lg"
            >
              Editing{' '}
              <strong className="font-extrabold">{props.page.pageRef}</strong>
            </Typography>
            <Typography id={descriptionId}>
              {editable && (
                <>
                  The editor is quite janky, so please save your changes
                  regularly! You can also{' '}
                  {editOnGitHubLink('edit this page on GitHub')}.
                </>
              )}
              {!editable && (
                <>
                  <NotEditable /> However, you can{' '}
                  {editOnGitHubLink('propose changes to this page on GitHub')}.
                </>
              )}
            </Typography>
            <Typography>
              <EditorAuthStateIndicator />
            </Typography>
            <Textarea
              placeholder="Type anything…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{ fontFamily: (theme) => theme.fontFamily.code }}
              readOnly={!editable}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                sx={{ gap: 0.5 }}
                disabled={!editable || content === baseFile.content}
                loading={saveMutation.isLoading}
                onClick={save}
              >
                <Icon icon="mdi:check" /> Save
              </Button>
            </Stack>
          </Stack>
        </Sheet>
      </Modal>
    </span>
  )
}

export default Editor

function NotEditable() {
  const authState = useAuth()
  return (
    <>
      You do not have the permission to edit this page via the web editor.{' '}
      {authState.state === 'unauthenticated' && (
        <>Perhaps you are not signed in.</>
      )}
    </>
  )
}

function EditorAuthStateIndicator() {
  const authState = useAuth()
  if (authState.state === 'unauthenticated') {
    return (
      <>
        Please{' '}
        <button className="text-sky-600" onClick={() => auth.signIn()}>
          sign in to GitHub
        </button>{' '}
        to make changes via the web editor.
      </>
    )
  }
  if (authState.state === 'authenticated') {
    return (
      <>
        You are currently signed in as <span>{authState.name}</span>{' '}
        <button className="text-sky-600" onClick={() => auth.signOut()}>
          (sign out)
        </button>
        .
      </>
    )
  }
  return <>Checking authentication state…</>
}
