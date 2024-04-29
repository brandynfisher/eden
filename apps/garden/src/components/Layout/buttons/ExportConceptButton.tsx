import { GatedActions, useSubscriptionGate } from '@/hooks/useSubscriptionGate'
import { handleAxiosError } from '@/lib/fetcher'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { WorkspacePremium } from '@mui/icons-material'
import TagFaces from '@mui/icons-material/TagFaces'
import { App, Popover } from 'antd'
import axios from 'axios'
import Link from 'next/link'
import { ReactElement } from 'react'

const ButtonElement = ({
  label,
  handleClick,
  isAllowed,
  children,
}: {
  label: string
  handleClick: () => void
  isAllowed: boolean
  children?: ReactElement
}) => {
  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2 w-full ${
        !isAllowed ? 'text-gray-500' : ''
      }`}
      title={'Publish to HuggingFace'}
    >
      {children ? children : null}
      <div>{label}</div>
      <TagFaces className="text-xl ml-auto" />
    </div>
  )
}

const ExportConcept = ({
  conceptId,
  label,
}: {
  conceptId: string
  label?: string
}) => {
  const { message } = App.useApp()
  const { isAllowed } = useSubscriptionGate(GatedActions.ConceptDownload)
  const { showModal } = useModalContext()

  const publishToHuggingFace = async (conceptId: string) => {
    if (!isAllowed) {
      showModal(MODAL_TYPES.SUBSCRIPTION_GATE_MODAL, {
        usesUrl: false,
        minimumSubscriptionTier: SubscriptionTier.Pro,
        featureName: 'Model Publish',
      })
      return
    }
    const hide = message.loading({
      content: 'Publishing to HuggingFace...',
      key: 'hf',
      duration: 0,
    })
    try {
      const response = await axios.post('/api/concepts/export/hf', {
        conceptId,
      })
      const { url } = response.data
      hide()
      message.success(`Exported to HuggingFace: ${url}`)
    } catch (error) {
      hide()
      handleAxiosError(error, message)
    }
  }

  if (!isAllowed) {
    return (
      <Popover
        arrow={true}
        overlayClassName="popover-subscription-gate"
        content={
          <div className="text-center">
            <div className="mb-1">
              <strong>Concept Publish</strong> is a premium feature
            </div>
            <Link href={'/account'} className="font-bold mb-2">
              Explore plans
            </Link>
          </div>
        }
        trigger={['hover']}
      >
        <div className="w-full">
          <ButtonElement
            label={label || ''}
            handleClick={() => publishToHuggingFace(conceptId)}
            isAllowed={isAllowed}
          >
            <WorkspacePremium fontSize="small" className="text-orange-300" />
          </ButtonElement>
        </div>
      </Popover>
    )
  }

  return (
    <ButtonElement
      label={label || ''}
      handleClick={() => publishToHuggingFace(conceptId)}
      isAllowed={isAllowed}
    />
  )
}

export default ExportConcept
