import Session from '@/features/sessions/session'
import { requireFeatureFlag } from '@/lib/auth'
import { FeatureFlag } from '@edenlabs/eden-sdk'

export default async function SessionPage() {
  await requireFeatureFlag(FeatureFlag.Preview)

  return <Session />
}
