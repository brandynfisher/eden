import CreationInterface from '@/components/Creation/CreationInterface/CreationInterface'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useConcept } from '@/hooks/useConcept'
import { useCreationImmutable } from '@/hooks/useCreationImmutable'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const CreatePageWithPreset = ({
  generator,
  presetId,
}: {
  generator?: string
  presetId: string
  conceptId?: string
}) => {
  const { creation } = useCreationImmutable(presetId)

  if (!creation) {
    return <LoadingIndicator />
  }

  return (
    <CreationInterface presetCreation={creation} generatorName={generator} />
  )
}

const CreateUsingConcept = ({ conceptId }: { conceptId: string }) => {
  const { concept } = useConcept(conceptId)

  if (!concept) {
    return <LoadingIndicator />
  }

  return <CreationInterface config={{ concept }} />
}

const CreateCreationsPage = () => {
  const router = useRouter()
  const [usesPreset, setUsesPreset] = useState<boolean>(false)

  useEffect(() => {
    if (!router.query) return

    if (router.query.presetId) {
      setUsesPreset(true)
      return
    }
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
        <>
          {router.query.concept ? (
            <CreateUsingConcept conceptId={String(router.query.concept)} />
          ) : (
            <CreationInterface />
          )}
        </>
      )}
    </>
  )
}

export default CreateCreationsPage
