'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  INTEGRATION_CATEGORIES,
  INTEGRATION_DEFINITIONS,
  IntegrationCategory,
  WIZARD_EXCLUDED_PLATFORMS,
} from '@/features/integrations/integration-definitions'
import {
  GatedResource,
  PREVIEW_ONLY_DEPLOYMENT_PLATFORMS,
  useGatedResource,
} from '@/hooks/use-gated-resource'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import { FC, useMemo } from 'react'

interface PlatformPickerProps {
  onSelect: (platform: string) => void
  onBack?: () => void
  connectedPlatforms?: Set<string>
  showBackButton?: boolean
}

export const PlatformPicker: FC<PlatformPickerProps> = ({
  onSelect,
  onBack,
  connectedPlatforms = new Set(),
  showBackButton = true,
}) => {
  const deploymentsGate = useGatedResource(GatedResource.Deployments, {
    lockedBehavior: 'modal',
  })

  const availablePlatforms = useMemo(
    () =>
      INTEGRATION_DEFINITIONS.filter(def => {
        if (def.allowCreate === false) return false
        if (WIZARD_EXCLUDED_PLATFORMS.has(def.platform)) return false
        if (
          !deploymentsGate.isPreviewUser &&
          PREVIEW_ONLY_DEPLOYMENT_PLATFORMS.has(def.platform)
        ) {
          return false
        }
        return true
      }),
    [deploymentsGate.isPreviewUser],
  )

  const platformsByCategory = useMemo(() => {
    return availablePlatforms.reduce(
      (acc, platform) => {
        acc[platform.category].push(platform)
        return acc
      },
      {
        social: [],
        utilities: [],
        other: [],
      } as Record<string, typeof availablePlatforms>,
    )
  }, [availablePlatforms])

  return (
    <div className="space-y-4">
      {showBackButton && onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-fit -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      <div className="space-y-6">
        {Object.entries(platformsByCategory).map(
          ([category, platforms]) =>
            platforms.length > 0 && (
              <div key={category} className="space-y-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {INTEGRATION_CATEGORIES[category as IntegrationCategory]}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {platforms.map(platform => {
                    const Icon = platform.icon
                    const isAlreadyDeployed = connectedPlatforms.has(
                      platform.platform,
                    )

                    return (
                      <button
                        key={platform.platform}
                        type="button"
                        disabled={isAlreadyDeployed}
                        onClick={() => {
                          if (isAlreadyDeployed) return
                          onSelect(platform.platform)
                        }}
                        className={cn(
                          'flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors sm:p-4',
                          isAlreadyDeployed
                            ? 'cursor-not-allowed border-border/40 bg-muted/20 text-muted-foreground'
                            : 'border-border/60 hover:border-border hover:bg-muted/30',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{platform.label}</span>
                          {isAlreadyDeployed && (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase tracking-wide"
                            >
                              Connected
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {platform.description}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  )
}

export default PlatformPicker
