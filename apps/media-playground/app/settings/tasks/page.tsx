'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TasksView } from '@/features/tasks/components/tasks-view'
import { useMe } from '@/hooks/use-me'
import { useAuth } from '@clerk/nextjs'
import { FeatureFlag } from '@edenlabs/eden-sdk'
import { AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const TasksPage = () => {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { user } = useMe({
    isAuthenticated: !!isSignedIn,
  })

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  // If user doesn't have preview flag, show access denied
  if (!isPreviewUser) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Deployments</h2>
          <p className="text-muted-foreground">
            Manage all your agent deployments across platforms
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p>This feature is not available for your account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-[100vw] px-2">
      <TasksView
        mode="global"
        showHeader={true}
        headerTitle="Tasks"
        headerDescription="Manage all your scheduled tasks across agents"
        onNavigateToMessage={(_messageId, sessionId) => {
          if (sessionId) {
            router.push(`/sessions/${sessionId}`)
          }
        }}
      />
    </div>
  )
}

export default TasksPage
