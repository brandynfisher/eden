import WorkflowForm from '@/components/form/workflow-form'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { workflows } from '@/features/workflows/dummyConfig'

type Props = {
  params: {
    workflow: string
  }
}

const ImageWorkflowPage = ({ params }: Props) => {
  const { workflow } = params

  const workflowMetaData = workflow
    ? workflows.image.filter(flow => flow._id === workflow)[0]
    : undefined

  if (!workflowMetaData) {
    return {
      notFound: true,
    }
  }

  return (
    <div>
      <TypographyH3>create - image - {workflow}</TypographyH3>
      {/*<pre>*/}
      {/*workflowMetaData:*/}
      {/*{JSON.stringify(workflowMetaData, null, 2)}*/}
      {/*</pre>*/}
      <WorkflowForm />
    </div>
  )
}

export default ImageWorkflowPage
