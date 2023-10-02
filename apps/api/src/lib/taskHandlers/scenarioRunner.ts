import async from 'async'
import { FastifyInstance } from 'fastify'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import { ObjectId } from 'mongodb'
import sharp from 'sharp'
import tmp from 'tmp'

import { Character } from '../../models/Character'
import { Upload } from '../../models/Upload'
import {
  uploadBufferAsset,
  uploadThumbnailAsset,
} from '../../plugins/minioPlugin'
import { downloadBuffer, downloadFile, randomId } from '../util'
import { receiveTaskUpdate } from './edenHandlers'

async function createDialogueThumbnail(
  image1Url: string,
  image2Url: string,
  targetWidth: number,
  targetHeight: number,
) {
  const image1Buffer = await downloadBuffer(image1Url)
  const image2Buffer = await downloadBuffer(image2Url)

  // Resize and crop each image
  const halfWidth = targetWidth / 2
  const image1 = await sharp(image1Buffer)
    .resize(halfWidth, targetHeight, { fit: 'cover', position: 'center' })
    .toBuffer()
  const image2 = await sharp(image2Buffer)
    .resize(halfWidth, targetHeight, { fit: 'cover', position: 'center' })
    .toBuffer()

  // Composite both images together
  const combinedImage = await sharp(image1)
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: halfWidth,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .composite([{ input: image2, left: halfWidth, top: 0 }])
    .toBuffer()

  return combinedImage
}

function averageAspectRatio(images: any[]): number {
  let totalAspectRatio = 0.0
  images.forEach(img => {
    const { width, height } = img.mediaAttributes
    totalAspectRatio += width / height
  })
  return totalAspectRatio / images.length
}

function smallestImageSize(images: any[]): [number, number] {
  let minW = Number.POSITIVE_INFINITY
  let minH = Number.POSITIVE_INFINITY
  images.forEach(img => {
    const { width, height } = img.mediaAttributes
    minW = Math.min(minW, width)
    minH = Math.min(minH, height)
  })
  return [minW, minH]
}

function calculateTargetDimensions(
  minW: number,
  minH: number,
  avgAspectRatio: number,
): [number, number] {
  const MAX_PIXELS = 768 * 1024
  let targetWidth: number
  let targetHeight: number
  if (minW / minH > avgAspectRatio) {
    targetHeight = minH
    targetWidth = Math.round(targetHeight * avgAspectRatio)
  } else {
    targetWidth = minW
    targetHeight = Math.round(targetWidth / avgAspectRatio)
  }
  if (targetWidth * targetHeight > MAX_PIXELS) {
    const ratio = (targetWidth * targetHeight) / MAX_PIXELS
    targetWidth = Math.round(targetWidth / ratio)
    targetHeight = Math.round(targetHeight / ratio)
  }
  targetWidth = targetWidth - (targetWidth % 2) // Ensure even numbers
  targetHeight = targetHeight - (targetHeight % 2)
  return [targetWidth, targetHeight]
}

async function concatenateVideos(videoUrls: string[]) {
  const outputFile = tmp.tmpNameSync({ postfix: '.mp4' })
  const videoPaths = await Promise.all(
    videoUrls.map((url, index) => {
      const path = tmp.tmpNameSync({ postfix: `.video${index}.mp4` })
      return downloadFile(url, path).then(() => path)
    }),
  )
  const listFile = tmp.fileSync()
  const listFileContent = videoPaths.map(path => `file '${path}'`).join('\n')
  fs.writeFileSync(listFile.name, listFileContent)
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile.name)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions('-c copy')
      .on('error', error => {
        console.error(error.message)
        fs.unlinkSync(listFile.name)
        videoPaths.forEach(path => fs.unlinkSync(path))
        reject(error)
      })
      .on('end', () => {
        fs.unlinkSync(listFile.name)
        videoPaths.forEach(path => fs.unlinkSync(path))
        resolve(outputFile)
      })
      .save(outputFile)
  })
}

const submitTask = async (
  server: FastifyInstance,
  generator: any,
  generatorVersion: any,
  config: any,
) => {
  const task = { id: randomId(24) }
  setTimeout(async () => {
    await runTask(server, task, generator, generatorVersion, config)
  }, 0)
  return task
}

async function pollForTask(
  model: any,
  predictionId: string,
  maxRetries = 5,
  startingPollInterval = 30000,
  processingPollInterval = 5000,
  maxPolls = 1000,
) {
  let retries = 0
  let poll = 0
  let status

  while (poll < maxPolls) {
    try {
      const response = await model.replicate.getPrediction(predictionId)
      status = response.status

      if (status === 'succeeded') {
        return response.output[0].files[0]
      }

      if (status === 'failed' || status === 'canceled') {
        throw new Error(`Prediction ${status}`)
      }
    } catch (error) {
      console.error('Polling failed:', error)
      retries++

      if (retries > maxRetries) {
        throw new Error('Max retries reached for polling')
      }
    }

    poll++
    if (status === 'starting') {
      await new Promise(resolve => setTimeout(resolve, startingPollInterval))
    }
    if (status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, processingPollInterval))
    }
  }

  throw new Error('Max polling attempts reached')
}

async function generateVideoSegment(
  server: FastifyInstance,
  message: any,
  targetWidth?: number,
  targetHeight?: number,
) {
  try {
    const { elevenLabs, replicate } = server

    if (!elevenLabs) throw new Error('Elevenlabs not initialized')
    if (!replicate) throw new Error('Replicate not initialized')

    // generate text-to-speech
    const voiceId = message.character.voice || 'EXAVITQu4vr4xnSDxMaL'
    const audioBuffer = await elevenLabs.runTask(voiceId, message.message)
    const { uri: audioUrl } = await uploadBufferAsset(server, audioBuffer)
    // const audioUrl = "https://minio.aws.abraham.fun/creations-stg/3a69700d2f9b8b9dd4c0effa366ac6bb41cb39bf06af92049b5be7bb5cc25f58.mp3"

    // generate wav2lip
    const image = await Upload.findOne({ _id: message.character.image })
    if (!image) throw new Error('Image not found')
    const faceUrl = image.uri

    const model = await replicate.models.get('abraham-ai/character')
    const prediction = await model.replicate.startPrediction(
      model.modelDetails.id,
      {
        mode: 'wav2lip',
        face_url: faceUrl,
        speech_url: audioUrl,
        gfpgan: false,
        gfpgan_upscale: 1,
        width: targetWidth,
        height: targetHeight,
      },
    )

    const video = await pollForTask(model, prediction.id)

    console.log('===== OK ====')
    console.log(video)

    if (!video || video.length === 0) {
      throw new Error('Video array is empty or has more than one element')
    }

    return video
  } catch (error: any) {
    return {
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

const runTask = async (
  server: FastifyInstance,
  task: any,
  generator: any,
  generatorVersion: any,
  config: any,
) => {
  console.log(
    `Running task ${task.id} for generator ${
      generatorVersion.versionId
    } with config ${JSON.stringify(config)}`,
  )

  const { openai, elevenLabs, replicate, logos } = server
  if (!openai) {
    throw new Error('Openai not initialized')
  }
  if (!elevenLabs) {
    throw new Error('Elevenlabs not initialized')
  }
  if (!replicate) {
    throw new Error('Replicate not initialized')
  }
  if (!logos) {
    throw new Error('Logos not initialized')
  }

  try {
    if (generator.generatorName == 'monologue') {
      const character = await Character.findOne({
        _id: new ObjectId(config.characterId),
      })

      if (!character) {
        throw new Error('Character not found')
      }

      const image = await Upload.findOne({ _id: character.image })

      if (!image) {
        throw new Error('Image not found')
      }

      const monologue = await logos.monologue(server, config)

      const videoUrl = await generateVideoSegment(server, monologue)
      const videoBuffer = await downloadBuffer(videoUrl)
      const { uri } = await uploadBufferAsset(server, videoBuffer)

      const output_final = {
        files: [uri],
        thumbnails: [image.uri],
        name: config.prompt,
        progress: 1.0,
        isFinal: true,
      }

      const update = {
        id: task.id,
        status: 'succeeded',
        progress: 1,
        output: output_final,
        error: null,
      }

      await receiveTaskUpdate(server, update)
    } else if (generator.generatorName == 'dialogue') {
      const character1 = await Character.findOne({
        _id: config.characterIds[0],
      })
      const character2 = await Character.findOne({
        _id: config.characterIds[1],
      })

      if (!character1 || !character2) {
        throw new Error('Character not found')
      }

      const dialogue = await logos.dialogue(server, config)

      const image1 = await Upload.findOne({ _id: character1.image })
      const image2 = await Upload.findOne({ _id: character2.image })

      if (!image1 || !image2) {
        throw new Error('Image not found')
        // todo: make generic image
      }

      const avgAspectRatio = averageAspectRatio([image1, image2])
      const [minW, minH] = smallestImageSize([image1, image2])
      const [targetWidth, targetHeight] = calculateTargetDimensions(
        minW,
        minH,
        avgAspectRatio,
      )

      const videoUrls: string[] = []

      // generate video segments in parallel, max 4 concurrently
      async.eachLimit(
        dialogue,
        4,
        (message: any, callback: any) => {
          generateVideoSegment(server, message, targetWidth, targetHeight)
            .then(videoSegment => {
              videoUrls.push(videoSegment)
              callback()
            })
            .catch(error => {
              callback(error)
            })
        },
        async (error: unknown) => {
          if (error) {
            console.error('A video segment failed to process', error)
            throw new Error(`Error occurred in generating video: ${error}`)
          } else {
            // composite final video together
            const videoPath = await concatenateVideos(videoUrls)
            const videoFile = fs.readFileSync(videoPath as string)
            const videoBuffer = Buffer.from(videoFile)
            const { uri: outputUri } = await uploadBufferAsset(
              server,
              videoBuffer,
            )
            fs.unlinkSync(videoPath as string)

            // generate thumbnail
            const thumbnailImage = await createDialogueThumbnail(
              image1.uri,
              image2.uri,
              targetWidth,
              targetHeight,
            )
            const thumbnailUri = await uploadThumbnailAsset(
              server,
              thumbnailImage,
            )

            // send final update
            const output_final = {
              files: [outputUri],
              thumbnails: [thumbnailUri],
              name: config.prompt,
              progress: 1.0,
              isFinal: true,
            }

            const update = {
              id: task.id,
              status: 'succeeded',
              progress: 1,
              output: output_final,
              error: null,
            }

            await receiveTaskUpdate(server, update)
          }
        },
      )
    }
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'

    const update = {
      id: task.id,
      status: 'failed',
      progress: 0,
      output: null,
      error: errorMessage,
    }

    await receiveTaskUpdate(server, update)
  }
}

const getTransactionCost = (
  _: FastifyInstance,
  generator: any,
  generatorVersion: any,
  config: any,
) => {
  const cost = 50
  return cost
}

export { submitTask, getTransactionCost }
