'use client'

import { useQuery } from '@tanstack/react-query'
import { Generator } from '@edenlabs/eden-sdk'
import TypographyH4 from '@/components/ui/typography/TypographyH4'

const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  return response.json()
}

const fetchGenerators: () => Promise<{ generators: Generator[]}> = async () => {
  return fetcher('/api/generators')
}

const GeneratorList = () => {
  const query = useQuery({ queryKey: ['generators'], queryFn: fetchGenerators })

  return (
    <div>
      <TypographyH4>Generators</TypographyH4>
      <ul>
        {query.data?.generators.map((generator) => (
          <li key={generator._id}>{generator.generatorName}</li>
        ))}
      </ul>
    </div>
  )
}

export default GeneratorList