import CreationInterface from '@/components/Creation/CreationInterface/CreationInterface'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreation } from '@/hooks/useCreation'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const CreatePageWithPreset = ({
  generator,
  presetId,
}: {
  generator?: string
  presetId: string
}) => {
  const { creation } = useCreation(presetId, true)

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

const CreatePage = () => {
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
    <div className={`flex`}>
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
    </div>
  )
}

export default CreatePage
