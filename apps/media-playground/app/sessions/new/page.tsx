import Session from '@/features/sessions/session'
import { requireFeatureFlag } from '@/lib/auth'
import { FeatureFlag } from '@edenlabs/eden-sdk'

export default async function NewSessionPage() {
  await requireFeatureFlag(FeatureFlag.Preview)

  return <Session optimisticSessionId="new" />
}
