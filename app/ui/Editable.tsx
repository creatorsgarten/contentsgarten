import { FC, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Icon } from 'react-iconify-icon-wrapper'
import { trpc } from '~/utils/trpc'

export interface Editable {
  children: React.ReactNode
  allowClosing?: boolean
}

export const Editable: FC<Editable> = (props) => {
  const [isEditing, setIsEditing] = useState(false)
  const handleOpenChange = (open: boolean) => {
    if (isEditing && !open && !props.allowClosing) {
      return
    }
    setIsEditing(open)
  }
  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={isEditing}>
      <Dialog.Trigger asChild>
        <button>
          <Icon icon="mdi:lead-pencil" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-300/50" />
        <Dialog.Content className="fixed inset-2 md:inset-3 rounded-lg bg-white overflow-hidden flex flex-col shadow-lg shadow-slate-300 border border-slate-300">
          <div className="flex-none flex items-center bg-gradient-to-b from-white to-slate-300/50 border-b border-slate-300">
            <Dialog.Close asChild>
              <button className="flex self-stretch items-center px-3">
                <Icon icon="mdi:arrow-left" />
              </button>
            </Dialog.Close>
            <Dialog.Title className="flex-1 py-2 px-3 border-x border-slate-300">
              Edit
            </Dialog.Title>
            <button className="flex gap-1 self-stretch items-center px-3">
              Save
              <Icon icon="mdi:check" />
            </button>
          </div>
          {props.children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
