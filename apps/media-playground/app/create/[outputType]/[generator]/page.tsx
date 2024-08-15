import LoadingIndicator from '@/components/loading-indicator'
import Workspace from '@/features/generators/workspace'
// import { auth } from '@clerk/nextjs/server'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { Suspense } from 'react'

type Props = {
  params: {
    generator: GeneratorV2['key']
    outputType: GeneratorV2['outputType']
  }
}

const GeneratorPage = ({ params }: Props) => {
  // const { userId } = auth()
  // console.log('auth', { userId })

  const { generator } = params

  return (
    <div>
      <Suspense fallback={<LoadingIndicator />}>
        <Workspace generatorKey={generator} />
      </Suspense>
    </div>
  )
}

export default GeneratorPage
