import CreationInterface from '@/components/Creation/CreationInterface/CreationInterface'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreation } from '@/hooks/useCreation'
import { Inter } from 'next/font/google'
import { useRouter } from 'next/router'

const inter = Inter({ subsets: ['latin'] })

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

  const shouldUsePreset = () => {
    if (!router.query) return false
    return !!router.query.presetId
  }

  return (
    <div className={`flex ${inter.className}`}>
      {shouldUsePreset() ? (
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
