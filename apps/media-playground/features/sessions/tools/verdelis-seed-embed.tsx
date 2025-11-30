'use client'

import { ToolHoverMenu } from '@/features/sessions/components/tool-hover-menu'
import { TaskV2Result, VerdelisSeedV2 } from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Sparkles } from 'lucide-react'
import Image from 'next/image'
import React, { useMemo } from 'react'

export type VerdelisSeedEmbedProps = {
  results: TaskV2Result[]
  toolName?: string
  toolArgs?: Record<string, unknown>
}

// Extract seed ID from tool results
const extractSeedId = (results: TaskV2Result[]): string | null => {
  for (const result of results || []) {
    if (!result?.output) continue

    // Cast output to unknown for flexible type checking
    const output = result.output as unknown

    // Handle array output
    if (Array.isArray(output)) {
      for (const item of output) {
        if (typeof item === 'string' && item.length === 24) {
          return item // MongoDB ObjectId
        }
        if (typeof item === 'object' && item !== null) {
          // Check for _id, id, seedId, or seed_id
          const obj = item as Record<string, unknown>
          const id = obj._id || obj.id || obj.seedId || obj.artifact_id
          if (typeof id === 'string') return id
        }
      }
    }

    // Handle object output
    if (
      typeof output === 'object' &&
      output !== null &&
      !Array.isArray(output)
    ) {
      const obj = output as Record<string, unknown>
      const id = obj._id || obj.id || obj.seedId || obj.artifact_id
      if (typeof id === 'string') return id
    }

    // Handle string output (could be direct ID or JSON)
    if (typeof output === 'string') {
      // Direct ID
      if (output.length === 24) {
        return output
      }
      // Try parsing as JSON
      try {
        const parsed = JSON.parse(output)
        const id = parsed._id || parsed.id || parsed.seedId || parsed.seed_id
        if (typeof id === 'string') return id
      } catch {
        // Not JSON
      }
    }
  }
  return null
}

// Fetch seed data from API
const fetchVerdelisSeed = async (seedId: string): Promise<VerdelisSeedV2> => {
  const response = await fetch(`/api/verdelis-seeds/${seedId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch seed')
  }
  const data = await response.json()
  return data.seed
}

export const VerdelisSeedEmbed: React.FC<VerdelisSeedEmbedProps> = ({
  results,
  toolName = 'verdelis_seed',
  toolArgs = {},
}) => {
  const seedId = useMemo(() => extractSeedId(results), [results])

  const {
    data: seed,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['verdelis-seed', seedId],
    queryFn: () => fetchVerdelisSeed(seedId!),
    enabled: !!seedId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Loading state
  if (isLoading && seedId) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading story seed...</span>
        </div>
      </div>
    )
  }

  // Error or no data - return null to let ToolFallback handle it
  if (error || !seed) {
    return null
  }

  const { title, logline, images } = seed

  return (
    <div className="space-y-2">
      {/* Main card */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Header with icon and title */}
        <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-foreground leading-tight">
                {title || 'Untitled Seed'}
              </h3>
            </div>
          </div>
        </div>

        {/* Logline */}
        {logline && (
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {logline}
            </p>
          </div>
        )}

        {/* Image thumbnails */}
        {images && images.length > 0 && (
          <div className="p-3">
            <div
              className={`grid gap-2 ${
                images.length === 1
                  ? 'grid-cols-1'
                  : images.length === 2
                  ? 'grid-cols-2'
                  : images.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-4'
              }`}
            >
              {images.slice(0, 4).map((imageUrl, imgIndex) => (
                <div
                  key={imgIndex}
                  className="relative aspect-video rounded-md overflow-hidden bg-muted"
                >
                  <Image
                    src={imageUrl}
                    alt={`${title || 'Story'} - Image ${imgIndex + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
            {images.length > 4 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                +{images.length - 4} more images
              </p>
            )}
          </div>
        )}
      </div>

      {/* Compact tool dropdown - right justified */}
      <div className="flex justify-end">
        <ToolHoverMenu toolName={toolName} args={toolArgs} result={results} />
      </div>
    </div>
  )
}
