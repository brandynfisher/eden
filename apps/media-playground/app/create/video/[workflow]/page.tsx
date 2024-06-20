import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { workflows } from '@/features/workflows/dummyConfig'

type Props = {
  params: {
    workflow: string
  }
}

const VideoWorkflowPage = ({ params }: Props) => {
  const { workflow } = params

  const workflowMetaData = workflow
    ? workflows.video.filter(flow => flow._id === workflow)[0]
    : undefined

  if (!workflowMetaData) {
    return {
      notFound: true,
    }
  }

  return (
    <div>
      <TypographyH3>create - video - {workflow}</TypographyH3>
      <pre>
        workflowMetaData:
        {JSON.stringify(workflowMetaData, null, 2)}
      </pre>
    </div>
  )
}

export default VideoWorkflowPage
