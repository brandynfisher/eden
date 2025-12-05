'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const MobileSubscriptionNotice = () => (
  <Alert>
    <AlertTitle>Manage your subscription on the web</AlertTitle>
    <AlertDescription className="space-y-2">
      <p>
        Because you&apos;re in the Eden mobile app&rsquo;s native WebView, we
        can&apos;t process subscription changes here. Please open Eden in your
        browser to upgrade, cancel, or adjust your billing.
      </p>
    </AlertDescription>
  </Alert>
)

export default MobileSubscriptionNotice
