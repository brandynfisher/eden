// import { UseFormReturn } from 'react-hook-form'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import ModelPickModal from '@/components/modal/model-pick-modal'

type Props = {
  // form: UseFormReturn
  // onChange: (newVal: string | undefined) => void
  value: string
}

const ModelSelector = ({
  // form,
  // onChange,
  value,
}: Props) => {
  return (
    <ModelPickModal
      className="p-8"
      title="Select model"
      description="Pick a model to use as a lora"
    >
      <div>
        <div className="mb-4">
          <div className="bg-muted">
            current field value: {JSON.stringify(value)}
          </div>
          {}
        </div>
        <div className="">
          <MasonrySkeleton />
        </div>
      </div>
    </ModelPickModal>
  )
}

export default ModelSelector
