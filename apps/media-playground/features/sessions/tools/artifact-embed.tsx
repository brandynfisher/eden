'use client'

import { Button } from '@/components/ui/button'
import type { ArtifactV3 } from '@/types/artifacts-v3'
import { TaskV2Result } from '@edenlabs/eden-sdk'
import { ExternalLinkIcon, FileTextIcon } from 'lucide-react'
import React, { useMemo } from 'react'

type ArtifactEmbedProps = {
  toolName: string
  results: TaskV2Result[]
  args?: Record<string, unknown>
  onOpenArtifact?: (artifactId: string) => void
}

const parseOutput = (output: unknown) => {
  if (!output) return null
  if (typeof output === 'string') {
    try {
      return JSON.parse(output)
    } catch (error) {
      return null
    }
  }
  return output
}

const extractArtifacts = (
  results: TaskV2Result[],
  args?: Record<string, unknown>,
) => {
  const artifacts: ArtifactV3[] = []
  const artifactIds = new Set<string>()

  results.forEach(result => {
    const parsed = parseOutput(result?.output)
    if (!parsed || typeof parsed !== 'object') {
      return
    }

    if ('artifact' in parsed && parsed.artifact) {
      artifacts.push(parsed.artifact as ArtifactV3)
      return
    }

    if ('docs' in parsed && Array.isArray(parsed.docs)) {
      parsed.docs.forEach((doc: ArtifactV3) => artifacts.push(doc))
    }
  })

  if (args && typeof args.artifactId === 'string') {
    artifactIds.add(args.artifactId)
  }

  artifacts.forEach(artifact => {
    if (artifact?._id) {
      artifactIds.add(artifact._id)
    }
  })

  const uniqueArtifacts = Array.from(
    new Map(artifacts.map(artifact => [artifact._id, artifact])).values(),
  )

  return {
    artifacts: uniqueArtifacts,
    artifactIds: Array.from(artifactIds),
  }
}

export const ArtifactEmbed: React.FC<ArtifactEmbedProps> = ({
  toolName,
  results,
  args,
  onOpenArtifact,
}) => {
  const { artifacts, artifactIds } = useMemo(
    () => extractArtifacts(results, args),
    [results, args],
  )

  if (!artifacts.length && !artifactIds.length) {
    return null
  }

  const displayName = toolName.replace(/_/g, ' ')
  const displayCount = artifacts.length || artifactIds.length

  return (
    <div className="rounded-md border border-border bg-background/70 max-w-lg">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border text-xs text-muted-foreground">
        <FileTextIcon className="w-3.5 h-3.5" />
        <span className="font-medium text-foreground">{displayName}</span>
        <span className="ml-auto">{displayCount} artifacts</span>
      </div>

      <div className="p-3 space-y-3">
        {artifacts.map(artifact => {
          const content =
            typeof (artifact.items as Record<string, unknown>)?.content ===
            'string'
              ? ((artifact.items as Record<string, unknown>).content as string)
              : ''
          const preview =
            content.length > 180 ? `${content.slice(0, 180)}...` : content

          return (
            <div
              key={artifact._id}
              className="rounded-md border border-border/70 bg-muted/30 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {artifact.title || 'Untitled artifact'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {artifact.type || 'artifact'}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-xs"
                  onClick={() => onOpenArtifact?.(artifact._id)}
                >
                  <ExternalLinkIcon className="w-3 h-3 mr-1" />
                  Open
                </Button>
              </div>
              {preview && (
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {preview}
                </div>
              )}
            </div>
          )
        })}

        {!artifacts.length && artifactIds.length > 0 && (
          <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Artifact ready</span>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-xs"
                onClick={() => onOpenArtifact?.(artifactIds[0])}
              >
                <ExternalLinkIcon className="w-3 h-3 mr-1" />
                Open
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
