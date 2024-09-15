'use client'

import ModelMiniCard from '@/components/card/model-mini-card'
import ModelSelectorModal from '@/components/modal/model-selector-modal'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

type Props = {
  onChange: (newVal: string | undefined) => void
  value: string
}

const ModelSelector = ({ onChange, value }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const queryParams = useSearchParams()

  const handleRemoveModelSelection = () => {
    if (queryParams && queryParams.get('lora')) {
      router.push(pathname, { scroll: false })
    }

    onChange('')
  }

  return (
    <div>
      {value ? (
        <ModelMiniCard modelId={value}>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto mr-2"
            onClick={handleRemoveModelSelection}
          >
            <X size={20} />
          </Button>
        </ModelMiniCard>
      ) : null}

      <ModelSelectorModal
        className="p-4 md:p-8 w-full"
        title="Select model"
        description="Pick a model to use as a lora"
        currentValue={value}
        onChange={onChange}
      />
    </div>
  )
}

export default ModelSelector
