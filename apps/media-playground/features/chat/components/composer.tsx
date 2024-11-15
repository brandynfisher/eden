import MyAttachment from '@/features/chat/components/attachment'
import { Composer } from '@assistant-ui/react'
import { FC } from 'react'

export const MyComposer: FC = () => {
  return (
    <Composer.Root>
      <Composer.Attachments components={{ Attachment: MyAttachment }} />
      <Composer.AddAttachment />
      <Composer.Input autoFocus />
      <Composer.Action />
    </Composer.Root>
  )
}
