import { FC, useId, useState } from 'react'
import { Icon } from 'react-iconify-icon-wrapper'
import { JoyUiProvider } from 'src/utils/joy'

import Modal from '@mui/joy/Modal'
import ModalClose from '@mui/joy/ModalClose'
import Typography from '@mui/joy/Typography'
import Sheet from '@mui/joy/Sheet'
import Textarea from '@mui/joy/Textarea'
import type { GetPageResult } from 'contentsgarten'
import Stack from '@mui/joy/Stack'
import Button from '@mui/joy/Button'
import { useAuth } from 'src/utils/useAuth'
import { auth } from 'src/utils/auth'
import { trpc } from 'src/utils/trpc'

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
  const [baseFile] = useState(props.file)
  const [content, setContent] = useState(baseFile.content)
  const save = async () => {
    return saveMutation.mutateAsync({
      oldRevision: baseFile.revision,
      newContent: content,
      pageRef: props.page.pageRef,
    })
  }
  return (
    <span className="text-xl pl-2">
      <JoyUiProvider>
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
              maxWidth: '52rem',
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
                Editing page
              </Typography>
              <Typography id={descriptionId}>
                {editable && <>Please save your changes regularly.</>}
                {!editable && <NotEditable />}
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
      </JoyUiProvider>
    </span>
  )
}

export default Editor

function NotEditable() {
  const authState = useAuth()
  return (
    <>
      You do not have the permission to edit this page.{' '}
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
