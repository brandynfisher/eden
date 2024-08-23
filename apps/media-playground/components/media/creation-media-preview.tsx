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
    <div
      className="relative w-full my-4"
      // style={{ aspectRatio: creation?.mediaAttributes?.aspectRatio || 1 }}
    >
      {creation.mediaAttributes?.type === 'audio' ? (
        <div className="flex w-full h-full items-center justify-center">
          <audio src={creation.url} controls={true} />
        </div>
      ) : (
        <LightboxGallery withDownloadButton={true}>
          <LightboxGalleryItem
            className={cn([
              'md:absolute md:h-full',
              isModal ? 'h-[calc(100vh_-_112px)]' : 'h-[calc(100vh_-_176px)]',
            ])}
            forceRender={true}
            item={{
              url: creation.url,
              thumbnail: creation.thumbnail,
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
