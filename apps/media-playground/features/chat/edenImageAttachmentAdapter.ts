'use client'

import { uploadFileToS3 } from '@/lib/files'
import { AttachmentAdapter } from '@assistant-ui/react'
import { INTERNAL } from '@assistant-ui/react'
import axios, { AxiosProgressEvent, CancelTokenSource } from 'axios'
import { toast } from 'sonner'

const { generateId } = INTERNAL

const getFileDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)

    reader.readAsDataURL(file)
  })

const uploadAsset = async (
  file: File,
  onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
  cancelSource: CancelTokenSource,
) => {
  try {
    return uploadFileToS3({
      file,
      onUploadProgress,
      cancelSource,
    })
  } catch (e) {
    console.error(e)
    toast.error(`Failed to upload file!`, {
      description: file.name,
      dismissible: true,
      richColors: true,
    })
  }
}

const edenImageAttachmentAdapter: AttachmentAdapter = {
  accept: 'image/*',
  async add({ file }) {
    const cancelSource = axios.CancelToken.source()
    const asset = await uploadAsset(
      file,
      evt => {
        console.log(evt)
      },
      cancelSource,
    )

    console.log({ asset })

    return {
      id: generateId(),
      file,
      type: 'image',
      name: file.name,
      contentType: file.type,
      // status: { type: 'requires-action', reason: 'composer-send' },
      status: { type: 'running', reason: 'uploading', progress: 1 },
    }
  },
  async send(attachment) {
    console.log(attachment)
    return {
      ...{
        ...attachment,
        name: (attachment.file as File & { fileUrl: string }).fileUrl,
      },
      content: [
        {
          type: 'image',
          image: await getFileDataURL(attachment.file),
          // image: (attachment.file).fileUrl,
        },
      ],
      status: { type: 'complete' },
    }
  },
  async remove() {
    // noop
  },
}

export default edenImageAttachmentAdapter
