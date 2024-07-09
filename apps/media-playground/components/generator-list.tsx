'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useGeneratorsQuery } from '@/hooks/query/use-generator-query'

const GeneratorList = () => {
  const { generators, isLoading, isError } = useGeneratorsQuery()

  return (
    <div className="flex flex-col gap-2">
      <TypographyH4>Generators</TypographyH4>
      {isLoading ? <LoadingIndicator /> : null}
      {isError ? (
        <AlertDestructive>Failed to fetch [generators]</AlertDestructive>
      ) : null}
      <ul>
        {generators?.map(generator => (
          <li key={generator.key}>{generator.key}</li>
        ))}
      </ul>
    </div>
  )
}

export default GeneratorList
