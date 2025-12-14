'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { useAppShell } from '@/components/layout/app-shell'
import { TasksView } from '@/features/tasks/components/tasks-view'
import { useAuthState } from '@/hooks/use-auth-state'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { Loader2, MenuIcon } from 'lucide-react'
import { useEffect } from 'react'

const TasksPage = () => {
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const { isLoading: isAuthLoading } = useAuthState()

  const tasksGate = useGatedResource(GatedResource.Tasks, {
    lockedBehavior: 'modal',
  })

  useEffect(() => {
    setConfig({
      sidebarVariant: 'chat',
      mobileSidebarHeader: ({ close }) => (
        <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              close()
            }}
            className="flex items-center gap-2"
          >
            <span className="text-lg font-semibold">Tasks</span>
          </button>
        </div>
      ),
    })

    return () => resetConfig()
  }, [resetConfig, setConfig])

  if (isAuthLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Mobile navbar */}
      <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-2 flex-shrink-0">
        <button
          onClick={openMobileSidebar}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold">Tasks</h1>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="w-full max-w-4xl mx-auto px-4 py-6 flex-1 min-h-0">
          {/* Header */}
          <div className="hidden md:block mb-6">
            <h2 className="text-2xl font-semibold">Tasks</h2>
            <p className="text-muted-foreground">
              Schedule automated tasks for your agents.
            </p>
          </div>

          {!tasksGate.isAllowed ? (
            <LockedFeatureBanner
              gate={tasksGate}
              title="Tasks are available on Basic and above"
              description="Automate your agents with scheduled tasks by upgrading your plan."
            />
          ) : (
            <TasksView mode="global" />
          )}
        </div>
      </div>
    </>
  )
}

export default TasksPage
