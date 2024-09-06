import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import { cn } from '@/lib/utils'
import { CreationV2 } from '@edenlabs/eden-sdk'
import React from 'react'

type Props = {
  creation: CreationV2
  isModal?: boolean
}

const CreationMediaPreview = ({ creation, isModal }: Props) => {
  return (
    <div className="relative w-full my-4">
      {creation.mediaAttributes?.type === 'audio' ? (
        <div className="flex w-full h-full items-center justify-center min-h-64">
          <audio src={creation.url} controls={true} />
        </div>
      ) : (
        <LightboxGallery withDownloadButton={true}>
          <LightboxGalleryItem
            className={cn([
              'lg:absolute lg:h-full',
              isModal
                ? 'max-h-[calc(100dvh_-_125px)]'
                : 'max-h-[calc(100dvh_-_172px)]',
            ])}
            forceRender={true}
            item={{
              url: creation.url,
              thumbnail: creation.thumbnail,
              blur: creation.mediaAttributes?.blur,
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
