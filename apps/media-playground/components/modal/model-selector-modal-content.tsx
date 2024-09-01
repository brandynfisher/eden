import ToggleButton from '@/components/button/toggle-button'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import { ToggleGroup } from '@/components/ui/toggle-group'
import ModelsFeed from '@/features/feed/models-feed'
import UserModelsFeed from '@/features/feed/user-models-feed'
import { useAuthState } from '@/hooks/use-auth-state'
import { ModelV2 } from '@edenlabs/eden-sdk'
import { Suspense, useState } from 'react'

type Props = {
  onChange: (item: ModelV2) => void
}

const ModelSelectorModalContent = ({ onChange }: Props) => {
  const { user } = useAuthState()
  const [showUserModelsOnly, setShowUserModelsOnly] = useState(true)

  return (
    <div>
      <div className="flex flex-col items-center sm:block">
        <ToggleGroup
          type="single"
          value={showUserModelsOnly ? 'user' : 'public'}
          className="border border-muted rounded-lg p-1 mb-4 flex items-center max-w-fit bg-popover"
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
      </div>

      <Suspense fallback={<MasonrySkeleton />}>
        {showUserModelsOnly ? (
          <UserModelsFeed
            userName={user?._id || ''}
            minCols={2}
            maxCols={5}
            onClick={onChange}
          />
        ) : (
          <ModelsFeed minCols={2} maxCols={5} onClick={onChange} />
        )}
      </Suspense>
    </div>
  )
}

export default ModelSelectorModalContent
