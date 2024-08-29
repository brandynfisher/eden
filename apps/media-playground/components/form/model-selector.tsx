'use client'

// import { UseFormReturn } from 'react-hook-form'
import ModelPickModal from '@/components/modal/model-pick-modal'

type Props = {
  // form: UseFormReturn
  onChange: (newVal: string | undefined) => void
  value: string
}

const ModelSelector = ({
  // form,
  onChange,
  value,
}: Props) => {
  return (
    <ModelPickModal
      className="p-8 w-full"
      title="Select model"
      description="Pick a model to use as a lora"
      currentValue={value}
      onChange={onChange}
    />
  )
}

export default ModelSelector
