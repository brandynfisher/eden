import CreationMasonry from '@/components/Creation/CreationMasonry'
import { useCreationsSimilar } from '@/hooks/useCreationsSimilar'

const SimilarCreationsMasonry = ({ creationId }: { creationId: string }) => {
  const { creations } = useCreationsSimilar(creationId)

  return <CreationMasonry creations={creations} />
}

export default SimilarCreationsMasonry
