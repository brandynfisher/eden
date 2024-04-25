'use client'

import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useGeneratorsQuery } from '@/hooks/useGeneratorQuery'
import LoadingIndicator from '@/components/loading-indicator'
import AlertDestructive from '@/components/alert-destructive'


const GeneratorList = () => {
  const { generators, isLoading, isError } = useGeneratorsQuery()

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (isError) {
    return <AlertDestructive>Failed to fetch [generators]</AlertDestructive>;
  }

  return (
    <div>
      <TypographyH4>Generators</TypographyH4>
      <ul>
        {generators?.map((generator) => (
          <li key={generator._id}>{generator.generatorName}</li>
        ))}
      </ul>
    </div>
  )
}

export default GeneratorList