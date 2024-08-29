import ToggleButton from '@/components/button/toggle-button'
import { ToggleGroup } from '@/components/ui/toggle-group'
import ModelsFeed from '@/features/feed/models-feed'
import UserModelsFeed from '@/features/feed/user-models-feed'
import { useAuthState } from '@/hooks/use-auth-state'
import { ModelV2 } from '@edenlabs/eden-sdk'
import { useState } from 'react'

type Props = {
  currentValue: string
  onChange: (item: ModelV2) => void
}

const ModelPickModalContent = ({ currentValue, onChange }: Props) => {
  const { user } = useAuthState()
  const [showUserModelsOnly, setShowUserModelsOnly] = useState(true)

  return (
    <div>
      <div className="mb-4">
        <div className="bg-muted rounded-lg p-2">
          current value: {JSON.stringify(currentValue)}
        </div>
      </div>
      <ToggleGroup
        type="single"
        value={showUserModelsOnly ? 'user' : 'public'}
        className="border border-muted rounded-lg p-1 mb-4 flex items-center justify-normal max-w-fit bg-popover"
      >
        <ToggleButton
          className="w-32"
          value={'user'}
          label={'My Models'}
          onClick={() => setShowUserModelsOnly(true)}
        />
        <ToggleButton
          className="w-32"
          value={'public'}
          label={'Public Models'}
          onClick={() => setShowUserModelsOnly(false)}
        />
      </ToggleGroup>

      {showUserModelsOnly ? (
        <UserModelsFeed
          userName={user?._id || ''}
          minCols={2}
          maxCols={4}
          onClick={onChange}
        />
      ) : (
        <ModelsFeed minCols={2} maxCols={4} onClick={onChange} />
      )}
    </div>
  )
}

export default ModelPickModalContent
