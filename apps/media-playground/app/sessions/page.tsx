import SessionsList from '@/components/session/sessions-list'
import { requireFeatureFlag } from '@/lib/auth'
import { FeatureFlag } from '@edenlabs/eden-sdk'

export default async function SessionsPage() {
  await requireFeatureFlag(FeatureFlag.Preview)

  return <SessionsList />
}
