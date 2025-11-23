'use client'

import { Switch } from '@/components/ui/switch'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { useCallback } from 'react'

type Props = {
  checked: boolean
  onCheckedChange: (value: boolean) => void
  disabled?: boolean
  entityLabel?: string
}

const GatedPrivacySwitch = ({
  checked,
  onCheckedChange,
  disabled,
  entityLabel = 'agents',
}: Props) => {
  const privacyGate = useGatedResource(GatedResource.MakePrivate, {
    lockedBehavior: 'modal',
  })

  const handleChange = useCallback(
    (nextValue: boolean) => {
      // Gating applies when attempting to disable public (make private)
      if (!nextValue && !privacyGate.isAllowed) {
        privacyGate.openGate()
        // force switch back on for gated users
        onCheckedChange(true)
        return
      }
      onCheckedChange(nextValue)
    },
    [privacyGate, onCheckedChange],
  )

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleChange}
      disabled={disabled}
      aria-label={`Toggle privacy for ${entityLabel}`}
    />
  )
}

export default GatedPrivacySwitch
