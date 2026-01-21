/**
 * Migration script for V3 Artifacts System Upgrade
 *
 * This script performs the following migrations:
 * 1. Sets version: 1 on all existing ArtifactV3 documents
 * 2. Creates initial ArtifactVersionV3 snapshots for each artifact
 * 3. Removes key field from ArtifactPermissionV3 documents
 *
 * Usage:
 *   DOTENV_PATH=.env.eden tsx scripts/migrate-artifacts-v3.ts [--dry-run]
 *
 * Options:
 *   --dry-run  Show what would be migrated without making changes
 */
import { config as dotenvConfig } from 'dotenv'
import mongoose from 'mongoose'

const envFile = process.env.DOTENV_PATH || '.env.eden'
dotenvConfig({ path: envFile })

const BATCH_SIZE = 100
const DRY_RUN = process.argv.includes('--dry-run')

interface ArtifactDoc {
  _id: mongoose.Types.ObjectId
  owner: mongoose.Types.ObjectId
  items: Record<string, unknown>
  version?: number
  createdAt: Date
}

interface _PermissionDoc {
  _id: mongoose.Types.ObjectId
  artifact: mongoose.Types.ObjectId
  subject: mongoose.Types.ObjectId
  level: string
  key?: string
  grantedBy: mongoose.Types.ObjectId
  grantedAt: Date
}

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required')
  }

  console.log('Connecting to MongoDB...')
  await mongoose.connect(mongoUri)
  console.log('Connected to MongoDB')
}

async function migrateArtifactVersions() {
  console.log('\n=== Migrating Artifact Versions ===')

  const ArtifactV3 = mongoose.connection.collection('artifacts_v3')
  const ArtifactVersionV3 = mongoose.connection.collection(
    'artifact_versions_v3',
  )

  // Find artifacts without version field or with version undefined
  const artifactsWithoutVersion = await ArtifactV3.countDocuments({
    $or: [{ version: { $exists: false } }, { version: null }],
  })
  console.log(
    `Found ${artifactsWithoutVersion} artifacts without version field`,
  )

  // Find artifacts that don't have a version snapshot yet
  const allArtifactIds = await ArtifactV3.distinct('_id')
  const artifactsWithSnapshots = await ArtifactVersionV3.distinct('artifact')
  const artifactIdsSet = new Set(
    artifactsWithSnapshots.map(id => id.toString()),
  )
  const artifactsWithoutSnapshots = allArtifactIds.filter(
    id => !artifactIdsSet.has(id.toString()),
  )
  console.log(
    `Found ${artifactsWithoutSnapshots.length} artifacts without version snapshots`,
  )

  if (DRY_RUN) {
    console.log('[DRY RUN] Would update version field on artifacts')
    console.log('[DRY RUN] Would create version snapshots')
    return {
      updatedArtifacts: artifactsWithoutVersion,
      createdSnapshots: artifactsWithoutSnapshots.length,
    }
  }

  // Update version field on all artifacts that don't have it
  if (artifactsWithoutVersion > 0) {
    const result = await ArtifactV3.updateMany(
      { $or: [{ version: { $exists: false } }, { version: null }] },
      { $set: { version: 1 } },
    )
    console.log(`Updated ${result.modifiedCount} artifacts with version: 1`)
  }

  // Create initial version snapshots for artifacts that don't have them
  let createdSnapshots = 0
  for (let i = 0; i < artifactsWithoutSnapshots.length; i += BATCH_SIZE) {
    const batch = artifactsWithoutSnapshots.slice(i, i + BATCH_SIZE)
    const artifacts = await ArtifactV3.find<ArtifactDoc>({
      _id: { $in: batch },
    }).toArray()

    const snapshots = artifacts.map(artifact => ({
      artifact: artifact._id,
      version: artifact.version || 1,
      items: artifact.items || {},
      actor: artifact.owner,
      reason: 'Migration: Initial snapshot',
      createdAt: artifact.createdAt || new Date(),
    }))

    if (snapshots.length > 0) {
      await ArtifactVersionV3.insertMany(snapshots)
      createdSnapshots += snapshots.length
    }

    console.log(
      `Progress: ${Math.min(
        i + BATCH_SIZE,
        artifactsWithoutSnapshots.length,
      )}/${artifactsWithoutSnapshots.length}`,
    )
  }

  console.log(`Created ${createdSnapshots} version snapshots`)
  return { updatedArtifacts: artifactsWithoutVersion, createdSnapshots }
}

async function migratePermissions() {
  console.log('\n=== Migrating Permissions (removing key field) ===')

  const ArtifactPermissionV3 = mongoose.connection.collection(
    'artifact_permissions',
  )

  // Find permissions with key field
  const permissionsWithKey = await ArtifactPermissionV3.countDocuments({
    key: { $exists: true },
  })
  console.log(`Found ${permissionsWithKey} permissions with key field`)

  if (DRY_RUN) {
    console.log('[DRY RUN] Would remove key field from permissions')
    return { removedKeyFields: permissionsWithKey }
  }

  if (permissionsWithKey > 0) {
    // Remove the key field from all permissions
    const result = await ArtifactPermissionV3.updateMany(
      { key: { $exists: true } },
      { $unset: { key: '' } },
    )
    console.log(`Removed key field from ${result.modifiedCount} permissions`)
  }

  return { removedKeyFields: permissionsWithKey }
}

async function createIndexes() {
  console.log('\n=== Creating/Updating Indexes ===')

  if (DRY_RUN) {
    console.log('[DRY RUN] Would create indexes on artifact_versions_v3')
    return
  }

  const ArtifactVersionV3 = mongoose.connection.collection(
    'artifact_versions_v3',
  )

  await ArtifactVersionV3.createIndex({ artifact: 1, version: -1 })
  await ArtifactVersionV3.createIndex({ artifact: 1, createdAt: -1 })
  await ArtifactVersionV3.createIndex({ actor: 1, createdAt: -1 })

  console.log('Indexes created on artifact_versions_v3')
}

async function main() {
  console.log('===========================================')
  console.log('V3 Artifacts System Migration')
  console.log('===========================================')
  if (DRY_RUN) {
    console.log('*** DRY RUN MODE - No changes will be made ***')
  }
  console.log(`Environment file: ${envFile}`)
  console.log('')

  try {
    await connectToDatabase()

    const versionResult = await migrateArtifactVersions()
    const permissionResult = await migratePermissions()
    await createIndexes()

    console.log('\n===========================================')
    console.log('Migration Summary')
    console.log('===========================================')
    console.log(
      `Artifacts updated with version field: ${versionResult.updatedArtifacts}`,
    )
    console.log(`Version snapshots created: ${versionResult.createdSnapshots}`)
    console.log(
      `Permissions with key field removed: ${permissionResult.removedKeyFields}`,
    )

    if (DRY_RUN) {
      console.log(
        '\n*** This was a dry run. Run without --dry-run to apply changes. ***',
      )
    } else {
      console.log('\nMigration completed successfully!')
    }
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

main()
