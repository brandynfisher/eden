import { SharedSession } from '@/features/sessions/shared-session'

export default async function SharedSessionPage({
  params,
}: {
  params: { id: string }
}) {
  return <SharedSession shareId={params.id} />
}
