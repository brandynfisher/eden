import CreationInterface from '@/components/Creation/CreationInterface/CreationInterface'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreation } from '@/hooks/useCreation'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const CreatePageWithPreset = ({
  generator,
  presetId,
}: {
  generator?: string
  presetId: string
}) => {
  const { creation } = useCreation(presetId, {
    revalidateAll: false,
  })

  if (!creation) {
    return <LoadingIndicator />
  }

  return (
    <CreationInterface presetCreation={creation} generatorName={generator} />
  )
}

const CreatePageDefault = () => {
  return <CreationInterface />
}

const CreateCreationsPage = () => {
  const router = useRouter()
  const [usesPreset, setUsesPreset] = useState<boolean>(false)

  useEffect(() => {
    if (!router.query) {
      setUsesPreset(false)
      return
    }

    setUsesPreset(!!router.query.presetId)
  }, [router.query])

  return (
    <>
      {usesPreset ? (
        <CreatePageWithPreset
          generator={
            router.query.generator ? String(router.query.generator) : undefined
          }
          presetId={String(router.query.presetId)}
        />
      ) : (
        <CreatePageDefault />
      )}
    </>
  )
}

export default CreateCreationsPage
