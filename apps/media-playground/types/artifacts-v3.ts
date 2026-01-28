import type { ArtifactsComponents } from '@edenlabs/eden-sdk-v3'

export type ArtifactV3 = Pick<
  ArtifactsComponents['schemas']['Artifact'],
  | '_id'
  | 'owner'
  | 'title'
  | 'type'
  | 'public'
  | 'session'
  | 'originSession'
  | 'version'
  | 'deleted'
  | 'createdAt'
  | 'updatedAt'
  | 'items'
>

export type ArtifactHistoryEntryDto = Pick<
  ArtifactsComponents['schemas']['ArtifactHistoryEntry'],
  | '_id'
  | 'artifact'
  | 'version'
  | 'items'
  | 'operations'
  | 'actor'
  | 'reason'
  | 'createdAt'
  | 'updatedAt'
>

export type ArtifactHistoryEntryUI = Omit<
  ArtifactHistoryEntryDto,
  'createdAt' | 'updatedAt'
> & {
  createdAt: Date
  updatedAt?: Date
}

export const toArtifactHistoryUI = (
  entry: ArtifactHistoryEntryDto,
): ArtifactHistoryEntryUI => ({
  ...entry,
  createdAt: new Date(entry.createdAt),
  updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
})
