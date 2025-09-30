import EditConceptView from '@/features/concepts/edit-concept-view'

export default function EditConceptPage({
  params,
}: {
  params: { id: string }
}) {
  return <EditConceptView conceptId={params.id} />
}
