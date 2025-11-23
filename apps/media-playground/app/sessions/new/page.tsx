import Session from '@/features/sessions/session'

export default async function NewSessionPage() {
  return <Session optimisticSessionId="new" />
}
