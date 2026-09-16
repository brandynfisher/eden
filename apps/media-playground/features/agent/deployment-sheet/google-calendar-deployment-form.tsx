'use client'

import type { Agent, Deployment } from '@edenlabs/eden-sdk'
import type { FC } from 'react'

interface GoogleCalendarDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

export const GoogleCalendarDeploymentForm: FC<
  GoogleCalendarDeploymentFormProps
> = () => (
  <div role="status" className="p-4 text-sm">
    <p>Google Calendar is retired in old Eden.</p>
    <a href="https://dev.eden.art" className="underline">
      Use Google Calendar in new Eden
    </a>
    <p>
      This retirement does not delete saved credentials or revoke Google access.
    </p>
  </div>
)
