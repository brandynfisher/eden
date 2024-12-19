import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import { getFileTypeByMimeType } from '@/lib/files'
import { cn } from '@/lib/utils'
import { CreationV2 } from '@edenlabs/eden-sdk'
import React from 'react'

type Props = {
  creation: CreationV2
  isModal?: boolean
}

const CreationMediaPreview = ({ creation, isModal }: Props) => {
  const fileType =
    getFileTypeByMimeType(creation.mediaAttributes?.mimeType) || 'image'

  return (
    <div className="relative w-full my-4">
      {creation?.deleted ? (
        <div className="absolute inset-0 w-full h-full z-10 bg-accent/70 drop-shadow flex justify-center items-center">
          <div className="p-1 bg-destructive/50 text-destructive-foreground text-xs rounded-sm backdrop-blur-[2px]">
            deleted
          </div>
        </div>
      ) : null}
      {fileType === 'audio' ? (
        <div className="flex w-full h-full items-center justify-center min-h-64">
          <audio src={creation.url} controls={true} />
        </div>
      ) : (
        <LightboxGallery>
          <LightboxGalleryItem
            className={cn([
              'lg:absolute lg:h-full',
              isModal
                ? 'max-h-[calc(100dvh_-_130px)]'
                : 'max-h-[calc(100dvh_-_230px)]',
            ])}
            forceRender={true}
            item={{
              url: creation.url,
              thumbnail: creation.thumbnail,
              blurhash: creation.mediaAttributes?.blurhash,
              width: creation.mediaAttributes?.width,
              height: creation.mediaAttributes?.height,
              duration: creation.mediaAttributes?.duration || undefined,
            }}
          />
        </LightboxGallery>
      )}
    </div>
  )
}

export default CreationMediaPreview
