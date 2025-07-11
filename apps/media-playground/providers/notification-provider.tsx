'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import {
  UseNotificationsReturn,
  useNotifications,
} from '@/hooks/use-notifications'
import React, { createContext, useContext } from 'react'

type NotificationContextType = UseNotificationsReturn

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isError: false,
  markAsRead: async () => {},
  archiveNotifications: async () => {},
  refreshNotifications: async () => {},
})

export const useNotificationContext = () => useContext(NotificationContext)

type Props = {
  children: React.ReactNode
}

export const NotificationProvider = ({ children }: Props) => {
  const { isSignedIn } = useAuthState()

  const notificationState = useNotifications(isSignedIn)

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  )
}
