'use client'

import { uploadFileToS3 } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import {
  AttachmentAdapter,
  CompleteAttachment,
  PendingAttachment,
} from '@assistant-ui/react'
import { PendingAttachmentStatus } from '@assistant-ui/react/dist/types/AttachmentTypes'
import axios, { CancelTokenSource } from 'axios'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

// Define a custom event for attachment updates
export const ATTACHMENT_UPDATE_EVENT = 'eden-attachment-update'

// Create a custom event emitter for attachment updates
export const emitAttachmentUpdate = (
  attachmentId: string,
  status: PendingAttachmentStatus,
) => {
  // console.log(`Emitting attachment update event for ${attachmentId}`);
  const event = new CustomEvent(ATTACHMENT_UPDATE_EVENT, {
    detail: { attachmentId, status },
  })
  window.dispatchEvent(event)
}

// Define a custom type that extends the base Attachment type with our cancelSource
type AttachmentWithCancelSource = {
  cancelSource?: CancelTokenSource
  uploadPromise?: Promise<File | undefined>
  isUploading?: boolean
}

const getFileDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)

    reader.readAsDataURL(file)
  })

// Map to track uploads in progress
const uploadsInProgress = new Map<
  string,
  {
    cancelSource: CancelTokenSource
    promise: Promise<File | undefined>
    updateProgress: (progress: number) => void
  }
>()

const edenImageAttachmentAdapter: AttachmentAdapter = {
  accept: 'image/*,video/*,audio/*',
  async add({ file }) {
    // For pre-uploaded files, return a pending attachment that completes immediately
    if ((file as File & { isPreUploaded?: boolean }).isPreUploaded) {
      return {
        id: uuidv4(),
        file,
        type: 'image' as const,
        name: file.name,
        contentType: file.type,
        status: { type: 'running', reason: 'uploading', progress: 1 },
      }
    }

    const id = uuidv4()
    const cancelSource = axios.CancelToken.source()
    let progressCallback: ((progress: number) => void) | null = null

    // Create the attachment object first so we can reference it in the upload
    const attachment: PendingAttachment = {
      id,
      file,
      type: 'image' as const,
      name: file.name,
      contentType: file.type,
      status: { type: 'running', reason: 'uploading', progress: 0 },
    }

    // Add our custom properties
    const attachmentWithExtras = attachment as PendingAttachment &
      AttachmentWithCancelSource
    attachmentWithExtras.cancelSource = cancelSource
    attachmentWithExtras.isUploading = true

    // Create a function to update the attachment's progress
    const updateProgress = (progress: number) => {
      if (progressCallback) {
        progressCallback(progress)
      }
    }

    // Start the upload
    const uploadPromise = uploadFileToS3({
      file,
      onUploadProgress: evt => {
        // Calculate progress as a value between 0 and 1
        const progress = evt.total ? evt.loaded / evt.total : 0

        // Log progress with more details
        // console.log(`Upload progress for ${file.name}: ${Math.round(progress * 100)}% (${evt.loaded}/${evt.total} bytes)`);

        // Update the attachment's progress
        updateProgress(progress)

        // Create a completely new status object to force a UI update
        if (attachment) {
          try {
            // Create a new status object with the current progress
            const newStatus: PendingAttachmentStatus = {
              type: 'running',
              reason: 'uploading',
              progress,
            }

            // Replace the entire status object
            attachment.status = newStatus

            // Emit an event to notify the UI that the attachment has been updated
            emitAttachmentUpdate(attachment.id, attachment.status)

            // console.log(`Status updated for ${file.name}: progress=${progress}, new status=`, attachment.status);
          } catch (error) {
            console.error('Error updating attachment status:', error)
          }
        }
      },
      cancelSource,
    }).catch(error => {
      if (axios.isCancel(error)) {
        toast.info(`Upload cancelled`, {
          description: file.name,
          dismissible: true,
        })
        // Update the attachment status to show it's cancelled
        if (progressCallback) {
          progressCallback(0)
          try {
            // Just set progress to 0 to indicate it's not uploading anymore
            const newStatus: PendingAttachmentStatus = {
              type: 'running',
              reason: 'uploading',
              progress: 0,
            }

            // Replace the entire status object
            attachment.status = newStatus

            // Create a completely new attachment object to force a UI update
            const newAttachment = { ...attachment }
            Object.assign(attachment, newAttachment)

            // Mark the attachment as not uploading anymore
            const attachmentWithExtras = attachment as PendingAttachment &
              AttachmentWithCancelSource
            attachmentWithExtras.isUploading = false

            // console.log(`Cancelled upload for ${attachment.name}, status updated:`, newStatus);
            // console.log(`Current attachment object after cancel:`, attachment);
          } catch (error) {
            console.error(
              'Error updating attachment status after cancel:',
              error,
            )
          }
        }
        // Remove from the tracking map
        uploadsInProgress.delete(id)
        return undefined
      }

      console.error('Upload error:', error)
      toast.error(`Failed to upload file!`, {
        description: file.name,
        dismissible: true,
        richColors: true,
      })
      throw error
    })

    // Store the upload in our map
    uploadsInProgress.set(id, {
      cancelSource,
      promise: uploadPromise,
      updateProgress,
    })

    // When the upload completes or fails, remove it from the map
    uploadPromise.finally(() => {
      uploadsInProgress.delete(id)
    })

    // Add a completion handler to update the attachment status when the upload completes
    uploadPromise
      .then(uploadedFile => {
        // Mark the attachment as not uploading
        const attachmentWithExtras = attachment as PendingAttachment &
          AttachmentWithCancelSource
        attachmentWithExtras.isUploading = false

        // Update the attachment's file reference with the uploaded file that has properties
        if (uploadedFile) {
          // Create a completely new attachment object to force React to detect the change
          const newAttachment = {
            ...attachment,
            file: uploadedFile,
            name: getCloudfrontOriginalUrl(
              (uploadedFile as File & { fileUrl: string }).fileUrl,
            ),
          }

          // Replace all properties to force object identity change
          Object.keys(attachment).forEach(key => {
            delete (attachment as Record<string, unknown>)[key]
          })
          Object.assign(attachment, newAttachment)

          // Force UI update immediately without setTimeout
          emitAttachmentUpdate(attachment.id, {
            type: 'running',
            reason: 'uploading',
            progress: 1,
          })

          // Emit again with tiny delay to trigger another render cycle
          setTimeout(() => {
            emitAttachmentUpdate(attachment.id, attachment.status)
          }, 1)
        }

        // Update the status to complete
        attachment.status = {
          type: 'running',
          reason: 'uploading',
          progress: 1,
        }

        // Emit an event to notify the UI that the attachment has been updated
        emitAttachmentUpdate(attachment.id, attachment.status)

        // console.log(`Status updated to complete for ${attachment.name}`);
      })
      .catch(error => {
        if (!axios.isCancel(error)) {
          console.error(`Error completing upload for ${file.name}:`, error)
        }
      })

    // Add the uploadPromise to the attachment
    attachmentWithExtras.uploadPromise = uploadPromise

    // Set up the progress callback to update the attachment's status
    progressCallback = progress => {
      // console.log('progressCallback', progress);
      try {
        // Create a new status object with the current progress
        const newStatus: PendingAttachmentStatus = {
          type: 'running',
          reason: 'uploading',
          progress,
        }

        // Replace the entire status object
        attachment.status = newStatus

        if (progress >= 1) {
          attachment.status = {
            type: 'running',
            reason: 'uploading',
            progress: 1,
          }
        }

        // Emit an event to notify the UI that the attachment has been updated
        emitAttachmentUpdate(attachment.id, newStatus)

        // Log the progress update for debugging
        // console.log(`Progress updated for ${attachment.name}: ${Math.round(progress * 100)}%, new status=`, attachment.status);
      } catch (error) {
        console.error('Error in progress callback:', error)
      }
    }

    return attachment
  },
  async send(attachment) {
    // For pre-uploaded files, use the fileUrl directly
    if ((attachment.file as File & { isPreUploaded?: boolean }).isPreUploaded) {
      // console.log('Sending pre-uploaded attachment:', attachment.name);
      return {
        ...attachment,
        content: [
          {
            type: 'image',
            image: (attachment.file as File & { fileUrl: string }).fileUrl,
          },
        ],
        status: { type: 'complete' },
      }
    }

    // console.log('sending new attachment', { attachment })
    return {
      ...{
        ...attachment,
        name: getCloudfrontOriginalUrl(
          (attachment.file as File & { fileUrl: string }).fileUrl,
        ),
      },
      content: [
        {
          type: 'image',
          image: await getFileDataURL(attachment.file),
        },
      ],
      status: { type: 'complete' },
    } as CompleteAttachment
  },
  async remove(attachment) {
    // console.log(`Removing attachment: ${attachment.name} (ID: ${attachment.id})`);

    // Mark the attachment as not uploading
    const attachmentWithCancel =
      attachment as unknown as AttachmentWithCancelSource
    if (attachmentWithCancel.isUploading) {
      // console.log(`Marking attachment as not uploading: ${attachment.name}`);
      attachmentWithCancel.isUploading = false

      try {
        // Update the status to show 0 progress
        const newStatus: PendingAttachmentStatus = {
          type: 'running',
          reason: 'uploading',
          progress: 0,
        }

        // Replace the entire status object
        attachment.status = newStatus

        // Create a completely new attachment object to force a UI update
        const newAttachment = { ...attachment }
        Object.assign(attachment, newAttachment)

        // Emit an event to notify the UI that the attachment has been updated
        emitAttachmentUpdate(attachment.id, newStatus)

        // console.log(`Status updated for removed attachment: ${attachment.name}`, newStatus);
        // console.log(`Current attachment object after remove:`, attachment);
      } catch (error) {
        console.error('Error updating attachment status in remove:', error)
      }
    }

    // Check if this attachment is in our uploads map
    if (uploadsInProgress.has(attachment.id)) {
      const upload = uploadsInProgress.get(attachment.id)
      if (upload) {
        // console.log(`Cancelling upload for attachment: ${attachment.name} (ID: ${attachment.id})`);
        upload.cancelSource.cancel('Upload cancelled by user')

        // Update the progress to 0 using the progress callback
        upload.updateProgress(0)

        uploadsInProgress.delete(attachment.id)
        // console.log(`Removed attachment from uploads map: ${attachment.name}`);
        return
      }
    }

    // Also try the attachment's cancelSource as a fallback
    if (attachmentWithCancel.cancelSource) {
      // console.log(`Cancelling upload using attachment cancelSource for: ${attachment.name}`);
      attachmentWithCancel.cancelSource.cancel('Upload cancelled by user')
    } else {
      // console.log(`No cancelSource found for attachment: ${attachment.name}`);
    }
  },
}

export default edenImageAttachmentAdapter
