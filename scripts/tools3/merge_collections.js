#!/usr/bin/env node

import dotenv from 'dotenv'
dotenv.config()

import { client, db, DRY_RUN } from '../cdn/mongo_connect.js'

// Collection names
const OLD_COLLECTIONS_NAME = 'collections'
const NEW_COLLECTIONS_NAME = 'collections2'
const FINAL_COLLECTIONS_NAME = 'collections3'
const CREATIONS3_COLLECTION_NAME = 'creations3'

/**
 * Prefer the most recent public creation. If none is public, fallback to
 * the most recent private creation (not deleted). If everything is deleted
 * or missing, return undefined.
 */
async function getCoverCreation(creationsArr) {
  if (!Array.isArray(creationsArr) || creationsArr.length === 0) {
    return undefined
  }

  const creations3 = db.collection(CREATIONS3_COLLECTION_NAME)

  // We'll store one private-not-deleted doc as a fallback
  let fallback = null

  // Scan from last to first (reverse order)
  for (let i = creationsArr.length - 1; i >= 0; i--) {
    const creationId = creationsArr[i]
    const creationDoc = await creations3.findOne(
      { _id: creationId },
      { projection: { public: 1, deleted: 1 } }
    )

    // Skip if doc doesn't exist or is deleted
    if (!creationDoc || creationDoc.deleted) {
      continue
    }

    // If doc is public and not deleted => prefer & return it right away
    if (creationDoc.public) {
      return creationId
    } else {
      // It's private but not deleted => record as fallback if we haven't found one yet
      if (!fallback) {
        fallback = creationId
      }
    }
  }

  return fallback // might be null if no suitable doc found
}

async function main() {
  try {
    const oldCollection = db.collection(OLD_COLLECTIONS_NAME)
    const newCollection = db.collection(NEW_COLLECTIONS_NAME)
    const finalCollection = db.collection(FINAL_COLLECTIONS_NAME)

    // 1) Fetch all relevant docs from old/new
    const oldDocs = await oldCollection.find({
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
      creations: { $exists: true, $type: 'array', $ne: [] },
    }).toArray()

    const newDocs = await newCollection.find({
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
      creations: { $exists: true, $type: 'array', $ne: [] },
    }).toArray()

    console.log(`Found ${oldDocs.length} docs from "${OLD_COLLECTIONS_NAME}".`)
    console.log(`Found ${newDocs.length} docs from "${NEW_COLLECTIONS_NAME}".`)

    // 2) Determine which docs already exist in `collections3`
    //    We'll fetch all final IDs that match the old + new docs' IDs
    const allIds = [
      ...oldDocs.map(d => d._id),
      ...newDocs.map(d => d._id),
    ]
    const existingFinalDocs = await finalCollection.find(
      { _id: { $in: allIds } },
      { projection: { _id: 1 } }
    ).toArray()
    const existingIdsSet = new Set(existingFinalDocs.map(d => d._id.toString()))

    // 3) Filter out old/new docs that already exist in final
    const oldDocsToMigrate = oldDocs.filter(d => !existingIdsSet.has(d._id.toString()))
    const newDocsToMigrate = newDocs.filter(d => !existingIdsSet.has(d._id.toString()))

    console.log(
      `${oldDocsToMigrate.length} old docs will be migrated (skipped ${
        oldDocs.length - oldDocsToMigrate.length
      } already in final).`
    )
    console.log(
      `${newDocsToMigrate.length} new docs will be migrated (skipped ${
        newDocs.length - newDocsToMigrate.length
      } already in final).`
    )

    // 4) Transform the docs we still need to migrate
    const oldDocsPrepared = []
    const newDocsPrepared = []

    // Transform old docs
    for (const doc of oldDocsToMigrate) {
      const coverCreation = await getCoverCreation(doc.creations)

      const finalDoc = {
        _id: doc._id,
        user: doc.user,
        name: doc.name,
        description: doc.description ?? '',
        creations: doc.creations ?? [],
        contributors: doc.contributors ?? [],
        coverCreation,
        public: !doc.isPrivate,   // flip isPrivate => public
        deleted: doc.deleted ?? false,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
      }

      oldDocsPrepared.push(finalDoc)
    }

    // Transform new docs
    for (const doc of newDocsToMigrate) {
      const coverCreation = await getCoverCreation(doc.creations)

      const finalDoc = {
        _id: doc._id,
        user: doc.user,
        name: doc.name,
        description: doc.description ?? '',
        creations: doc.creations ?? [],
        contributors: doc.contributors ?? [],
        coverCreation,
        public: doc.public ?? false,
        deleted: doc.deleted ?? false,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
      }

      newDocsPrepared.push(finalDoc)
    }

    // 5) Check for collisions among the docs we plan to insert
    //    (i.e. if an _id appears in both oldDocsPrepared and newDocsPrepared).
    const oldIdsSet = new Set(oldDocsPrepared.map(d => d._id.toString()))
    let collisionCount = 0

    for (const doc of newDocsPrepared) {
      if (oldIdsSet.has(doc._id.toString())) {
        collisionCount++
        console.warn(
          `[DRY_RUN CHECK] Detected _id collision among docs to insert: ${doc._id}.`
        )
      }
    }

    if (collisionCount > 0) {
      console.error(
        `Found ${collisionCount} internal _id collision(s) between old and new docs to migrate.`
      )
      if (DRY_RUN) {
        console.log(`[DRY_RUN] Aborting insertion due to collisions.`)
        return
      }
      // If DRY_RUN=false, handle collisions (rename, skip, etc.) before insertion.
    }

    // 6) If DRY_RUN is true, do not insert anything
    if (DRY_RUN) {
      console.log('[DRY_RUN] DRY_RUN is true, so no data will be written.')
      console.log('[DRY_RUN] Exiting now.')
      return
    }

    // 7) Insert docs (DRY_RUN=false)
    console.log('[REAL_RUN] DRY_RUN=false, proceeding with insert...')

    if (oldDocsPrepared.length) {
      try {
        const resultOld = await finalCollection.insertMany(oldDocsPrepared, { ordered: false })
        console.log(
          `Successfully inserted ${resultOld.insertedCount}/${oldDocsPrepared.length} old docs.`
        )
      } catch (err) {
        console.error(`Error inserting old docs:`, err)
      }
    }

    if (newDocsPrepared.length) {
      try {
        const resultNew = await finalCollection.insertMany(newDocsPrepared, { ordered: false })
        console.log(
          `Successfully inserted ${resultNew.insertedCount}/${newDocsPrepared.length} new docs.`
        )
      } catch (err) {
        console.error(`Error inserting new docs:`, err)
      }
    }

    console.log('Merge/migration completed.')
  } catch (error) {
    console.error('Error in main merge process:', error)
  } finally {
    await client.close()
    console.log('MongoClient: Disconnected.')
  }
}

await main()
console.log('done')
