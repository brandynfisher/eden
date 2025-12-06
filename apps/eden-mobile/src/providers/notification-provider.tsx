import { usePushNotifications } from '@/hooks/use-push-notifications'
import { PropsWithChildren, useEffect } from 'react'

export function NotificationProvider({ children }: PropsWithChildren) {
  const { expoPushToken } = usePushNotifications()

  useEffect(() => {
    // Log token for debugging (remove in production)
    if (expoPushToken) {
      console.log('Push token available:', expoPushToken)
    }
  }, [expoPushToken])

  return <>{children}</>
}
