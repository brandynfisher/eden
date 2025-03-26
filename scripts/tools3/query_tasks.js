#!/usr/bin/env node

import dotenv from 'dotenv'
dotenv.config()

import { client, db, DRY_RUN, AWS_BUCKET_NAME } from '../cdn/mongo_connect.js'
import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

// Configuration for the query
const config = {
  collection: 'tasks3',
  query: {
    status: 'completed',
    tool: 'texture_flow'
  },
  sort: { createdAt: -1 }, // -1 for descending (newest first)
  limit: 25,
  resultPath: 'result[].output[].filename', // Path to extract from each document
  prependUrl: true, // Whether to prepend AWS_CLOUDFRONT_URL to filenames
  downloadFiles: true, // Whether to download the files - set to false to just fetch URLs
  fetchOnly: false, // When true, just extracts URLs without downloading
  outputPath: path.join(path.dirname(fileURLToPath(import.meta.url)), 'downloads'), // Next to this script
  downloadConcurrency: 1, // Download one file at a time
  downloadDelayMs: 500, // delay between downloads
  pauseBetweenDownloadsMs: 500, // delay between each successful download
  maxRetries: 5, // Increased number of retries for failed downloads
  initialRetryDelayMs: 10000, // Initial delay before first retry (10 seconds)
  backoffFactor: 2, // Exponential backoff multiplier
  maxRetryDelayMs: 300000 // Maximum retry delay (5 minutes)
}

// Get AWS CloudFront URL from environment
const AWS_CLOUDFRONT_URL = process.env.AWS_CLOUDFRONT_URL || `https://${AWS_BUCKET_NAME}.s3.amazonaws.com`

/**
 * Extracts values from a nested path string like 'result[].output[].filename'
 * Returns an array of all matching values
 */
function extractNestedValues(obj, path) {
  const segments = path.split('.')
  let current = [obj]
  let results = []

  for (const segment of segments) {
    const nextCurrent = []

    // Handle array notation like 'result[]'
    if (segment.endsWith('[]')) {
      const arrayKey = segment.slice(0, -2)
      for (const item of current) {
        if (item && Array.isArray(item[arrayKey])) {
          nextCurrent.push(...item[arrayKey])
        }
      }
    } else {
      // Regular property access
      for (const item of current) {
        if (item && item[segment] !== undefined) {
          nextCurrent.push(item[segment])
        }
      }
    }

    current = nextCurrent
  }

  return current
}

/**
 * Converts filename to full URL by prepending AWS_CLOUDFRONT_URL
 */
function filenameToUrl(filename) {
  if (!filename || typeof filename !== 'string') return filename

  // Make sure we don't double-prepend the URL
  if (filename.startsWith('http')) return filename

  // Make sure the URL and filename join properly with a slash
  const baseUrl = AWS_CLOUDFRONT_URL.endsWith('/') ? AWS_CLOUDFRONT_URL : `${AWS_CLOUDFRONT_URL}/`
  const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename

  return `${baseUrl}${cleanFilename}`
}

/**
 * Downloads a file from a URL to a local path with exponential backoff retries
 */
function downloadFile(url, targetPath, retries = 0) {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dir = path.dirname(targetPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Calculate exponential backoff delay with jitter
    const calculateBackoffDelay = (retry) => {
      // Base exponential backoff: initialDelay * (backoffFactor ^ retry)
      const exponentialDelay = config.initialRetryDelayMs * Math.pow(config.backoffFactor, retry)

      // Apply maximum cap
      const cappedDelay = Math.min(exponentialDelay, config.maxRetryDelayMs)

      // Add jitter (±25% randomness) to avoid thundering herd problem
      const jitterFactor = 0.75 + (Math.random() * 0.5) // 0.75 to 1.25

      return Math.floor(cappedDelay * jitterFactor)
    }

    // Choose http or https module based on URL
    const httpClient = url.startsWith('https') ? https : http

    // Parse the URL to get hostname for Referer header
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname

    // Browser-like headers to avoid CloudFront 403 errors
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      'Accept': 'video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `https://${hostname}/`,
      'Origin': `https://${hostname}`
    }

    console.log(`Downloading file (attempt ${retries + 1}/${config.maxRetries + 1}): ${url}`)

    const request = httpClient.get(url, { headers }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        console.log(`Following redirect to: ${redirectUrl}`)
        downloadFile(redirectUrl, targetPath, retries).then(resolve).catch(reject)
        return
      }

      // Check if response is successful
      if (response.statusCode !== 200) {
        // If we get rate limiting errors or server errors, retry with backoff if we have retries left
        const shouldRetry = (response.statusCode >= 403 && response.statusCode < 500) ||
          (response.statusCode >= 500 && response.statusCode < 600)

        if (shouldRetry && retries < config.maxRetries) {
          const nextRetryDelay = calculateBackoffDelay(retries)
          console.log(`Rate limited or server error (${response.statusCode}). Retry ${retries + 1}/${config.maxRetries} in ${nextRetryDelay}ms...`)

          setTimeout(() => {
            downloadFile(url, targetPath, retries + 1)
              .then(resolve)
              .catch(reject)
          }, nextRetryDelay)
          return
        }

        reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`))
        return
      }

      // Pipe response to file
      const file = fs.createWriteStream(targetPath)
      response.pipe(file)

      file.on('finish', () => {
        file.close()
        resolve()
      })

      file.on('error', (err) => {
        fs.unlink(targetPath, () => { }) // Delete the file if there's an error
        reject(err)
      })
    })

    request.on('error', (err) => {
      // For network errors, retry if we have retries left
      if (retries < config.maxRetries) {
        const nextRetryDelay = calculateBackoffDelay(retries)
        console.log(`Network error: ${err.message}. Retry ${retries + 1}/${config.maxRetries} in ${nextRetryDelay}ms...`)

        setTimeout(() => {
          downloadFile(url, targetPath, retries + 1)
            .then(resolve)
            .catch(reject)
        }, nextRetryDelay)
        return
      }

      // Otherwise just reject
      reject(err)
    })

    // Set a timeout
    request.setTimeout(30000, () => {
      request.abort()

      // Retry on timeout if we have retries left
      if (retries < config.maxRetries) {
        const nextRetryDelay = calculateBackoffDelay(retries)
        console.log(`Request timed out. Retry ${retries + 1}/${config.maxRetries} in ${nextRetryDelay}ms...`)

        setTimeout(() => {
          downloadFile(url, targetPath, retries + 1)
            .then(resolve)
            .catch(reject)
        }, nextRetryDelay)
        return
      }

      reject(new Error('Download timed out'))
    })
  })
}

/**
 * Downloads files one at a time with consistent delays between downloads
 */
async function downloadFilesWithRateLimit(downloads, concurrency, delayMs) {
  console.log(`Beginning downloads with exponential backoff: ${concurrency} at a time, ${delayMs}ms base delay`)
  console.log(`Pause between successful downloads: ${config.pauseBetweenDownloadsMs}ms`)
  console.log(`Retry configuration: max retries=${config.maxRetries}, initial delay=${config.initialRetryDelayMs}ms, backoff factor=${config.backoffFactor}x`)

  const results = []
  const failedDownloads = []
  let completed = 0
  const total = downloads.length

  // Add a random factor to each download to prevent predictable patterns
  // that might trigger anti-scraping measures
  const randomizeDelay = (baseDelay) => {
    // Add ±20% randomness
    const randomFactor = 0.8 + (Math.random() * 0.4) // 0.8 to 1.2
    return Math.floor(baseDelay * randomFactor)
  }

  // Process downloads sequentially with consistent pauses
  for (let i = 0; i < downloads.length; i++) {
    const download = downloads[i]

    console.log(`\nDownloading file ${i + 1}/${total}`)

    try {
      // Process the download
      await downloadFile(download.url, download.targetPath)
      console.log(`Downloaded (${++completed}/${total}): ${download.targetPath}`)
      results.push({ status: 'fulfilled', value: { success: true, download } })

      // Always pause after each successful download to avoid rate limits
      if (i < downloads.length - 1) {
        const pauseDelay = randomizeDelay(config.pauseBetweenDownloadsMs)
        console.log(`Success! Pausing ${pauseDelay}ms before next download...`)
        await new Promise(resolve => setTimeout(resolve, pauseDelay))
      }
    } catch (err) {
      console.error(`Error downloading ${download.url}:`, err.message)
      failedDownloads.push({ ...download, error: err.message })
      results.push({ status: 'fulfilled', value: { success: false, download, error: err.message } })

      // Add extra delay after failures to let system recover
      if (i < downloads.length - 1) {
        const failureDelay = randomizeDelay(config.pauseBetweenDownloadsMs * 2)
        console.log(`Failure. Pausing ${failureDelay}ms before next download...`)
        await new Promise(resolve => setTimeout(resolve, failureDelay))
      }
    }
  }

  // Log any failures at the end
  if (failedDownloads.length > 0) {
    console.log('\nFailed downloads:')
    failedDownloads.forEach(({ url, targetPath, error }) => {
      console.log(`- ${targetPath}: ${error}`)
    })
  }

  return {
    successful: results.filter(r => r.value?.success).length,
    failed: failedDownloads.length,
    total,
    failedDownloads
  }
}

async function main() {
  try {
    console.log('Query configuration:')
    console.log(JSON.stringify(config, null, 2))
    console.log(`AWS_CLOUDFRONT_URL: ${AWS_CLOUDFRONT_URL}`)
    console.log(`DRY_RUN: ${DRY_RUN}`)

    const collection = db.collection(config.collection)

    // Execute the query with configured parameters
    const docs = await collection
      .find(config.query)
      .sort(config.sort)
      .limit(config.limit)
      .toArray()

    console.log(`Found ${docs.length} documents matching the query criteria.`)

    // Create timestamp and directory paths early - moved up to fix reference error
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')
    const downloadDir = path.resolve(
      config.outputPath,
      `${config.query.tool}_${timestamp}`
    )

    // Extract the specified data from each document
    const results = []
    const downloadsToProcess = []
    const allExtractedUrls = []

    for (const doc of docs) {
      let extractedValues = extractNestedValues(doc, config.resultPath)

      // Prepend AWS_CLOUDFRONT_URL to each filename if configured
      if (config.prependUrl) {
        extractedValues = extractedValues.map(filename => filenameToUrl(filename))
      }

      // Save all URLs for fetch-only mode
      allExtractedUrls.push(...extractedValues)

      results.push({
        _id: doc._id,
        createdAt: doc.createdAt,
        extractedValues
      })

      // Print the extracted values
      console.log(`\nDocument ID: ${doc._id}`)
      console.log(`Created At: ${doc.createdAt}`)
      console.log('Extracted values:')
      console.log(extractedValues)

      // Queue files for download if configured and not in fetch-only mode
      if (!DRY_RUN && config.downloadFiles && !config.fetchOnly) {
        for (const url of extractedValues) {
          if (!url || typeof url !== 'string') continue

          // Get the filename from the URL
          const urlObj = new URL(url)
          let filename = path.basename(urlObj.pathname)

          // Add document ID as prefix to prevent filename collisions
          // Format: docId_filename.ext
          filename = `${doc._id}_${filename}`

          // Save directly to download directory instead of subdirectory
          const targetPath = path.join(downloadDir, filename)

          // Queue the download
          downloadsToProcess.push({
            url,
            targetPath,
            docId: doc._id
          })
        }
      } else if ((DRY_RUN || config.fetchOnly) && config.downloadFiles) {
        console.log(`[${DRY_RUN ? 'DRY_RUN' : 'FETCH_ONLY'}] Would download ${extractedValues.length} files for document ${doc._id}`)
      }
    }

    console.log('\nSummary:')
    console.log(`Total documents processed: ${docs.length}`)
    console.log(`Total values extracted: ${results.reduce((acc, r) => acc + r.extractedValues.length, 0)}`)

    // In fetch-only mode, write URLs to a file without downloading
    if (config.fetchOnly) {
      const outputDir = path.resolve(
        config.outputPath
      )

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const urlsFilePath = path.join(outputDir, `${config.query.tool}_urls_${timestamp}.txt`)
      fs.writeFileSync(urlsFilePath, allExtractedUrls.join('\n'))
      console.log(`\nFetch-only mode: ${allExtractedUrls.length} URLs written to ${urlsFilePath}`)
      console.log('You can download these files using tools like wget or curl:')
      console.log(`wget -i ${urlsFilePath}`)
      console.log(`\nOr to download with a 5-second delay between files:`)
      console.log(`cat ${urlsFilePath} | while read url; do wget "$url"; sleep 5; done`)

      return results
    }

    // Now create the download directory since we're not in fetch-only mode
    console.log(`Download directory: ${downloadDir}`)

    if (!DRY_RUN && config.downloadFiles) {
      fs.mkdirSync(downloadDir, { recursive: true })
      console.log(`Created download directory: ${downloadDir}`)
    } else {
      console.log(`[DRY_RUN] Would create directory: ${downloadDir}`)
    }

    // Download files with rate limiting if needed
    if (downloadsToProcess.length > 0 && !DRY_RUN && !config.fetchOnly) {
      console.log(`\nPreparing to download ${downloadsToProcess.length} files with staggered approach...`)

      const downloadStats = await downloadFilesWithRateLimit(
        downloadsToProcess,
        config.downloadConcurrency,
        config.downloadDelayMs
      )

      console.log(`\nDownload completed: ${downloadStats.successful}/${downloadStats.total} files successful`)
    }

    if (!DRY_RUN && config.downloadFiles && !config.fetchOnly) {
      console.log(`Files downloaded to: ${downloadDir}`)

      // Write results to a manifest file
      const manifestPath = path.join(downloadDir, 'manifest.json')
      fs.writeFileSync(manifestPath, JSON.stringify({
        metadata: {
          queryConfig: config,
          timestamp,
          totalDocuments: docs.length,
          totalFilesAttempted: downloadsToProcess.length
        },
        results
      }, null, 2))
      console.log(`Manifest written to: ${manifestPath}`)
    } else if (DRY_RUN && config.downloadFiles && !config.fetchOnly) {
      console.log(`[DRY_RUN] No files were downloaded. Run with DRY_RUN=false to download files.`)
    }

    return results
  } catch (error) {
    console.error('Error in query process:', error)
  } finally {
    await client.close()
    console.log('MongoClient: Disconnected.')
  }
}

await main()
console.log('done') 