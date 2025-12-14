'use client'

import { TasksView } from '@/features/tasks/components/tasks-view'
import { Agent } from '@edenlabs/eden-sdk'
import { FC } from 'react'

interface AgentTasksViewProps {
  agent: Agent
  variant?: 'standalone' | 'panel'
}

const AgentTasksView: FC<AgentTasksViewProps> = ({
  agent,
  variant = 'standalone',
}) => {
  const isPanelLayout = variant === 'panel'
  const outerWrapperClass = isPanelLayout
    ? 'space-y-6'
    : 'flex-1 overflow-auto bg-accent'
  const innerWrapperClass = isPanelLayout
    ? 'space-y-6'
    : 'w-full max-w-4xl mx-auto px-4 py-6 space-y-6'
  const showInternalHeader = variant === 'standalone'

  return (
    <div className={outerWrapperClass}>
      <div className={innerWrapperClass}>
        {/* Header */}
        {showInternalHeader && (
          <div
            className={`flex flex-col gap-2 ${
              isPanelLayout
                ? 'rounded-xl border border-border bg-card p-6'
                : 'mb-6'
            }`}
          >
            <div>
              <h2 className="text-2xl font-semibold">Tasks</h2>
              <p className="text-muted-foreground">
                Schedule automated tasks for {agent.name}
              </p>
            </div>
          </div>
        )}

        <TasksView mode="agent" agentId={agent._id} isModalOpen={true} />
      </div>
    </div>
  )
}

export default AgentTasksView
